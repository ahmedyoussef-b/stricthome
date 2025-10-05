// src/components/session/SessionHeader.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";

interface SessionHeaderProps {
    sessionId: string;
    isTeacher: boolean;
    isEndingSession: boolean;
    onGoBack: () => void;
}

export function SessionHeader({ sessionId, isTeacher, isEndingSession, onGoBack }: SessionHeaderProps) {
    return (
        <header className="border-b bg-background/95 backdrop-blur-sm z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className='flex items-center gap-4'>
                    <h1 className="text-xl font-bold">Session: <Badge variant="secondary">{sessionId.substring(0,8)}</Badge></h1>
                </div>
                <Button variant="outline" onClick={onGoBack} disabled={isEndingSession}>
                     {isEndingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                    {isTeacher ? "Terminer pour tous" : "Quitter la session"}
                </Button>
            </div>
        </header>
    );
}
