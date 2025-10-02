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
  onConnected: (room: Room) => void;
  onParticipantsChanged: (participants: Map<string, RemoteParticipant>) => void;
  onLocalParticipantChanged: (participant: LocalParticipant) => void;
}

export function VideoPlayer({ sessionId, role, onConnected, onParticipantsChanged, onLocalParticipantChanged }: VideoPlayerProps) {
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

    let localTracks: (LocalTrack | RemoteTrack)[] = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraTrackRef.current = new LocalVideoTrack(stream.getVideoTracks()[0]);
      localTracks = [cameraTrackRef.current, ...stream.getAudioTracks().map(t => new LocalAudioTrack(t))];
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
        tracks: localTracks,
      });
      roomRef.current = room;
      onConnected(room);


      // Handle existing participants
      room.participants.forEach(p => handleParticipant(p, room));
      
      room.on('participantConnected', (p) => {
        handleParticipant(p, room);
        onParticipantsChanged(new Map(room.participants));
      });
      
      room.on('participantDisconnected', (p) => {
         onParticipantsChanged(new Map(room.participants));
      });
      
      window.addEventListener('beforeunload', () => room.disconnect());

    } catch (error) {
      let description = "Impossible d'établir la connexion à la session vidéo.";
      if (error instanceof Error) description = error.message;
      
      toast({ variant: 'destructive', title: 'Erreur de connexion vidéo', description });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, role, toast, onConnected, onParticipantsChanged]);


  const handleParticipant = (participant: RemoteParticipant, room: Room) => {
    participant.on('trackSubscribed', track => {
       // The logic to attach tracks is handled in the Participant component
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

  // This component handles the logic but doesn't render any visible UI itself.
  // The actual video rendering is done in Participant.tsx and VideoGrid.tsx.
  // We can show a global loading/error state if needed, but it's better handled in the parent.
  return null;
}
