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
  onParticipantsChanged: (participants: Map<string, RemoteParticipant>) => void;
  onLocalParticipantChanged: (participant: LocalParticipant) => void;
}

export function VideoPlayer({ sessionId, role, userId, onConnected }: VideoPlayerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const roomRef = useRef<Room | null>(null);
  const cameraTrackRef = useRef<LocalVideoTrack | null>(null);
  const { toast } = useToast();
  
  const connectToRoom = useCallback(async () => {
    // Construct a unique identity
    const participantName = `${role}-${userId.substring(0, 8)}`;

    if (!participantName || !sessionId) {
        console.warn("⚠️ [VideoPlayer] participantName or sessionId missing. Connection cancelled.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    let localTracks: LocalTrack[] = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraTrackRef.current = new LocalVideoTrack(stream.getVideoTracks()[0]);
      localTracks = [cameraTrackRef.current, ...stream.getAudioTracks().map(t => new LocalAudioTrack(t))];
      setHasPermission(true);
    } catch (error) {
      console.error("💥 [VideoPlayer] Media access error:", error);
      setHasPermission(false);
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Media Access Denied',
        description: "Please allow access to camera and microphone.",
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
          throw new Error(data.error || 'Unknown server error for token. Check server config.');
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
      });
      
      window.addEventListener('beforeunload', () => room.disconnect());

    } catch (error) {
      let description = "Could not establish connection to the video session.";
      if (error instanceof Error) description = error.message;
      
      toast({ variant: 'destructive', title: 'Video Connection Error', description });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, role, userId, toast, onConnected]);


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
    };
  }, [connectToRoom]);


  // This component handles the logic but doesn't render any visible UI itself.
  // The actual video rendering is done in Participant.tsx and VideoGrid.tsx.
  return null;
}
