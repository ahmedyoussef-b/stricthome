// src/components/HandRaiseController.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hand, Waves } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

interface HandRaiseControllerProps {
  sessionId: string;
  raisedHands: { id: string; name: string | null }[];
}

export function HandRaiseController({ sessionId, raisedHands }: HandRaiseControllerProps) {
  
  const lowerHand = async (userId: string) => {
    // This function will call the API to lower the hand
    await fetch(`/api/session/${sessionId}/raise-hand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isRaised: false }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hand className="h-5 w-5 text-blue-600" />
          Mains Levées ({raisedHands.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {raisedHands.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">Aucune main levée pour le moment.</p>
        ) : (
          raisedHands.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{user.name}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => lowerHand(user.id)}>
                Baisser la main
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
