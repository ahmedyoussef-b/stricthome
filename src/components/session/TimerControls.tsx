// src/components/session/TimerControls.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";

interface TimerControlsProps {
    timeLeft: number;
    isTimerRunning: boolean;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
}

function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function TimerControls({ timeLeft, isTimerRunning, onStart, onPause, onReset }: TimerControlsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Timer />
                    Minuteur
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-4xl font-bold">{formatTime(timeLeft)}</p>
                <div className="flex justify-center gap-2 mt-2">
                    {!isTimerRunning ? (
                        <Button variant="outline" size="sm" onClick={onStart} disabled={timeLeft === 0}>
                            <Play className="mr-2 h-4 w-4" /> Démarrer
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={onPause}>
                            <Pause className="mr-2 h-4 w-4" /> Pauser
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onReset}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
