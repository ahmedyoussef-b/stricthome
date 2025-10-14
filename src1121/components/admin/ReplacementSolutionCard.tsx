// src/components/admin/ReplacementSolutionCard.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, XCircle, Users, CheckCircle, Clock } from 'lucide-react';
import { ReplacementSolution } from '@/ai/flows/find-replacement-flow';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReplacementSolutionCardProps {
  solution: ReplacementSolution;
}

const SolutionIcon = ({ type }: { type: ReplacementSolution['type'] }) => {
    switch (type) {
        case 'internal':
            return <UserCheck className="h-6 w-6 text-green-600" />;
        case 'cancel':
            return <XCircle className="h-6 w-6 text-red-600" />;
        case 'split':
            return <Users className="h-6 w-6 text-blue-600" />;
        default:
            return <UserCheck className="h-6 w-6 text-gray-600" />;
    }
};

const ImpactBadge = ({ impact }: { impact: string }) => {
    const colorClass = 
        impact.toLowerCase() === 'minimal' ? 'bg-green-100 text-green-800' :
        impact.toLowerCase() === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
        impact.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800';

    return <Badge variant="outline" className={cn("capitalize", colorClass)}>{impact}</Badge>;
}

export default function ReplacementSolutionCard({ solution }: ReplacementSolutionCardProps) {
  const { toast } = useToast();

  const handleSelectSolution = () => {
    // In a real app, this would trigger a mutation to update the schedule.
    // For now, we'll just show a toast notification.
    toast({
        title: "Solution Appliquée (Simulation)",
        description: `La solution de remplacement pour "${solution.affectedLessons.map(l => l.class).join(', ')}" a été appliquée.`,
    });
  };

  const formatTime = (isoString: string) => {
      return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <SolutionIcon type={solution.type} />
                <CardTitle className="text-lg capitalize">{solution.type.replace('_', ' ')}</CardTitle>
            </div>
            <ImpactBadge impact={solution.impact} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground">{solution.description}</p>
        
        {solution.affectedLessons.length > 0 && (
            <div>
                <h4 className="font-semibold text-sm mb-2">Cours affectés :</h4>
                <div className="space-y-2">
                    {solution.affectedLessons.map(lesson => (
                        <div key={lesson.id} className="p-2 bg-muted/50 rounded-md text-xs flex items-center justify-between">
                            <span>{lesson.class} - {lesson.subject}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/>{formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {solution.replacementTeacher?.name && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-1 text-blue-800">Professeur remplaçant :</h4>
                <p className="text-sm text-blue-700">{solution.replacementTeacher.name}</p>
            </div>
        )}

        {solution.conflicts.length > 0 && (
            <div>
                <h4 className="font-semibold text-sm mb-1 text-amber-700">Conflits potentiels :</h4>
                <ul className="list-disc list-inside text-xs text-amber-600 space-y-1">
                    {solution.conflicts.map((conflict, index) => (
                        <li key={index}>{conflict}</li>
                    ))}
                </ul>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSelectSolution}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Choisir cette solution
        </Button>
      </CardFooter>
    </Card>
  );
}