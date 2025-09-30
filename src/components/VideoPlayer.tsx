// src/components/VideoPlayer.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, VideoOff } from "lucide-react";
import Video, { Room, LocalTrack, RemoteTrack, LocalVideoTrack, LocalAudioTrack, RemoteVideoTrack, RemoteAudioTrack, Track, LocalVideoTrackPublication, createLocalVideoTrack, RemoteParticipant, LocalParticipant } from 'twilio-video';
import { VideoControls } from "./VideoControls";

const isAttachable = (track: Track): track is LocalVideoTrack | LocalAudioTrack | RemoteVideoTrack | RemoteAudioTrack => {
  return typeof (track as any).attach === 'function';
};

interface VideoPlayerProps {
  sessionId: string;
  role: 'teacher' | 'student';
  onParticipantsChanged: (participants: RemoteParticipant[]) => void;
  onLocalParticipantChanged: (participant: LocalParticipant) => void;
}

export function VideoPlayer({ sessionId, role, onParticipantsChanged, onLocalParticipantChanged }: VideoPlayerProps) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null); // Only for student view now
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const screenTrackRef = useRef<LocalVideoTrack | null>(null);
  const cameraTrackRef = useRef<LocalVideoTrack | null>(null);
  const { toast } = useToast();
  
  const connectToRoom = useCallback(async () => {
    const participantName = `${role}-${Math.random().toString(36).substring(7)}`;

    if (!participantName || !sessionId) {
        console.warn("⚠️ [VideoPlayer] participantName ou sessionId manquant. Connexion annulée.");
        return;
    }
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraTrackRef.current = new LocalVideoTrack(stream.getVideoTracks()[0]);
      setHasPermission(true);
    } catch (error) {
      console.error("💥 [VideoPlayer] Erreur d'accès aux média:", error);
      setHasPermission(false);
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Accès média refusé',
        description: "Veuillez autoriser l'accès à la caméra et au microphone.",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: participantName, room: sessionId })
      });
      
      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || 'Erreur inconnue du serveur de jetons. Vérifiez la configuration serveur.');
      }
      
      const token = data.token;
      
      const room = await Video.connect(token, {
        name: sessionId,
        audio: true,
        tracks: cameraTrackRef.current ? [cameraTrackRef.current] : [],
      });
      roomRef.current = room;

      onLocalParticipantChanged(room.localParticipant);

      // In student view, attach teacher's video (assuming teacher is the first participant)
      const mainRemoteContainer = role === 'student' ? remoteVideoRef.current : null;

      const updateParticipants = () => {
        const remoteParticipants = Array.from(room.participants.values());
        onParticipantsChanged(remoteParticipants);
      };
      
      updateParticipants();

      room.participants.forEach(p => handleParticipant(p, room, mainRemoteContainer));

      room.on('participantConnected', (p) => {
        handleParticipant(p, room, mainRemoteContainer);
        updateParticipants();
      });
      
      room.on('participantDisconnected', (p) => {
         updateParticipants();
      });
      
      window.addEventListener('beforeunload', () => room.disconnect());

    } catch (error) {
      let description = "Impossible d'établir la connexion à la session vidéo.";
      if (error instanceof Error) description = error.message;
      
      toast({ variant: 'destructive', title: 'Erreur de connexion vidéo', description });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, role, toast, onParticipantsChanged, onLocalParticipantChanged]);


  const handleParticipant = (participant: RemoteParticipant, room: Room, container: HTMLDivElement | null) => {
    participant.on('trackSubscribed', track => {
      if (container && isAttachable(track)) {
        container.innerHTML = ''; // Clear previous video
        container.appendChild(track.attach());
      }
    });
  };

  useEffect(() => {
    connectToRoom();

    return () => {
      if(roomRef.current) {
        roomRef.current.disconnect();
      }
      cameraTrackRef.current?.stop();
      screenTrackRef.current?.stop();
    };
  }, [connectToRoom]);

  const toggleScreenShare = async () => {
    const room = roomRef.current;
    if (!room) return;

    if (!isSharingScreen) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = new LocalVideoTrack(stream.getTracks()[0]);
        screenTrackRef.current = screenTrack;

        if (cameraTrackRef.current) {
            await room.localParticipant.unpublishTrack(cameraTrackRef.current);
            cameraTrackRef.current.stop();
        }
        await room.localParticipant.publishTrack(screenTrack);
        setIsSharingScreen(true);
        toast({ title: "Partage d'écran activé" });

        screenTrack.on('stopped', () => toggleScreenShare());

      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de démarrer le partage d'écran." });
      }
    } else {
      if (screenTrackRef.current) {
        room.localParticipant.unpublishTrack(screenTrackRef.current);
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraTrackRef.current = new LocalVideoTrack(stream.getVideoTracks()[0]);
            await room.localParticipant.publishTrack(cameraTrackRef.current);
        } catch (e) {
            console.error("Failed to re-acquire camera", e);
        }

        setIsSharingScreen(false);
        toast({ title: "Partage d'écran arrêté" });
      }
    }
  };

  const LoadingState = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-2 text-sm">Connexion à la session...</p>
    </div>
  );

  const NoPermissionState = (
     <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/20 text-destructive-foreground p-2 text-center z-10">
        <VideoOff className="h-8 w-8 mb-2" />
        <p className="text-xs font-semibold">Caméra indisponible</p>
    </div>
  );
  
  if (role === 'teacher') {
      return (
          <>
            {isLoading && hasPermission !== false && LoadingState}
            {hasPermission === false && NoPermissionState}
            {!isLoading && (
                 <VideoControls 
                    isSharingScreen={isSharingScreen}
                    onToggleScreenShare={toggleScreenShare}
                />
            )}
          </>
      )
  }

  // Student View
  return (
    <div className="w-full h-full bg-muted rounded-md flex items-center justify-center relative overflow-hidden group">
      {/* Main area for remote video (teacher) */}
      <div ref={remoteVideoRef} className="w-full h-full object-contain" />
        
      {/* Picture-in-picture for student's local video */}
      <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] h-auto z-20 border-2 border-background rounded-md overflow-hidden aspect-video shadow-lg">
          <div ref={localVideoRef} className="w-full h-full" />
      </div>
        
      {isLoading && hasPermission !== false && LoadingState}
      {hasPermission === false && NoPermissionState}
    </div>
  );
}
