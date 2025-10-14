// src/components/cards/TeacherCard.tsx
'use client';

import Link from 'next/link';
import { Eye, MessageSquare } from 'lucide-react';
import FormContainer from '@/components/FormContainer';
import { Badge } from '@/components/ui/badge';
import DynamicAvatar from '@/components/DynamicAvatar';
import { useState } from 'react';
import MessageModal from '../messaging/MessageModal';
import { Role as AppRole, TeacherWithDetails } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeacherCardProps {
  teacher: TeacherWithDetails;
  userRole?: AppRole;
  isLCP?: boolean;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, userRole, isLCP = false }) => {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const fullName = `${teacher.name} ${teacher.surname}`;
  const viewLink = `/list/teachers/${teacher.id}`;
  const canMessage = userRole === AppRole.ADMIN || userRole === AppRole.PARENT;

  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <CardHeader className="p-0 relative h-20 bg-gradient-to-r from-primary/20 to-accent/20">
           <div className="absolute top-5 left-1/2 -translate-x-1/2 transform">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-background bg-background shadow-lg">
                    <DynamicAvatar 
                        imageUrl={teacher.img || teacher.user?.img || undefined}
                        seed={teacher.user?.email || teacher.id}
                        alt={`Avatar de ${fullName}`}
                        isLCP={isLCP}
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow items-center text-center p-4 pt-16">
            <h3 className="text-lg font-bold text-foreground truncate w-full">{fullName}</h3>
            <p className="text-sm text-muted-foreground">Enseignant(e)</p>
            <p className="text-xs text-muted-foreground truncate w-full mt-1">{teacher.user?.email}</p>
            
            <div className="mt-4 w-full border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Matières Principales:</p>
                <div className="flex flex-wrap gap-1 justify-center">
                    {teacher.subjects.slice(0, 3).map(subject => (
                    <Badge key={subject.id} variant="secondary" className="text-xs">{subject.name}</Badge>
                    ))}
                    {teacher.subjects.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{ teacher.subjects.length - 3 }</Badge>
                    )}
                     {teacher.subjects.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Aucune matière</p>
                    )}
                </div>
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-center space-x-1">
             <Link href={viewLink} passHref>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent-foreground" title="Voir les détails">
                    <Eye size={18} />
                </Button>
            </Link>
            {canMessage && teacher.user?.id && (
                <Button variant="ghost" size="icon" onClick={() => setIsMessageModalOpen(true)} className="text-blue-500 hover:text-accent-foreground" title="Envoyer un message">
                    <MessageSquare size={18} />
                </Button>
            )}
            {userRole === AppRole.ADMIN && (
                <FormContainer table="teacher" type="delete" id={teacher.id} />
            )}
        </CardFooter>
      </Card>
       {canMessage && teacher.user?.id && (
        <MessageModal 
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          recipientName={fullName}
          recipientId={teacher.user.id}
        />
      )}
    </>
  );
};
export default TeacherCard;
