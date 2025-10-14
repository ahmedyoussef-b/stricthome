// src/components/wizard/forms/TeachersForm.tsx
'use client';

import React, { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { Users, BookOpen, AlertCircle, Trash2, Edit, Plus, Check, Hourglass, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import {
    toggleClassAssignment,
    selectTeacherAssignments,
    removeAssignmentsForTeacher,
} from '@/lib/redux/features/teacherAssignmentsSlice';
import {
  selectAllProfesseurs,
} from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { selectLessonRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import type { TeacherWithDetails, Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeleteTeacherMutation } from '@/lib/redux/api/entityApi';


const TEACHER_HOURS_QUOTA = 25; // Weekly hours quota

const TeachersForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const teachers = useAppSelector(selectAllProfesseurs);
    const classes = useAppSelector(selectAllClasses);
    const subjects = useAppSelector(selectAllMatieres);
    const teacherAssignments = useAppSelector(selectTeacherAssignments);
    const lessonRequirements = useAppSelector(selectLessonRequirements);

    const [deleteTeacher] = useDeleteTeacherMutation();

    const teacherWorkloads = useMemo(() => {
        const workloads: Record<string, number> = {};
        teachers.forEach(teacher => {
            const assignments = teacherAssignments.filter(a => a.teacherId === teacher.id);
            let totalHours = 0;
            assignments.forEach(assignment => {
                assignment.classIds.forEach(classId => {
                    const req = lessonRequirements.find(r => r.classId === classId && r.subjectId === assignment.subjectId);
                    const subjectDefaultHours = subjects.find(s => s.id === assignment.subjectId)?.weeklyHours || 0;
                    totalHours += req ? req.hours : subjectDefaultHours;
                });
            });
            workloads[teacher.id] = totalHours;
        });
        return workloads;
    }, [teacherAssignments, lessonRequirements, teachers, subjects]);


    const handleClassToggle = (teacherId: string, subjectId: number, classId: number) => {
        dispatch(toggleClassAssignment({ teacherId, subjectId, classId }));
    };

    const handleDeleteTeacher = async (teacher: TeacherWithDetails) => {
      try {
        await deleteTeacher(teacher.id).unwrap();
        dispatch(removeAssignmentsForTeacher(teacher.id));
        toast({
          title: "Enseignant supprimé",
          description: `L'enseignant ${teacher.name} ${teacher.surname} a été supprimé de la base de données.`
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur de suppression",
          description: error.data?.message || "Impossible de supprimer l'enseignant."
        })
      }
    };

    const isClassAssignedToOtherTeacher = (classId: number, subjectId: number, currentTeacherId: string): boolean => {
        return teacherAssignments.some(assignment =>
            assignment.subjectId === subjectId &&
            assignment.classIds.includes(classId) &&
            assignment.teacherId !== currentTeacherId
        );
    };

    const isClassAssignedToCurrentTeacher = (classId: number, subjectId: number, currentTeacherId: string): boolean => {
        return teacherAssignments.some(assignment =>
            assignment.teacherId === currentTeacherId &&
            assignment.subjectId === subjectId &&
            assignment.classIds.includes(classId)
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Assignations des Professeurs</CardTitle>
                        <CardDescription>
                            Pour chaque professeur, cliquez sur les classes qu'il enseignera pour chacune de ses matières.
                        </CardDescription>
                      </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {teachers.length === 0 || classes.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Configuration requise</AlertTitle>
                            <AlertDescription>
                                Veuillez configurer les professeurs et les classes dans les étapes précédentes pour commencer les assignations.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {teachers.map((teacher: TeacherWithDetails) => {
                                const workload = teacherWorkloads[teacher.id] || 0;
                                const isOverloaded = workload > TEACHER_HOURS_QUOTA;

                                return (
                                <AccordionItem value={`teacher-${teacher.id}`} key={teacher.id}>
                                  <div className="flex items-center pr-4">
                                    <AccordionTrigger className="flex-1 hover:no-underline p-4">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-semibold text-lg flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                {teacher.name} {teacher.surname}
                                            </span>
                                            <div className="flex items-center gap-4">
                                              <div className={cn(
                                                  "flex items-center gap-2 text-sm font-medium p-2 rounded-lg",
                                                  isOverloaded ? "bg-destructive/10 text-destructive" : "bg-muted/70 text-muted-foreground"
                                                )}>
                                                  <Hourglass size={14} />
                                                  <span>{workload}h / {TEACHER_HOURS_QUOTA}h</span>
                                                  {isOverloaded && <AlertTriangle size={14}  />}
                                              </div>
                                              <span className="text-sm text-muted-foreground">
                                                  {teacher.subjects.length} matière(s)
                                              </span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                              <Trash2 size={16}/>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Êtes-vous sûr de vouloir supprimer l'enseignant "{teacher.name} {teacher.surname}" ? Toutes ses assignations seront également supprimées.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteTeacher(teacher)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                                    <AccordionContent>
                                        <div className="p-4 space-y-6">
                                            {teacher.subjects.length > 0 ? teacher.subjects.map((subject: Subject) => {
                                                return (
                                                    <div key={subject.id} className="space-y-3 p-3 border rounded-md">
                                                        <label className="font-medium flex items-center gap-2 text-primary">
                                                          <BookOpen className="h-4 w-4" />
                                                          {subject.name}
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {classes.map(cls => {
                                                                const isAssignedToThis = isClassAssignedToCurrentTeacher(cls.id, subject.id, teacher.id);
                                                                const isAssignedToOther = isClassAssignedToOtherTeacher(cls.id, subject.id, teacher.id);
                                                                
                                                                return (
                                                                    <Button
                                                                        key={cls.id}
                                                                        variant={isAssignedToThis ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => handleClassToggle(teacher.id, subject.id, cls.id)}
                                                                        disabled={isAssignedToOther}
                                                                        className={cn(
                                                                            "transition-all duration-200",
                                                                            isAssignedToThis && "bg-green-600 hover:bg-green-700",
                                                                            isAssignedToOther && "bg-muted text-muted-foreground line-through"
                                                                        )}
                                                                        title={isAssignedToOther ? "Déjà assignée à un autre professeur pour cette matière" : cls.name}
                                                                    >
                                                                         {isAssignedToThis ? <Check size={16} className="mr-2"/> : <Plus size={16} className="mr-2"/>}
                                                                        {cls.name}
                                                                    </Button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            }) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Aucune matière de compétence définie pour cet enseignant.
                                                </p>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )})}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TeachersForm;
