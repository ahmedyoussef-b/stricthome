// src/components/session/SessionHeader.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PhoneOff } from "lucide-react";
import { SessionTimer } from "./SessionTimer";

interface SessionHeaderProps {
    sessionId: string;
    isTeacher: boolean;
    onEndSession: () => void;
    timeLeft: number;
    isTimerRunning: boolean;
    onStartTimer: () => void;
    onPauseTimer: () => void;
    onResetTimer: () => void;
    isEndingSession?: boolean;
}

export function SessionHeader({ 
    sessionId, 
    isTeacher, 
    onEndSession,
    timeLeft,
    isTimerRunning,
    onStartTimer,
    onPauseTimer,
    onResetTimer,
    isEndingSession = false
}: SessionHeaderProps) {
    
    return (
        <header className="border-b bg-background/95 backdrop-blur-sm z-10 sticky top-0">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className='flex items-center gap-4'>
                    <h1 className="text-xl font-bold hidden sm:block">Session: <Badge variant="secondary">{sessionId.substring(0,8)}</Badge></h1>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2">
                    <SessionTimer
                        isTeacher={isTeacher}
                        timeLeft={timeLeft}
                        isTimerRunning={isTimerRunning}
                        onStart={onStartTimer}
                        onPause={onPauseTimer}
                        onReset={onResetTimer}
                    />
                </div>
                
                {isTeacher && (
                    <Button variant="destructive" onClick={onEndSession} disabled={isEndingSession}>
                        {isEndingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneOff className="mr-2 h-4 w-4" />}
                        Terminer la session
                    </Button>
                )}

                {/* Espace réservé pour élève pour équilibrer le flexbox */}
                {!isTeacher && <div className="w-40"></div>}
            </div>
        </header>
    );
}
