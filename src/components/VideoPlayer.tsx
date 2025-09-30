// src/components/VideoPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, VideoOff } from "lucide-react";
import Video, { Room, LocalTrack, RemoteTrack, LocalVideoTrack, LocalAudioTrack, RemoteVideoTrack, RemoteAudioTrack, Track } from 'twilio-video';


const isAttachable = (track: Track): track is LocalVideoTrack | LocalAudioTrack | RemoteVideoTrack | RemoteAudioTrack => {
  return typeof (track as any).attach === 'function';
};

const isDetachable = (track: Track): track is LocalVideoTrack | LocalAudioTrack | RemoteVideoTrack | RemoteAudioTrack => {
  return typeof (track as any).detach === 'function';
};

interface VideoPlayerProps {
  sessionId: string;
}

export function VideoPlayer({ sessionId }: VideoPlayerProps) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const roomRef = useRef<Room | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Participant name is hardcoded for now, but should be dynamic in a real app
    const participantName = `user-${Math.random().toString(36).substring(7)}`;

    const connectToRoom = async () => {
      if (!participantName || !sessionId) {
          console.warn("⚠️ [VideoPlayer] participantName ou sessionId manquant. Connexion annulée.");
          return;
      }
      setIsLoading(true);
      console.log(`📹 [VideoPlayer] Démarrage de la connexion pour l'utilisateur ${participantName} à la session ${sessionId}.`);

      try {
        console.log("🎤 [VideoPlayer] Demande d'accès aux périphériques média...");
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("✅ [VideoPlayer] Accès aux périphériques média autorisé.");
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
        console.log("🔑 [VideoPlayer] Génération du jeton d'accès via la route API...");
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
        console.log("✅ [VideoPlayer] Jeton d'accès généré.");

        console.log(`🚪 [VideoPlayer] Connexion à la salle Twilio "${sessionId}"...`);
        const room = await Video.connect(token, {
          name: sessionId,
          audio: true,
          video: { width: 640 }
        });
        console.log(`✅ [VideoPlayer] Connecté à la salle "${room.name}". SID: ${room.sid}`);
        roomRef.current = room;

        const attachTrack = (track: LocalTrack | RemoteTrack, container: HTMLElement | null) => {
          if (isAttachable(track)) {
            const element = track.attach();
            container?.appendChild(element);
          }
        };
        
        const detachTrack = (track: LocalTrack | RemoteTrack) => {
            if (isDetachable(track)) {
                track.detach().forEach(element => element.remove());
            }
        };

        // Attach local participant tracks
        console.log("📎 [VideoPlayer] Attachement des pistes locales...");
        room.localParticipant.tracks.forEach(publication => {
           if (publication.track) {
              console.log(`[VideoPlayer] Piste locale: ${publication.track.kind}`);
              attachTrack(publication.track, localVideoRef.current);
           }
        });

        // Attach existing remote participant tracks
        console.log(`[VideoPlayer] ${room.participants.size} participant(s) distant(s) déjà dans la salle.`);
        room.participants.forEach(participant => {
          console.log(`[VideoPlayer] Participant distant existant: ${participant.identity}`);
          participant.tracks.forEach(publication => {
            if (publication.track) {
              console.log(`[VideoPlayer] Piste distante existante: ${publication.track.kind}`);
              attachTrack(publication.track, remoteVideoRef.current);
            }
          });
          participant.on('trackSubscribed', track => {
            console.log(`[VideoPlayer] Souscription à une nouvelle piste de ${participant.identity}: ${track.kind}`);
            attachTrack(track, remoteVideoRef.current);
          });
        });

        // Handle new participants
        room.on('participantConnected', participant => {
            console.log(`➕ [VideoPlayer] Nouveau participant connecté: ${participant.identity}`);
            participant.on('trackSubscribed', track => {
              console.log(`[VideoPlayer] Souscription à une piste de ${participant.identity}: ${track.kind}`);
              attachTrack(track, remoteVideoRef.current);
            });
        });
        
        // Handle participant disconnection
        room.on('participantDisconnected', participant => {
           console.log(`➖ [VideoPlayer] Participant déconnecté: ${participant.identity}`);
           participant.tracks.forEach(publication => {
               if (publication.track) {
                   detachTrack(publication.track);
               }
           });
           // Clear the remote video ref if it was this participant
           if (remoteVideoRef.current) {
             remoteVideoRef.current.innerHTML = '';
           }
        });
        
        // Disconnect from the room when the window is closed
        console.log("🔄 [VideoPlayer] Ajout du listener 'beforeunload'.");
        window.addEventListener('beforeunload', () => room.disconnect());

      } catch (error) {
        console.error('💥 [VideoPlayer] Erreur de connexion à la salle Twilio:', error);
        
        let description = "Impossible d'établir la connexion à la session vidéo.";
        // Check if error is an object with 'code' property
        if (error && typeof error === 'object' && 'code' in error) {
          const twilioError = error as { code: number; message: string };
          if (twilioError.code === 20101 || twilioError.code === 20104) {
              description = "Le jeton d'accès est invalide ou a expiré. Veuillez rafraîchir la page."
          } else if (twilioError.message) {
              description = twilioError.message;
          }
        } else if (error instanceof Error) {
            description = error.message;
        }

        toast({
            variant: 'destructive',
            title: 'Erreur de connexion vidéo',
            description: description,
        });
      } finally {
        console.log("🏁 [VideoPlayer] Fin du bloc de connexion, arrêt du chargement.");
        setIsLoading(false);
      }
    };
    
    connectToRoom();

    return () => {
      if(roomRef.current) {
        console.log(`🚪 [VideoPlayer] Déconnexion de la salle: ${roomRef.current.name}`);
        roomRef.current.disconnect();
      }
    };
  }, [sessionId, toast]);

  const LoadingState = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-2 text-sm">Connexion à la session...</p>
    </div>
  );

  const NoPermissionState = (
     <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/20 text-destructive-foreground p-2 text-center">
        <VideoOff className="h-8 w-8 mb-2" />
        <p className="text-xs font-semibold">Caméra indisponible</p>
    </div>
  );

  return (
    <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center relative overflow-hidden">
        {/* Main area for remote video */}
        <div ref={remoteVideoRef} className="w-full h-full" />
        
        {/* Picture-in-picture for local video */}
        <div className="absolute bottom-2 right-2 w-1/4 max-w-[200px] h-auto z-10 border-2 border-background rounded-md overflow-hidden aspect-video">
            <div ref={localVideoRef} className="w-full h-full" />
        </div>
        
        {isLoading && hasPermission !== false && LoadingState}
        {hasPermission === false && NoPermissionState}
    </div>
  );
}
