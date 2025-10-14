// src/components/chatroom/video/Participant.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  LocalParticipant,
  RemoteParticipant,
  Track,
  RemoteTrack,
  LocalTrack,
} from 'twilio-video';

interface ParticipantProps {
  participant: LocalParticipant | RemoteParticipant;
}

const Participant: React.FC<ParticipantProps> = ({ participant }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackSubscribed = (track: RemoteTrack | LocalTrack) => {
      if (track.kind === 'video' && videoRef.current) {
        videoRef.current.appendChild(track.attach());
      } else if (track.kind === 'audio' && audioRef.current) {
        audioRef.current.appendChild(track.attach());
      }
    };

    const trackUnsubscribed = (track: RemoteTrack | LocalTrack) => {
      if (track.kind === 'video' || track.kind === 'audio') {
        track.detach().forEach((element: HTMLElement) => element.remove());
      }
    };

    participant.on('trackSubscribed', trackSubscribed);
    participant.on('trackUnsubscribed', trackUnsubscribed);

    // Attach already subscribed tracks
    participant.tracks.forEach(publication => {
      if (publication.track) {
        trackSubscribed(publication.track);
      }
    });

    return () => {
      participant.off('trackSubscribed', trackSubscribed);
      participant.off('trackUnsubscribed', trackUnsubscribed);
      // Detach all tracks on cleanup
      participant.tracks.forEach(publication => {
        if (publication.track) {
          trackUnsubscribed(publication.track);
        }
      });
    };
  }, [participant]);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
      <div ref={videoRef} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />
      <div ref={audioRef} className="hidden" />
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {participant.identity}
      </div>
    </div>
  );
};

export default Participant;
