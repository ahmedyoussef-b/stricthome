
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

  const connectToRoom = useCallback(async () => {
    console.log(`🔌 [VideoPlayer] Début de la connexion pour "${userId}" à la session: ${sessionId.substring(0,8)}`);

    if (!userId || !sessionId) {
        console.warn("⚠️ [VideoPlayer] ID utilisateur ou ID de session manquant. Connexion annulée.");
        return null;
    }

    let localTracks: LocalTrack[] = [];
    try {
        console.log(`🎥 [VideoPlayer] Demande d'accès à la caméra et au microphone...`);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localTracks = [
            new LocalVideoTrack(stream.getVideoTracks()[0]),
            new LocalAudioTrack(stream.getAudioTracks()[0])
        ];
        console.log(`✅ [VideoPlayer] Accès média obtenu.`);
    } catch (error) {
        console.error(`💥 [VideoPlayer] Erreur d'accès média:`, error);
        toast({
            variant: 'destructive',
            title: "Accès Média Refusé",
            description: "Veuillez autoriser l'accès à la caméra et au microphone.",
        });
        return null;
    }
    
    try {
        console.log(`🔑 [VideoPlayer] Récupération du jeton d'accès Twilio...`);
        const response = await fetch('/api/twilio/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: userId, room: sessionId, role: role })
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur serveur inconnue pour le jeton.');
        }
        
        const token = data.token;
        console.log(`✅ [VideoPlayer] Jeton Twilio reçu.`);
        
        console.log(`🚪 [VideoPlayer] Connexion à la salle Twilio "${sessionId.substring(0,8)}"...`);
        const room = await Video.connect(token, {
            name: sessionId,
            tracks: localTracks,
        });

        console.log(`✅ [VideoPlayer] Connecté avec succès à la salle "${room.name.substring(0,8)}" en tant que "${room.localParticipant.identity}"`);
        onConnected(room);
        return room;
        
    } catch (error) {
        let description = "Impossible d'établir la connexion à la session vidéo.";
        if (error instanceof Error) {
            // Spécifier le message pour l'erreur d'identité dupliquée
            if (error.message.includes('53118')) { // 53118 est le code d'erreur Twilio pour "Participant-Dupliqué"
                 description = "Un utilisateur avec la même identité est déjà connecté. Essayez de rafraîchir la page."
            } else {
                 description = error.message;
            }
        }
        
        console.error(`❌ [VideoPlayer] Erreur de connexion vidéo:`, description);
        toast({ variant: 'destructive', title: 'Erreur de Connexion Vidéo', description });

        // Arrêter les pistes locales si la connexion a échoué
        localTracks.forEach(track => {
            if (track.stop) {
                track.stop();
            }
        });

        return null;
    }
  }, [sessionId, role, userId, toast, onConnected]);

   useEffect(() => {
    // Cette ref garantit que l'effet ne s'exécute qu'une seule fois en StrictMode
    let ignore = false;
    
    if (!ignore) {
        connectToRoom().then(room => {
          if (room) {
             roomRef.current = room;
          }
        });
    }

    return () => {
      ignore = true;
      // La fonction de nettoyage se déclenche au démontage du composant
      if (roomRef.current && roomRef.current.state === 'connected') {
        console.log(`🚪 [VideoPlayer] Déconnexion de la salle "${roomRef.current.name.substring(0,8)}"`);
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  // Ce composant gère la logique mais ne rend aucune UI visible lui-même.
  // Le rendu vidéo est géré dans Participant.tsx et VideoGrid.tsx.
  return null;
}
