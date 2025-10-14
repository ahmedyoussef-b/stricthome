// src/components/attendance/AttendanceManager.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useCreateAttendanceMutation } from '@/lib/redux/api/entityApi/index';
import { AttendanceStep2Student } from './AttendanceStep2Student';
import { AttendanceStep3Date } from './AttendanceStep3Date';
import { AttendanceStep4Lesson } from './AttendanceStep4Lesson';
import { AttendanceSummary } from './AttendanceSummary';
import { Day, Subject } from '@/types';
import AttendanceStep1Class from './AttendanceStep1Class';

export type StudentData = { id: string; name: string; surname: string };
export type ClassData = { id: number; name: string; students?: StudentData[] };
export type LessonData = { id: number; classId: number | null; day: Day, startTime: Date, subject: Pick<Subject, 'id' | 'name'> };

interface AttendanceManagerProps {
  classes: ClassData[];
  lessons: LessonData[];
}

const dayMapping: { [key: number]: Day } = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY', 0: 'SUNDAY' };

export default function AttendanceManager({ classes, lessons }: AttendanceManagerProps) {
  const { toast } = useToast();
  const [createAttendance, { isLoading }] = useCreateAttendanceMutation();

  const [step, setStep] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const availableStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return classes.find(c => c.id.toString() === selectedClassId)?.students || [];
  }, [selectedClassId, classes]);

  const availableLessons = useMemo(() => {
    if (!selectedClassId || !selectedDate) return [];
    const dayOfWeek = dayMapping[selectedDate.getDay()];
    if (!dayOfWeek) return [];
    return lessons
      .filter(l => l.classId !== null && l.classId.toString() === selectedClassId && l.day === dayOfWeek)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [selectedClassId, selectedDate, lessons]);

  const resetForm = () => {
    setStep(1);
    setSelectedClassId('');
    setSelectedStudentId('');
    setSelectedDate(new Date());
    setSelectedLessonId('');
  };

  const handleSave = async () => {
    if (!selectedStudentId || !selectedLessonId || !selectedDate) {
      toast({
        variant: 'destructive',
        title: "Informations manquantes",
        description: "Veuillez compléter toutes les étapes.",
      });
      return;
    }

    try {
      await createAttendance({
        studentId: selectedStudentId,
        lessonId: Number(selectedLessonId),
        date: selectedDate,
        present: false,
      }).unwrap();

      toast({
        title: 'Absence enregistrée',
        description: `L'absence a été enregistrée avec succès.`,
      });
      resetForm();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Erreur d'enregistrement",
        description: error.data?.message || 'Une erreur est survenue.',
      });
    }
  };

  const selectedClass = classes.find(c => c.id.toString() === selectedClassId);
  const selectedStudent = availableStudents.find(s => s.id === selectedStudentId);
  const selectedLesson = availableLessons.find(l => l.id.toString() === selectedLessonId);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Enregistrer une Absence</CardTitle>
        <CardDescription>Suivez les étapes pour enregistrer une absence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AttendanceStep1Class
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectClass={(classId:string) => {
            setSelectedClassId(classId);
            setSelectedStudentId('');
            setSelectedLessonId('');
            setStep(2);
          }}
        />

        {step >= 2 && selectedClassId && (
          <AttendanceStep2Student
            students={availableStudents}
            selectedStudentId={selectedStudentId}
            onSelectStudent={(studentId) => {
              setSelectedStudentId(studentId);
              setSelectedLessonId('');
              setStep(3);
            }}
          />
        )}

        {step >= 3 && selectedStudentId && (
          <AttendanceStep3Date
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedLessonId('');
              setStep(4);
            }}
          />
        )}

        {step >= 4 && selectedDate && (
          <AttendanceStep4Lesson
            lessons={availableLessons}
            selectedLessonId={selectedLessonId}
            onSelectLesson={(lessonId) => {
              setSelectedLessonId(lessonId);
              setStep(5);
            }}
            selectedDate={selectedDate}
          />
        )}

        {step >= 5 && selectedLessonId && (
          <AttendanceSummary
            student={selectedStudent}
            classData={selectedClass}
            date={selectedDate}
            lesson={selectedLesson}
          />
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetForm}>Réinitialiser</Button>
        <Button onClick={handleSave} disabled={isLoading || step < 5 || !selectedLessonId}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer l'absence
        </Button>
      </CardFooter>
    </Card>
  );
}
