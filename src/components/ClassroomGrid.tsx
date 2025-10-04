// src/components/ClassroomGrid.tsx
'use client';

import { LocalParticipant, RemoteParticipant } from "twilio-video";
import { Participant } from "./Participant";
import { StudentPlaceholder } from "./StudentPlaceholder";
import type { StudentWithCareer } from "@/lib/types";

interface ClassroomGridProps {
    sessionId: string;
    teacher: any;
    students: StudentWithCareer[];
    localParticipant: LocalParticipant | null;
    remoteParticipants: RemoteParticipant[];
    spotlightedParticipantSid?: string | null;
    isTeacher: boolean;
}

export function ClassroomGrid({ 
    sessionId,
    teacher, 
    students, 
    localParticipant, 
    remoteParticipants, 
    spotlightedParticipantSid,
    isTeacher
}: ClassroomGridProps) {

    const allParticipants = [localParticipant, ...remoteParticipants].filter(Boolean) as (LocalParticipant | RemoteParticipant)[];

    const findParticipantById = (userId: string) => {
        return allParticipants.find(p => p.identity.includes(userId.substring(0, 8)));
    }

    return (
        <div className="grid grid-cols-1 gap-2">
            {teacher && (() => {
                 const teacherParticipant = localParticipant?.identity.startsWith('teacher-')
                    ? localParticipant
                    : allParticipants.find(p => p.identity.startsWith('teacher-'));

                 return teacherParticipant ? (
                     <Participant
                         key={teacherParticipant.sid}
                         participant={teacherParticipant}
                         isLocal={teacherParticipant === localParticipant}
                         sessionId={sessionId}
                         isSpotlighted={teacherParticipant.sid === spotlightedParticipantSid}
                         isTeacher={isTeacher}
                         displayName={teacher.name}
                         participantUserId={teacher.id}
                     />
                 ) : (
                     <StudentPlaceholder student={{...teacher, etat: { metier: null}}} isOnline={false} />
                 );
            })()}

            {students.map(student => {
                const studentParticipant = findParticipantById(student.id);
                return studentParticipant ? (
                    <Participant
                        key={studentParticipant.sid}
                        participant={studentParticipant}
                        isLocal={studentParticipant === localParticipant}
                        sessionId={sessionId}
                        isSpotlighted={studentParticipant.sid === spotlightedParticipantSid}
                        isTeacher={isTeacher}
                        displayName={student.name ?? undefined}
                        participantUserId={student.id}
                    />
                ) : (
                    <StudentPlaceholder key={student.id} student={student} isOnline={false} />
                )
            })}
        </div>
    )
}
