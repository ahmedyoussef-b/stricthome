// src/components/VideoPlayer.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Video, { Room, LocalTrack, RemoteParticipant, LocalParticipant, LocalVideoTrack, LocalAudioTrack } from 'twilio-video';


interface VideoPlayerProps {
  sessionId: string;
  role: string;
  userId: string;
  onConnected: (room: Room) => void;
}

export function VideoPlayer({ sessionId, role, userId, onConnected }: VideoPlayerProps) {
  const roomRef = useRef<Room | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const connectToRoom = async () => {
        const participantName = `${role}-${userId.substring(0, 8)}`;
        console.log(`🔌 [VideoPlayer] Début de la connexion pour "${participantName}" à la session: ${sessionId.substring(0,8)}`);

        if (!participantName || !sessionId) {
            console.warn("⚠️ [VideoPlayer] Nom du participant ou ID de session manquant. Connexion annulée.");
            return;
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
            return;
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
            roomRef.current = room;
            console.log(`✅ [VideoPlayer] Connecté avec succès à la salle "${sessionId.substring(0,8)}" en tant que "${room.localParticipant.identity}"`);
            onConnected(room);
            
            window.addEventListener('beforeunload', () => room.disconnect());

        } catch (error) {
            let description = "Impossible d'établir la connexion à la session vidéo.";
            if (error instanceof Error) description = error.message;
            
            console.error(`❌ [VideoPlayer] Erreur de connexion vidéo pour la session: ${sessionId.substring(0,8)}:`, description);
            toast({ variant: 'destructive', title: 'Erreur de Connexion Vidéo', description });
        }
    };

    connectToRoom();

    return () => {
      if(roomRef.current) {
        console.log(`🚪 [VideoPlayer] Déconnexion de la salle "${roomRef.current.name.substring(0,8)}"`);
        roomRef.current.disconnect();
      }
    };
  }, [sessionId, role, userId, toast, onConnected]);


  // This component handles the logic but doesn't render any visible UI itself.
  // The actual video rendering is done in Participant.tsx and VideoGrid.tsx.
  return null;
}
