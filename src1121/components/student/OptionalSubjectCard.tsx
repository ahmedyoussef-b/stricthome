// src/components/student/OptionalSubjectCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Subject as OptionalSubject } from '@/types';
import { useUpdateStudentOptionalSubjectMutation } from '@/lib/redux/api/entityApi';
import { Loader2 } from 'lucide-react';
import { BookMarked } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OptionalSubjectCardProps {
    studentId: string;
    selectedSubjects: OptionalSubject[];
    availableSubjects: OptionalSubject[];
}

const OptionalSubjectCard: React.FC<OptionalSubjectCardProps> = ({
    studentId,
    selectedSubjects,
    availableSubjects
}) => {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState<string>(selectedSubjects[0]?.id.toString() || '');
    const [updateSubject, { isLoading }] = useUpdateStudentOptionalSubjectMutation();

    useEffect(() => {
        setSelectedOption(selectedSubjects[0]?.id.toString() || '');
    }, [selectedSubjects]);

    const handleSave = async () => {
        if (!selectedOption) {
            toast({ variant: 'destructive', title: 'Aucune sélection', description: 'Veuillez choisir une matière.' });
            return;
        }

        try {
            await updateSubject({ studentId, optionalSubjectId: parseInt(selectedOption) }).unwrap();
            toast({
                title: 'Choix sauvegardé',
                description: `Votre choix pour la matière optionnelle a été enregistré.`,
            });
            router.refresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.data?.message || 'Une erreur est survenue lors de la sauvegarde.',
            });
        }
    };

    if (availableSubjects.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookMarked size={20}/>Matière Optionnelle</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Aucune matière optionnelle n'est disponible pour votre niveau actuellement.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookMarked size={20}/>Matière Optionnelle</CardTitle>
                <CardDescription>Choisissez votre deuxième langue vivante pour cette année.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    {availableSubjects.map((subject) => (
                        <div key={subject.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={subject.id.toString()} id={`option-${subject.id}`} />
                            <Label htmlFor={`option-${subject.id}`}>{subject.name}</Label>
                        </div>
                    ))}
                </RadioGroup>
                <Button onClick={handleSave} disabled={isLoading || !selectedOption} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder mon choix
                </Button>
            </CardContent>
        </Card>
    );
};

export default OptionalSubjectCard;
