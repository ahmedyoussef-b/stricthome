// src/components/VideoPlayer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Video, { Room, LocalTrack, LocalVideoTrack, LocalAudioTrack, ConnectOptions } from 'twilio-video';
import { useToast } from "@/hooks/use-toast";

interface VideoPlayerProps {
  sessionId: string;
  role: string;
  userId: string;
  onConnected: (room: Room) => void;
  onTracksPublished?: (tracks: LocalTrack[]) => void;
}

export function VideoPlayer({ sessionId, role, userId, onConnected, onTracksPublished }: VideoPlayerProps) {
  const { toast } = useToast();
  const roomRef = useRef<Room | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const cleanupTracks = () => {
      localTracksRef.current.forEach(track => {
        // Check if track is not a DataTrack and has a stop method
        if ('stop' in track && typeof track.stop === 'function') {
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
        console.log("🎥 [VideoPlayer] Demande d'accès média pour les pistes...");
        
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissions.state === 'denied') {
          throw new Error('Permissions caméra/micro refusées');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24 }
          }, 
          audio: true 
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          isConnectingRef.current = false;
          return;
        }

        console.log("✅ [VideoPlayer] Permission média obtenue.");

        const videoTrack = await Video.createLocalVideoTrack({
            ...stream.getVideoTracks()[0].getSettings()
        });
        const audioTrack = await Video.createLocalAudioTrack({
            ...stream.getAudioTracks()[0].getSettings()
        });
        
        localTracksRef.current = [videoTrack, audioTrack];
        
        console.log("🔑 [VideoPlayer] Récupération du jeton Twilio...");
        const response = await fetch('/api/twilio/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: userId, room: sessionId, role: role })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur serveur pour le jeton.');
        }
        
        const data = await response.json();

        if (!data.token) {
          throw new Error('Token non reçu du serveur');
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
        
        console.log(`✅ [VideoPlayer] Connecté à la salle "${room.name}" en tant que "${room.localParticipant.identity}"`);
        
        if (onTracksPublished) {
          onTracksPublished(localTracksRef.current);
        }
        
        roomRef.current = room;
        onConnected(room);
        isConnectingRef.current = false;

      } catch (error) {
        if (!isMounted) {
          isConnectingRef.current = false;
          return;
        }
        
        console.error("❌ [VideoPlayer] Erreur de connexion:", error);
        let description = "Impossible d'établir la connexion vidéo.";
        
        if (error instanceof Error) {
          if (error.message.includes('53118')) {
            description = "Un utilisateur avec la même identité est déjà connecté.";
          } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.message.includes('media') || error.message.includes('Permissions')) {
            description = "Veuillez autoriser l'accès à la caméra et au microphone dans votre navigateur.";
          } else if (error.message.includes('Token')) {
            description = "Erreur d'authentification. Vérifiez votre connexion.";
          }
        }
        
        toast({ 
          variant: 'destructive', 
          title: 'Erreur de Connexion Vidéo', 
          description 
        });
        
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
  }, [sessionId, role, userId, toast, onConnected, onTracksPublished]);

  return null;
}
