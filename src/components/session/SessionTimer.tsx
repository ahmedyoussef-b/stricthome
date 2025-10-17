// src/components/session/SessionTimer.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import type { PresenceChannel } from 'pusher-js';

interface SessionTimerProps {
    isTeacher: boolean;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
    channel: PresenceChannel | null;
}

function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function SessionTimer({ 
    isTeacher,
    onStart,
    onPause,
    onReset,
    channel,
}: SessionTimerProps) {
    const [timeLeft, setTimeLeft] = useState(300);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isTimerRunning) {
            timerIntervalRef.current = setInterval(() => {
                setTimeLeft(prevTimeLeft => {
                    if (prevTimeLeft <= 1) {
                        clearInterval(timerIntervalRef.current!);
                        timerIntervalRef.current = null;
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prevTimeLeft - 1;
                });
            }, 1000);
        } else if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isTimerRunning]);

    useEffect(() => {
        if (!channel) return;

        const handleTimerStarted = () => setIsTimerRunning(true);
        const handleTimerPaused = () => setIsTimerRunning(false);
        const handleTimerReset = (data: { duration: number }) => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            setTimeLeft(data.duration || 300);
        };
        
        channel.bind('timer-started', handleTimerStarted);
        channel.bind('timer-paused', handleTimerPaused);
        channel.bind('timer-reset', handleTimerReset);

        return () => {
            channel.unbind('timer-started', handleTimerStarted);
            channel.unbind('timer-paused', handleTimerPaused);
            channel.unbind('timer-reset', handleTimerReset);
        }

    }, [channel]);

    return (
        <div className="flex items-center gap-2 p-1 rounded-lg bg-muted border">
            <div className="flex items-center gap-1 text-foreground px-2">
                <Timer className="h-4 w-4" />
                <p className="text-sm font-mono font-semibold w-14">{formatTime(timeLeft)}</p>
            </div>
            {isTeacher && (
                <TooltipProvider delayDuration={100}>
                    <div className="flex items-center gap-1">
                        {!isTimerRunning ? (
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStart} disabled={timeLeft === 0 && !isTimerRunning}>
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Démarrer</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPause}>
                                        <Pause className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Pauser</TooltipContent>
                            </Tooltip>
                        )}
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReset}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Réinitialiser</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            )}
        </div>
    );
}
