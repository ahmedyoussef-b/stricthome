// components/VideoPlayer.tsx
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Video, { connect, createLocalTracks, LocalTrack, Room, TwilioError, LocalAudioTrack, LocalVideoTrack } from 'twilio-video';
import { useToast } from "@/hooks/use-toast";

interface VideoPlayerProps {
  sessionId: string;
  role: string;
  userId: string;
  onConnected: (room: Room) => void;
}

// Type guards to check track types
const isAudioTrack = (track: LocalTrack): track is LocalAudioTrack => track.kind === 'audio';
const isVideoTrack = (track: LocalTrack): track is LocalVideoTrack => track.kind === 'video';
const isAudioOrVideoTrack = (track: LocalTrack): track is LocalAudioTrack | LocalVideoTrack => isAudioTrack(track) || isVideoTrack(track);


export function VideoPlayer({ sessionId, role, userId, onConnected }: VideoPlayerProps) {
  const { toast } = useToast();
  const roomRef = useRef<Room | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const connectionAttemptedRef = useRef(false);

  useEffect(() => {
    // Garde pour le double montage de React Strict Mode en développement
    if (connectionAttemptedRef.current) {
        console.log('🔌 [VideoPlayer] Connexion déjà tentée, annulation de la nouvelle tentative.');
        return;
    }
    connectionAttemptedRef.current = true;
    console.log('🔌 [VideoPlayer] Montage pour:', userId, 'rôle:', role);


    const connectToRoom = async () => {
        console.log('▶️ [VideoPlayer] Début de la connexion pour la session', sessionId);

        try {
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
            console.log("✅ [VideoPlayer] Jeton Twilio reçu.");
            
            let localTracks: LocalTrack[] = [];
            try {
                console.log('🎥 [VideoPlayer] Demande d\'accès média...');
                localTracks = await createLocalTracks({
                    audio: true,
                    video: { width: 640 }
                });
                localTracksRef.current = localTracks;
                console.log('✅ [VideoPlayer] Médias locaux obtenus:', localTracks.length, 'pistes');
            } catch (err) {
                console.warn('⚠️ [VideoPlayer] Erreur accès médias:', err);
                let errorMsg = 'Impossible d\'accéder à la caméra ou au microphone. Vous pouvez continuer en mode spectateur.';
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError') {
                        errorMsg = "L'accès à la caméra/micro a été refusé. Vous êtes en mode spectateur.";
                    } else if (err.name === 'NotFoundError') {
                        errorMsg = "Aucun périphérique média trouvé. Vous êtes en mode spectateur.";
                    }
                }
                toast({
                    variant: "destructive",
                    title: "Accès Média",
                    description: errorMsg,
                })
            }
            
            // Prévention de reconnexion si une salle existe déjà
            if (roomRef.current) {
                console.log('🔌 [VideoPlayer] Une salle existe déjà, déconnexion de l\'ancienne avant de continuer.');
                roomRef.current.disconnect();
            }

            const room = await connect(data.token, {
                name: sessionId,
                tracks: localTracksRef.current,
            });

            console.log('✅ [VideoPlayer] Connecté à la room:', room.name);
            roomRef.current = room;
            onConnected(room);

        } catch (error) {
            console.error('❌ [VideoPlayer] Erreur de connexion:', error);
            let errorMsg = 'Erreur de connexion à la salle de visioconférence';
            if (error instanceof TwilioError) {
                    errorMsg = `Erreur Twilio ${error.code}: ${error.message}`;
            } else if (error instanceof Error) {
                    errorMsg = error.message;
            }
            toast({
                    variant: "destructive",
                    title: "Erreur de Connexion",
                    description: errorMsg,
            })
        }
    };
    
    connectToRoom();

    return () => {
        console.log('🧹 [VideoPlayer] Nettoyage du composant pour:', userId);
        if (roomRef.current) {
            console.log('🔌 [VideoPlayer] Déconnexion de la room lors du nettoyage.');
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        
        localTracksRef.current.forEach(track => {
            if (isAudioOrVideoTrack(track)) {
              track.stop();
            }
        });
        localTracksRef.current = [];
        connectionAttemptedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // Ce composant ne rend rien lui-même
}
