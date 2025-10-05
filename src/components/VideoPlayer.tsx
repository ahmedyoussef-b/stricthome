// src/components/VideoPlayer.tsx
'use client';

import { useEffect, useRef } from 'react';
import Video, { Room, LocalTrack } from 'twilio-video';
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
    console.log(`🔌 [VideoPlayer] Montage pour: ${userId}, rôle: ${role}`);
    let isMounted = true;

    const cleanupTracks = () => {
      console.log("🧹 [VideoPlayer] Nettoyage des pistes locales.");
      localTracksRef.current.forEach(track => {
        if ('stop' in track && typeof track.stop === 'function') {
          track.stop();
        }
      });
      localTracksRef.current = [];
    };

    const connectToRoom = async () => {
      if (isConnectingRef.current || roomRef.current) {
        console.log("🔌 [VideoPlayer] Connexion déjà en cours ou établie. Annulation.");
        return;
      }
      isConnectingRef.current = true;
      
      console.log(`🔌 [VideoPlayer] Début de la connexion pour "${userId}"`);

      try {
        console.log("🎥 [VideoPlayer] Demande d'accès média (caméra/micro)...");
        const localTracks = await Video.createLocalTracks({
            audio: true,
            video: { width: 640 }
        });
        
        if (!isMounted) {
            console.log("🔌 [VideoPlayer] Le composant a été démonté pendant l'obtention des pistes. Annulation.");
            localTracks.forEach(track => track.stop());
            isConnectingRef.current = false;
            return;
        }

        localTracksRef.current = localTracks;
        console.log("✅ [VideoPlayer] Accès média obtenu et pistes locales créées.");
        
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
            console.log("🔌 [VideoPlayer] Le composant a été démonté pendant la récupération du jeton. Annulation.");
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
            console.log("🔌 [VideoPlayer] Le composant a été démonté pendant la connexion à la salle. Déconnexion.");
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
                description = "Veuillez autoriser l'accès à la caméra et au microphone.";
            }
        }
        
        console.error("❌ [VideoPlayer] Erreur de connexion:", error);
        toast({ variant: 'destructive', title: 'Erreur de Connexion', description });
        
        cleanupTracks();
        isConnectingRef.current = false;
      }
    };

    connectToRoom();

    return () => {
      console.log(`🧹 [VideoPlayer] Nettoyage du composant pour ${userId}.`);
      isMounted = false;
      if (roomRef.current) {
        console.log(`🚪 [VideoPlayer] Déconnexion de la salle ${roomRef.current.name.substring(0,8)}.`);
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      cleanupTracks();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, role, userId]);

  return null;
}
