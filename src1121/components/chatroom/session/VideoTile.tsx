// src/components/chatroom/session/VideoTile.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video, Mic, MicOff, Hand, Crown, Trophy, Award, Star, UserCog, VideoOff, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VideoTileProps {
  name: string;
  isOnline: boolean;
  isTeacher?: boolean;
  hasRaisedHand?: boolean;
  points?: number;
  badgeCount?: number;
  isMuted?: boolean;
  isHost: boolean;
  isSpotlighted: boolean;
  isCurrentUser: boolean; // Added to identify the local user's tile
  onToggleMute: () => void;
  onToggleSpotlight: () => void;
}

export default function VideoTile({ 
  name, 
  isOnline, 
  isTeacher = false, 
  hasRaisedHand = false,
  points = 0,
  badgeCount = 0,
  isMuted = false,
  isHost,
  isSpotlighted,
  isCurrentUser,
  onToggleMute,
  onToggleSpotlight,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isCurrentUser) return;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès Caméra Refusé',
          description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
        });
      }
    };

    getCameraPermission();

    // Cleanup function to stop media tracks when the component unmounts
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isCurrentUser, toast]);


  const getInitials = (fullName: string) => {
    if (!fullName || typeof fullName !== 'string') {
      return 'U';
    }
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = () => {
    if (!points || points === 0) return null;
    if (points >= 50) return <Crown className="w-3 h-3 text-yellow-500" />;
    if (points >= 20) return <Trophy className="w-3 h-3 text-orange-500" />;
    if (points >= 5) return <Award className="w-3 h-3 text-blue-500" />;
    return null;
  };
  
  const renderOverlay = () => {
    if (isOnline) {
      if (isCurrentUser && !hasCameraPermission) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white p-2">
            <VideoOff className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs text-center">Caméra désactivée ou non autorisée</p>
          </div>
        )
      }
      return null; // No overlay if online and has camera (or not current user)
    }
    
    // Offline overlay
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white p-2">
            <WifiOff className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs text-center font-semibold">Déconnecté</p>
            <p className="text-xs text-center opacity-80">Je serai de retour</p>
        </div>
    )
  }

  return (
    <Card className={cn(
        `relative overflow-hidden transition-all duration-300 shadow-lg cursor-grab w-full h-full`,
        hasRaisedHand && 'ring-2 ring-orange-500',
        isSpotlighted && 'ring-4 ring-yellow-400',
        !isOnline && 'opacity-60'
    )}>
      <CardContent className="p-2 flex flex-col h-full">
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {hasRaisedHand && (
            <Badge variant="secondary" className="p-1 bg-orange-500 hover:bg-orange-600 animate-pulse">
              <Hand className="w-3 h-3 text-white" />
            </Badge>
          )}
        </div>

        <div className="aspect-video bg-gray-900 rounded-lg mb-2 flex items-center justify-center relative group/tile">
            {isCurrentUser && hasCameraPermission && (
                 <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    playsInline
                    muted={true}
                />
             )}
              {!isCurrentUser && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="w-16 h-16">
                        <AvatarFallback className={cn(
                            'text-lg font-semibold',
                            isTeacher ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                        )}>
                        {getInitials(name)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            )}
            
            {renderOverlay()}
          
          <div className="absolute bottom-1 left-1 flex gap-1">
            <Badge variant="secondary" className="p-1 bg-black/30 border-none text-white">
              <Video className="w-3 h-3" />
            </Badge>
            <Badge variant="secondary" className="p-1 bg-black/30 border-none text-white">
              {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3" />}
            </Badge>
          </div>

          <div className={cn(
              'absolute top-1.5 left-1.5 w-3 h-3 rounded-full border-2 border-gray-900 z-10',
              isOnline ? 'bg-green-500' : 'bg-gray-400'
          )} />

          {isHost && !isTeacher && (
              <div className="absolute top-1 right-1 opacity-0 group-hover/tile:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" className="h-7 w-7 bg-black/40 hover:bg-black/70" onClick={onToggleMute}>
                      {isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" className="h-7 w-7 bg-black/40 hover:bg-black/70" onClick={onToggleSpotlight}>
                      <Star className={cn("w-4 h-4", isSpotlighted && "fill-current text-yellow-400")} />
                  </Button>
              </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate">{name}</p>
            {isTeacher && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 flex items-center gap-1">
                <UserCog size={12} />
                Hôte
              </Badge>
            )}
          </div>

          {!isTeacher && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-600">
                {getRankIcon()}
                <span className="font-semibold">{points} pts</span>
              </div>
              {badgeCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800">
                  {badgeCount} 🏆
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
