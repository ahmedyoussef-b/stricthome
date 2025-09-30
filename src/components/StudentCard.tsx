
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTransition } from 'react';
import { Checkbox } from './ui/checkbox';

// Utiliser un type simple pour les props de l'élève
interface StudentCardProps {
  student: {
    id: string;
    name: string | null;
    etat: {
      isPunished: boolean;
    } | null;
  };
  isSelected: boolean;
  onSelectionChange: (studentId: string, isSelected: boolean) => void;
  isConnected: boolean;
  isSelectable?: boolean;
}

export function StudentCard({ 
    student, 
    isSelected, 
    onSelectionChange, 
    isConnected, 
    isSelectable = true 
}: StudentCardProps) {
  const [isPending] = useTransition();
  
  const state = student.etat;
  const isEffectivelySelectable = isSelectable && isConnected;

  const handleCardClick = () => {
    if (isEffectivelySelectable) {
      onSelectionChange(student.id, !isSelected);
    }
  };

  return (
    <Card 
      onClick={handleCardClick}
      className={cn(
        "flex flex-col transition-all duration-300 relative",
        state?.isPunished && "bg-destructive/10 border-destructive",
        isSelectable && "cursor-pointer",
        isSelected && isSelectable && "ring-2 ring-primary",
        !isEffectivelySelectable && isSelectable && "opacity-60 bg-muted/50 cursor-not-allowed"
      )}
    >
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <div className={cn("h-2.5 w-2.5 rounded-full", isConnected ? 'bg-green-500' : 'bg-gray-400')} title={isConnected ? 'Connecté' : 'Déconnecté'}></div>
        {isSelectable && (
          <Checkbox
            id={`select-${student.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(student.id, !!checked)}
            aria-label={`Sélectionner ${student.name}`}
            disabled={!isEffectivelySelectable}
          />
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-xl">{student.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{student.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow justify-center flex items-center">
        {!isConnected && isSelectable && (
          <p className="text-xs text-center text-muted-foreground font-semibold">Cet élève est hors ligne et ne peut pas être invité.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
         <Button asChild className="w-full" variant="secondary" onClick={(e) => e.stopPropagation()}>
            <Link href={`/student/${student.id}?viewAs=teacher`}>Voir la page de l'élève</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
