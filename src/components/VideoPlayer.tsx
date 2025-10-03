// src/components/VideoPlayer.tsx
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import Video, { Room, LocalTrack, LocalVideoTrack, LocalAudioTrack } from 'twilio-video';


interface VideoPlayerProps {
  sessionId: string;
  role: string;
  userId: string;
  onConnected: (room: Room) => void;
}

export function VideoPlayer({ sessionId, role, userId, onConnected }: VideoPlayerProps) {
  const { toast } = useToast();
  const roomRef = useRef<Room | null>(null);
  
  const connectToRoom = useCallback(async (): Promise<Room | null> => {
    const participantName = `${role}-${userId.substring(0, 8)}`;
    console.log(`🔌 [VideoPlayer] Début de la connexion pour "${participantName}" à la session: ${sessionId.substring(0,8)}`);

    if (!participantName || !sessionId) {
        console.warn("⚠️ [VideoPlayer] Nom du participant ou ID de session manquant. Connexion annulée.");
        return null;
    }

    let localTracks: LocalTrack[] = [];
    try {
        console.log(`🎥 [VideoPlayer] Demande d'accès à la caméra et au microphone pour la session: ${sessionId.substring(0,8)}...`);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localTracks = [
            new LocalVideoTrack(stream.getVideoTracks()[0]),
            new LocalAudioTrack(stream.getAudioTracks()[0])
        ];
        console.log(`✅ [VideoPlayer] Accès média obtenu pour la session: ${sessionId.substring(0,8)}.`);
    } catch (error) {
        console.error(`💥 [VideoPlayer] Erreur d'accès média pour la session: ${sessionId.substring(0,8)}:`, error);
        toast({
            variant: 'destructive',
            title: "Accès Média Refusé",
            description: "Veuillez autoriser l'accès à la caméra et au microphone.",
        });
        return null;
    }
    
    try {
        console.log(`🔑 [VideoPlayer] Récupération du jeton d'accès Twilio pour la session: ${sessionId.substring(0,8)}...`);
        const response = await fetch('/api/twilio/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: participantName, room: sessionId })
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur serveur inconnue pour le jeton. Vérifiez la config serveur.');
        }
        
        const token = data.token;
        console.log(`✅ [VideoPlayer] Jeton Twilio reçu pour la session: ${sessionId.substring(0,8)}.`);
        
        console.log(`🚪 [VideoPlayer] Connexion à la salle Twilio "${sessionId.substring(0,8)}"...`);
        const room = await Video.connect(token, {
            name: sessionId,
            tracks: localTracks,
        });

        console.log(`✅ [VideoPlayer] Connecté avec succès à la salle "${sessionId.substring(0,8)}" en tant que "${room.localParticipant.identity}"`);
        onConnected(room);
        return room;
        
    } catch (error) {
        let description = "Impossible d'établir la connexion à la session vidéo.";
        if (error instanceof Error) description = error.message;
        
        console.error(`❌ [VideoPlayer] Erreur de connexion vidéo pour la session: ${sessionId.substring(0,8)}:`, description);
        toast({ variant: 'destructive', title: 'Erreur de Connexion Vidéo', description });
        return null;
    }
  }, [sessionId, role, userId, toast, onConnected]);

   useEffect(() => {
    connectToRoom().then(room => {
      roomRef.current = room;
    });

    return () => {
      // This cleanup function will be called on unmount.
      // In StrictMode, it's called prematurely, but roomRef.current might be null.
      // On the "real" unmount, roomRef.current will exist.
      if (roomRef.current && roomRef.current.state === 'connected') {
        console.log(`🚪 [VideoPlayer] Déconnexion de la salle "${roomRef.current.name.substring(0,8)}"`);
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  // The empty dependency array ensures this effect runs only once on mount and cleans up on unmount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  // This component handles the logic but doesn't render any visible UI itself.
  // The actual video rendering is done in Participant.tsx and VideoGrid.tsx.
  return null;
}
