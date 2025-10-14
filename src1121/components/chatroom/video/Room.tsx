// src/components/chatroom/video/Room.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Video, { Room as TwilioRoom, LocalParticipant, RemoteParticipant, TwilioError } from 'twilio-video';
import Participant from './Participant';
import { Loader2, AlertTriangle } from 'lucide-react';

interface RoomProps {
    roomName: string;
    token: string;
}

const Room: React.FC<RoomProps> = ({ roomName, token }) => {
    const [room, setRoom] = useState<TwilioRoom | null>(null);
    const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
    const [error, setError] = useState<any | null>(null);
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        const connectToRoom = async () => {
            setIsConnecting(true);
            setError(null);
            
            const participantConnected = (participant: RemoteParticipant) => {
                setParticipants(prevParticipants => new Map(prevParticipants).set(participant.sid, participant));
            };

            const participantDisconnected = (participant: RemoteParticipant) => {
                setParticipants(prevParticipants => {
                    const newParticipants = new Map(prevParticipants);
                    newParticipants.delete(participant.sid);
                    return newParticipants;
                });
            };

            try {
                const connectedRoom = await Video.connect(token, {
                    name: roomName,
                });
                
                setRoom(connectedRoom);
                connectedRoom.on('participantConnected', participantConnected);
                connectedRoom.on('participantDisconnected', participantDisconnected);
                connectedRoom.participants.forEach(participant => {
                    setParticipants(prevParticipants => new Map(prevParticipants).set(participant.sid, participant));
                });

            } catch (err: any) {
                console.error("Erreur de connexion Twilio:", err);
                if (err && typeof err.code !== 'undefined') {
                    setError(err);
                } else {
                    setError({ message: 'Une erreur inattendue est survenue.' });
                }
            } finally {
                setIsConnecting(false);
            }
        };

        connectToRoom();

        return () => {
            setRoom(currentRoom => {
                if (currentRoom && currentRoom.state === 'connected') {
                    currentRoom.disconnect();
                    return null;
                }
                return currentRoom;
            });
        };
    }, [roomName, token]);

    if (isConnecting) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span>Connexion à la salle...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-destructive/10 text-destructive rounded-lg">
                    <AlertTriangle className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-medium">Erreur de connexion vidéo</h3>
                    <p className="mt-2 text-sm">
                        {error.code === 20101 
                            ? "Le jeton d'accès est invalide ou a expiré. Veuillez rafraîchir la page." 
                            : error.message}
                    </p>
                </div>
            </div>
        );
    }
    
    const remoteParticipants = Array.from(participants.values()).map(p => (
        <Participant key={p.sid} participant={p} />
    ));

    return (
        <div className="h-full">
            <div className="relative h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 h-full overflow-y-auto">
                    {room && <Participant key={room.localParticipant.sid} participant={room.localParticipant} />}
                    {remoteParticipants}
                </div>
            </div>
        </div>
    );
};

export default Room;
