// src/components/ClassroomGrid.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Participant as TwilioParticipant } from "twilio-video";
import { Participant } from "./Participant";
import { StudentPlaceholder } from "./StudentPlaceholder";
import type { StudentWithCareer } from "@/lib/types";
import { User } from "@prisma/client";

interface ClassroomGridProps {
    sessionId: string;
    teacher: User | null;
    students: StudentWithCareer[];
    localParticipant: LocalParticipant | null;
    remoteParticipants: RemoteParticipant[];
    spotlightedParticipantSid?: string | null;
    onlineUserIds: string[];
    isTeacher: boolean;
    whiteboardControllerId: string | null;
    onGiveWhiteboardControl: (userId: string) => void;
    onSpotlightParticipant: (participantSid: string) => void;
}

export function ClassroomGrid({ 
    sessionId,
    teacher, 
    students, 
    localParticipant, 
    remoteParticipants, 
    spotlightedParticipantSid,
    onlineUserIds,
    isTeacher,
    whiteboardControllerId,
    onGiveWhiteboardControl,
    onSpotlightParticipant
}: ClassroomGridProps) {

    const allVideoParticipants = [localParticipant, ...remoteParticipants]
        .filter((p): p is LocalParticipant | RemoteParticipant => p !== null);

    const findParticipantByUserId = (userId: string) => {
        return allVideoParticipants.find(p => p.identity.includes(userId));
    }
    
    const isUserOnline = (userId: string) => {
        return onlineUserIds.includes(userId);
    }

    return (
        <div className="grid grid-cols-1 gap-2">
            {teacher && (() => {
                 const teacherParticipant = findParticipantByUserId(teacher.id);
                 const isOnline = teacherParticipant ? true : isUserOnline(teacher.id);

                 return teacherParticipant ? (
                     <Participant
                         key={teacherParticipant.sid}
                         participant={teacherParticipant}
                         isLocal={teacherParticipant === localParticipant}
                         sessionId={sessionId}
                         isSpotlighted={teacherParticipant.sid === spotlightedParticipantSid}
                         isTeacher={true}
                         displayName={teacher.name ?? 'Professeur'}
                         participantUserId={teacher.id}
                         isWhiteboardController={teacher.id === whiteboardControllerId}
                         onGiveWhiteboardControl={onGiveWhiteboardControl}
                         onSpotlightParticipant={onSpotlightParticipant}
                     />
                 ) : (
                     <StudentPlaceholder key={teacher.id} student={{...teacher, etat: { metier: null}}} isOnline={isOnline} />
                 );
            })()}

            {students.map(student => {
                const studentParticipant = findParticipantByUserId(student.id);
                // Don't render the teacher again if they are in the student list for some reason
                if (teacher && student.id === teacher.id) return null;
                
                const isOnline = studentParticipant ? true : isUserOnline(student.id);
                
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
                        isWhiteboardController={student.id === whiteboardControllerId}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                        onSpotlightParticipant={onSpotlightParticipant}
                    />
                ) : (
                    <StudentPlaceholder key={student.id} student={student} isOnline={isOnline} />
                )
            })}
        </div>
    )
}
