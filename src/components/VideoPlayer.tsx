// src/components/VideoPlayer.tsx
'use client';

import { useEffect, useRef } from 'react';
import Video, { Room, LocalTrack, LocalVideoTrack, LocalAudioTrack, LocalParticipant } from 'twilio-video';
import { useToast } from "@/hooks/use-toast";

interface VideoPlayerProps {
  sessionId: string;
  role: string;
  userId: string;
  onConnected: (room: Room) => void;
}

export function VideoPlayer({ sessionId, role, userId, onConnected }: VideoPlayerProps) {
  const { toast } = useToast();
  const roomRef = useRef<Room | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const cleanupTracks = () => {
      localTracksRef.current.forEach(track => {
        if (track.kind === 'audio' || track.kind === 'video') {
            track.stop();
        }
      });
      localTracksRef.current = [];
    };

    const connectToRoom = async () => {
      if (isConnectingRef.current || roomRef.current) {
        return;
      }
      isConnectingRef.current = true;
      
      console.log(`🔌 [VideoPlayer] Début de la connexion pour "${userId}"`);

      try {
        console.log("🎥 [VideoPlayer] Demande d'accès média...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            isConnectingRef.current = false;
            return;
        }

        console.log("✅ [VideoPlayer] Permission média obtenue.");

        localTracksRef.current = [
            new LocalVideoTrack(stream.getVideoTracks()[0]),
            new LocalAudioTrack(stream.getAudioTracks()[0])
        ];
        
        console.log("🔑 [VideoPlayer] Récupération du jeton Twilio...");
        const response = await fetch('/api/twilio/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: userId, room: sessionId, role: role })
        });
        const data = await response.json();

        if (!response.ok || !data.token) {
          throw new Error(data.error || 'Erreur serveur pour le jeton.');
        }

        if (!isMounted) {
            cleanupTracks();
            isConnectingRef.current = false;
            return;
        }

        console.log("✅ [VideoPlayer] Jeton Twilio reçu.");
        console.log(`🚪 [VideoPlayer] Connexion à la salle "${sessionId.substring(0, 8)}"...`);
        
        const room = await Video.connect(data.token, {
          name: sessionId,
          tracks: localTracksRef.current,
        });

        if (!isMounted) {
            room.disconnect();
            cleanupTracks();
            isConnectingRef.current = false;
            return;
        }
        
        console.log(`✅ [VideoPlayer] Connecté à la salle "${room.name.substring(0,8)}" en tant que "${room.localParticipant.identity}"`);
        roomRef.current = room;
        onConnected(room);
        isConnectingRef.current = false;

      } catch (error) {
        if (!isMounted) {
            isConnectingRef.current = false;
            return;
        }
        
        let description = "Impossible d'établir la connexion vidéo.";
        if (error instanceof Error) {
            if (error.message.includes('53118')) {
                description = "Un utilisateur avec la même identité est déjà connecté.";
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.message.includes('media')) {
                // This case is now primarily handled by the parent component, but kept as a fallback.
                description = "Veuillez autoriser l'accès à la caméra et au microphone dans votre navigateur.";
            }
        }
        
        console.error("❌ [VideoPlayer] Erreur de connexion:", error);
        toast({ variant: 'destructive', title: 'Erreur de Connexion Vidéo', description });
        
        cleanupTracks();
        isConnectingRef.current = false;
      }
    };

    connectToRoom();

    return () => {
      console.log("🧹 [VideoPlayer] Nettoyage du composant.");
      isMounted = false;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      cleanupTracks();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, role, userId]);

  return null;
}

    