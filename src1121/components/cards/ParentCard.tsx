// src/components/cards/ParentCard.tsx
'use client';

import Link from 'next/link';
import { Eye, MessageSquare } from 'lucide-react';
import FormContainer from '@/components/FormContainer';
import { Badge } from '@/components/ui/badge';
import DynamicAvatar from '@/components/DynamicAvatar';
import { useState } from 'react';
import MessageModal from '@/components/messaging/MessageModal';
import { Role as AppRole, ParentWithDetails } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ParentCardProps {
  parent: ParentWithDetails;
  userRole?: AppRole;
  isLCP?: boolean;
  isAssociated: boolean;
}

const ParentCard: React.FC<ParentCardProps> = ({ parent, userRole, isLCP = false, isAssociated }) => {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const fullName = `${parent.name} ${parent.surname}`;
  const viewLink = `/list/parents/${parent.id}`;
  const canMessage = userRole === AppRole.ADMIN || (userRole === AppRole.TEACHER && isAssociated);

  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <CardHeader className="p-0 relative h-20 bg-gradient-to-r from-primary/20 to-accent/20">
          <div className="absolute top-5 left-1/2 -translate-x-1/2 transform">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-background bg-background shadow-lg">
              <DynamicAvatar
                imageUrl={parent.img || parent.user?.img}
                seed={parent.id || parent.user?.email}
                alt={`Avatar de ${fullName}`}
                isLCP={isLCP}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow items-center text-center p-4 pt-16">
          <h3 className="text-lg font-bold text-foreground truncate w-full">{fullName}</h3>
          <p className="text-sm text-muted-foreground">Parent</p>
          <p className="text-xs text-muted-foreground truncate w-full mt-1">{parent.user?.email}</p>

          <div className="mt-4 w-full border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Enfants:</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {parent.students.slice(0, 2).map(student => (
                <Badge key={student.id} variant="secondary" className="text-xs">{student.name} {student.surname}</Badge>
              ))}
              {parent.students.length > 2 && (
                <Badge variant="outline" className="text-xs">+{parent.students.length - 2}</Badge>
              )}
               {parent.students.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Aucun enfant</p>
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
          {canMessage && parent.user?.id && (
            <Button variant="ghost" size="icon" onClick={() => setIsMessageModalOpen(true)} className="text-blue-500 hover:text-accent-foreground" title="Envoyer un message">
              <MessageSquare size={18} />
            </Button>
          )}
          {userRole === AppRole.ADMIN && (
            <FormContainer table="parent" type="delete" id={parent.id} />
          )}
        </CardFooter>
      </Card>
      {canMessage && parent.user?.id && (
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          recipientName={fullName}
          recipientId={parent.user.id}
        />
      )}
    </>
  );
};

export default ParentCard;