// src/components/session/ParticipantList.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Participant as TwilioParticipant } from 'twilio-video';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


interface ParticipantListProps {
    allVideoParticipants: Array<LocalParticipant | RemoteParticipant>;
    localParticipant: LocalParticipant | null;
    findUserByParticipant: (participant: TwilioParticipant) => SessionParticipant | undefined;
}

export function ParticipantList({ allVideoParticipants, localParticipant, findUserByParticipant }: ParticipantListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Users /> Participants ({allVideoParticipants.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {allVideoParticipants.map(p => {
                  const user = findUserByParticipant(p);
                  return (
                      <div key={p.sid} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{user?.name ?? p.identity.split('-')[0]} {p === localParticipant ? '(Vous)' : ''}</span>
                      </div>
                  )
              })}
            </CardContent>
        </Card>
    );
}
