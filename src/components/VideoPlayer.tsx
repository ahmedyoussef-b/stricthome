// components/VideoPlayer.tsx - Version améliorée
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Video, { connect, createLocalTracks, LocalTrack, Room, TwilioError } from 'twilio-video';
import { useToast } from "@/hooks/use-toast";

interface VideoPlayerProps {
  sessionId: string;
  role: string;
  userId: string;
  onConnected: (room: Room) => void;
}

export function VideoPlayer({ sessionId, role, userId, onConnected }: VideoPlayerProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const connectionAttemptedRef = useRef(false);

  console.log('🔌 [VideoPlayer] Montage pour:', userId, 'rôle:', role);

  const connectToRoom = useCallback(async () => {
    if (connectionAttemptedRef.current || roomRef.current) {
      console.log('🔌 [VideoPlayer] Connexion déjà en cours ou établie. Annulation.');
      return;
    }

    connectionAttemptedRef.current = true;
    setIsConnecting(true);
    setMediaError(null);
    console.log('▶️ [VideoPlayer] Début de la connexion pour la session', sessionId);

    try {
      // Fetch token first
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
        setMediaError(errorMsg);
        toast({
            variant: "destructive",
            title: "Accès Média",
            description: errorMsg,
        })
      }

      localTracksRef.current = localTracks;

      const room = await connect(data.token, {
        name: sessionId,
        tracks: localTracks,
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
      setMediaError(errorMsg);
       toast({
            variant: "destructive",
            title: "Erreur de Connexion",
            description: errorMsg,
       })
    } finally {
      setIsConnecting(false);
    }
  }, [sessionId, role, userId, onConnected, toast]);

  useEffect(() => {
    // StrictMode double-mount guard
    if (connectionAttemptedRef.current) {
        return;
    }
    connectToRoom();

    return () => {
      console.log('🧹 [VideoPlayer] Nettoyage du composant pour', userId);
      
      if (roomRef.current) {
        console.log('🔌 [VideoPlayer] Déconnexion de la room');
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      
      localTracksRef.current.forEach(track => {
        if ('stop' in track) {
            track.stop();
        }
      });
      localTracksRef.current = [];
      
      connectionAttemptedRef.current = false;
    };
  }, [connectToRoom, userId]);

  return null; // This component does not render anything itself
}
