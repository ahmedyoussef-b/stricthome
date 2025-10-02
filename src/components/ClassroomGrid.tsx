// src/components/ClassroomGrid.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Room } from "twilio-video";
import { Participant } from "./Participant";
import { StudentPlaceholder } from "./StudentPlaceholder";
import type { StudentWithCareer, UserWithClasse } from "@/lib/types";

interface ClassroomGridProps {
    sessionId: string;
    teacher: any;
    students: StudentWithCareer[];
    localParticipant: LocalParticipant | null;
    remoteParticipants: RemoteParticipant[];
    spotlightedParticipantSid?: string | null;
}

export function ClassroomGrid({ 
    sessionId,
    teacher, 
    students, 
    localParticipant, 
    remoteParticipants, 
    spotlightedParticipantSid 
}: ClassroomGridProps) {

    const allParticipants = [localParticipant, ...remoteParticipants].filter(Boolean) as (LocalParticipant | RemoteParticipant)[];

    const findParticipantById = (userId: string) => {
        return allParticipants.find(p => p.identity.includes(userId.substring(0, 8)));
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Teacher's video */}
            {teacher && (() => {
                 const teacherParticipant = findParticipantById(teacher.id);
                 return teacherParticipant ? (
                     <Participant
                         key={teacherParticipant.sid}
                         participant={teacherParticipant}
                         isLocal={teacherParticipant === localParticipant}
                         sessionId={sessionId}
                         isSpotlighted={teacherParticipant.sid === spotlightedParticipantSid}
                     />
                 ) : (
                     <StudentPlaceholder student={{...teacher, etat: { metier: null}}} isOnline={false} />
                 );
            })()}

            {/* Students' videos or placeholders */}
            {students.map(student => {
                const studentParticipant = findParticipantById(student.id);
                return studentParticipant ? (
                    <Participant
                        key={studentParticipant.sid}
                        participant={studentParticipant}
                        isLocal={studentParticipant === localParticipant}
                        sessionId={sessionId}
                        isSpotlighted={studentParticipant.sid === spotlightedParticipantSid}
                    />
                ) : (
                    <StudentPlaceholder key={student.id} student={student} isOnline={false} />
                )
            })}
        </div>
    )
}
