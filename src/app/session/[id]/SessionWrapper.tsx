// app/session/[id]/SessionWrapper.tsx
'use client';

import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher/client';
import { useToast } from '@/hooks/use-toast';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';
import type { UserWithClasse, StudentWithCareer } from '@/lib/types';
import { Role, CoursSession } from '@prisma/client';
import { useWebRTCStable } from '@/hooks/useWebRTCStable';

export type SessionViewMode = 'split' | 'camera' | 'whiteboard';
export type UnderstandingStatus = 'understood' | 'confused' | 'lost' | 'none';
type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export function SessionWrapper({ sessionId, localStream }: { sessionId: string; localStream: MediaStream | null }) {
    const router = useRouter();
    const { data: authSession, status: authStatus } = useSession();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [sessionData, setSessionData] = useState<{ session: CoursSession, students: StudentWithCareer[], teacher: any } | null>(null);
    const [allSessionUsers, setAllSessionUsers] = useState<SessionParticipant[]>([]);
    const [remoteParticipants, setRemoteParticipants] = useState<{ id: string, stream: MediaStream }[]>([]);
    const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
    const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
    const [understandingStatus, setUnderstandingStatus] = useState<Map<string, UnderstandingStatus>>(new Map());
    const [spotlightedUserId, setSpotlightedUserId] = useState<string | null>(null);
    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(null);
    const [sessionView, setSessionView] = useState<SessionViewMode>('split');
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [currentUnderstanding, setCurrentUnderstanding] = useState<UnderstandingStatus>('none');
    const [isPusherInitialized, setIsPusherInitialized] = useState(false);

    const [isEnding, startEndingTransition] = useTransition();

    const role = searchParams.get('role');
    const userId = authSession?.user.id;
    const isTeacher = role === 'teacher';

    const handleLeaveSession = useCallback(() => {
        peerConnections.forEach(pc => pc.close());
        setPeerConnections(new Map());
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        router.push(isTeacher ? '/teacher' : `/student/${userId}`);
    }, [peerConnections, localStream, router, isTeacher, userId]);

    // Redirection et gestion de fin de session
    useEffect(() => {
        if (authStatus === 'loading') return;
        if (authStatus === 'unauthenticated' || !role || !userId) {
            router.replace('/login');
        }

        const sessionChannelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(sessionChannelName);
        channel.bind('session-ended', () => {
            toast({
                title: "Session Terminée",
                description: "Le professeur a mis fin à la session.",
            });
            handleLeaveSession();
        });

        return () => {
            pusherClient.unsubscribe(sessionChannelName);
        };

    }, [authStatus, role, userId, router, sessionId, toast, handleLeaveSession]);


    const createPeerConnection = useCallback((remoteUserId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = event => {
            if (event.candidate) {
                fetch('/api/webrtc/signal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        toUserId: remoteUserId,
                        fromUserId: userId,
                        signal: { type: 'candidate', candidate: event.candidate },
                    }),
                });
            }
        };

        pc.ontrack = event => {
            setRemoteParticipants(prev => {
                if (prev.some(p => p.id === remoteUserId)) return prev;
                return [...prev, { id: remoteUserId, stream: event.streams[0] }];
            });
        };

        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        return pc;
    }, [localStream, sessionId, userId]);

    const createOffer = useCallback(async (pc: RTCPeerConnection, remoteUserId: string) => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await fetch('/api/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                toUserId: remoteUserId,
                fromUserId: userId,
                signal: { type: 'offer', sdp: offer.sdp },
            }),
        });
    }, [sessionId, userId]);


    // Fetch session data
    useEffect(() => {
        if (!sessionId) return;
        fetch(`/api/session/${sessionId}/details`)
            .then(res => res.json())
            .then(data => {
                if (data.session) {
                    setSessionData(data);
                    const users = [data.teacher, ...data.students];
                    setAllSessionUsers(users);
                    setSpotlightedUserId(data.session.spotlightedParticipantSid);
                    setWhiteboardControllerId(data.session.whiteboardControllerId);
                } else {
                    toast({ variant: 'destructive', title: 'Erreur', description: 'Session non trouvée' });
                    router.push('/teacher');
                }
            });
    }, [sessionId, router, toast]);

    // Pusher and WebRTC Initialization
    useEffect(() => {
        if (!userId || !localStream || !sessionData || isPusherInitialized) return;

        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);

        const initializeConnections = (members: any) => {
            const otherUserIds = Object.keys(members).filter(id => id !== userId);
            const newPeerConnections = new Map<string, RTCPeerConnection>();
            
            otherUserIds.forEach(remoteUserId => {
                const pc = createPeerConnection(remoteUserId);
                newPeerConnections.set(remoteUserId, pc);
                if (isTeacher) { // Teacher initiates offers
                    createOffer(pc, remoteUserId);
                }
            });
            setPeerConnections(newPeerConnections);
        };
        
        channel.bind('pusher:subscription_succeeded', (members: any) => {
            setOnlineUserIds(Object.keys(members.members));
            if (!isTeacher) { // Students wait for offers, teacher initiates
                initializeConnections(members.members);
            }
        });
        
        channel.bind('pusher:member_added', (member: any) => {
             setOnlineUserIds(prev => [...prev, member.id]);
             if (isTeacher) {
                const pc = createPeerConnection(member.id);
                setPeerConnections(prev => new Map(prev).set(member.id, pc));
                createOffer(pc, member.id);
             }
        });

        channel.bind('pusher:member_removed', (member: any) => {
             setOnlineUserIds(prev => prev.filter(id => id !== member.id));
             setPeerConnections(prev => {
                const newPcs = new Map(prev);
                newPcs.get(member.id)?.close();
                newPcs.delete(member.id);
                return newPcs;
             });
             setRemoteParticipants(prev => prev.filter(p => p.id !== member.id));
        });

        channel.bind('webrtc-signal', async (data: any) => {
            if (data.toUserId !== userId) return;

            const pc = peerConnections.get(data.fromUserId);
            if (!pc) return;

            if (data.signal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await fetch('/api/webrtc/signal', {
                    method: 'POST',
                    body: JSON.stringify({
                        sessionId,
                        toUserId: data.fromUserId,
                        fromUserId: userId,
                        signal: { type: 'answer', sdp: answer.sdp },
                    }),
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if (data.signal.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
            } else if (data.signal.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
            }
        });
        
        channel.bind('participant-spotlighted', (data: { participantId: string }) => setSpotlightedUserId(data.participantId));
        channel.bind('whiteboard-control-changed', (data: { controllerId: string | null }) => setWhiteboardControllerId(data.controllerId));
        channel.bind('hand-raise-toggled', (data: { userId: string, isRaised: boolean }) => {
            setRaisedHands(prev => {
                const newSet = new Set(prev);
                if (data.isRaised) newSet.add(data.userId);
                else newSet.delete(data.userId);
                return newSet;
            });
        });
        channel.bind('understanding-status-updated', (data: { userId: string, status: UnderstandingStatus }) => {
            setUnderstandingStatus(prev => new Map(prev).set(data.userId, data.status));
        });

        setIsPusherInitialized(true);

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
            peerConnections.forEach(pc => pc.close());
            setIsPusherInitialized(false);
        };
    }, [userId, localStream, sessionData, isPusherInitialized, sessionId, createPeerConnection, isTeacher, peerConnections, createOffer]);


    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const broadcastTimerEvent = (event: 'timer-started' | 'timer-paused' | 'timer-reset', time?: number) => {
        fetch('/api/session/timer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, event, time }),
        });
    };

    const handleStartTimer = () => { setIsTimerRunning(true); broadcastTimerEvent('timer-started', timeLeft); };
    const handlePauseTimer = () => { setIsTimerRunning(false); broadcastTimerEvent('timer-paused', timeLeft); };
    const handleResetTimer = () => { setTimeLeft(15 * 60); setIsTimerRunning(false); broadcastTimerEvent('timer-reset', 15 * 60); };

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isTimerRunning, timeLeft]);

    useEffect(() => {
        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);
        channel.bind('timer-started', (data: { time: number }) => { setTimeLeft(data.time); setIsTimerRunning(true); });
        channel.bind('timer-paused', (data: { time: number }) => { setTimeLeft(data.time); setIsTimerRunning(false); });
        channel.bind('timer-reset', (data: { time: number }) => { setTimeLeft(data.time); setIsTimerRunning(false); });
        return () => pusherClient.unsubscribe(channelName);
    }, [sessionId]);

    const onToggleHandRaise = useCallback(async () => {
        const newIsRaised = !isHandRaised;
        setIsHandRaised(newIsRaised);
        await fetch(`/api/session/${sessionId}/raise-hand`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, isRaised: newIsRaised }),
        });
    }, [isHandRaised, sessionId, userId]);

    const onUnderstandingChange = useCallback(async (status: UnderstandingStatus) => {
        setCurrentUnderstanding(status);
         await fetch(`/api/session/${sessionId}/understanding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
    }, [sessionId, userId]);

    const spotlightedUser = allSessionUsers.find(u => u.id === spotlightedUserId);
    
    if (authStatus === 'loading' || !sessionData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-muted/30">
            <SessionHeader 
                sessionId={sessionId} 
                isTeacher={isTeacher}
                onLeaveSession={handleLeaveSession}
                timeLeft={timeLeft}
                isTimerRunning={isTimerRunning}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResetTimer={handleResetTimer}
            />
            {isTeacher ? (
                 <TeacherSessionView
                    sessionId={sessionId}
                    localStream={localStream}
                    remoteParticipants={remoteParticipants}
                    spotlightedUser={spotlightedUser}
                    allSessionUsers={allSessionUsers}
                    onlineUserIds={onlineUserIds}
                    onSpotlightParticipant={(participantId) => fetch(`/api/session/${sessionId}/spotlight`, { method: 'POST', body: JSON.stringify({ participantId }), headers: {'Content-Type': 'application/json'} })}
                    onGiveWhiteboardControl={(participantId) => fetch(`/api/session/${sessionId}/whiteboard-control`, { method: 'POST', body: JSON.stringify({ participantId }), headers: {'Content-Type': 'application/json'} })}
                    raisedHands={raisedHands}
                    understandingStatus={understandingStatus}
                    sessionView={sessionView}
                    onSetSessionView={setSessionView}
                />
            ) : (
                <StudentSessionView
                    sessionId={sessionId}
                    localStream={localStream}
                    remoteStreams={new Map(remoteParticipants.map(p => [p.id, p.stream]))}
                    spotlightedStream={remoteParticipants.find(p => p.id === spotlightedUserId)?.stream ?? (spotlightedUserId === userId ? localStream : null)}
                    spotlightedUser={spotlightedUser}
                    isHandRaised={isHandRaised}
                    onToggleHandRaise={onToggleHandRaise}
                    onGiveWhiteboardControl={(participantId) => {}}
                    sessionView={sessionView}
                    onUnderstandingChange={onUnderstandingChange}
                    currentUnderstanding={currentUnderstanding}
                />
            )}
        </div>
    );
}
