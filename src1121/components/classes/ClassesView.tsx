// src/components/classes/ClassesView.tsx
'use client'; 

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormContainer from "@/components/FormContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers3, Users, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import GradeCard from "@/components/classes/GradeCard";
import type { GradeWithCounts, ClassWithDetails } from '@/app/(dashboard)/list/classes/page';
import { Role as AppRole } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClassesViewProps {
    grades: GradeWithCounts[];
    classes: ClassWithDetails[];
    userRole?: AppRole;
    initialGradeIdParam: string | null;
    isTeacherFilteredView: boolean;
    teacherName?: string;
}

const DetailCard = ({ title, count, icon: Icon, href }: { title: string, count: number, icon: React.ElementType, href: string }) => (
    <Link href={href} className="block group">
        <Card className="h-full shadow-lg hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="p-4">
                 <div className="flex items-center justify-between">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                        {title}
                        <span className="text-xl font-bold text-primary">{count}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardHeader>
        </Card>
    </Link>
);


const ClassesView: React.FC<ClassesViewProps> = ({ grades, classes, userRole, initialGradeIdParam, isTeacherFilteredView, teacherName }) => {
  const router = useRouter();
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(initialGradeIdParam ? Number(initialGradeIdParam) : null);

  const selectedGrade = selectedGradeId ? grades.find(g => g.id === selectedGradeId) : null;
  
  const handleGradeSelect = (gradeId: number) => {
    setSelectedGradeId(gradeId);
  };
  
  const handleBackToGrades = () => {
    setSelectedGradeId(null);
  };
  
  const visibleGrades = selectedGradeId ? grades.filter(g => g.id === selectedGradeId) : grades;
  
  // MAIN VIEW
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers3 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Niveaux Scolaires</h1> 
              <p className="text-muted-foreground text-sm">Organisez et gérez les niveaux et les classes de votre établissement.</p>
            </div>
        </div>
        {!selectedGradeId && userRole === AppRole.ADMIN && (
          <FormContainer table="grade" type="create" />
        )}
         {selectedGradeId && (
            <Button variant="outline" size="sm" onClick={handleBackToGrades}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux Niveaux 
            </Button>
         )}
      </div>
      
      <div className="space-y-12">
        {/* GRADES GRID */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-500",
          selectedGradeId ? 'grid-rows-1' : ''
        )}>
          {visibleGrades.map((grade) => ( 
            <div
              key={grade.id}
              className={cn(
                "transition-all duration-500 ease-in-out",
                selectedGradeId === grade.id ? "col-span-full" : ""
              )}
            >
              <GradeCard 
                grade={grade} 
                userRole={userRole} 
                onSelect={() => handleGradeSelect(grade.id)}
                isSelected={selectedGradeId === grade.id}
              />
            </div>
          ))}
          {grades.length === 0 && !selectedGradeId && (
              <div className="col-span-full text-center py-16 bg-muted/50 rounded-lg">
                  <p className="text-lg text-muted-foreground">Aucun niveau trouvé.</p> 
                  {userRole === AppRole.ADMIN && <p className="text-sm mt-2 text-muted-foreground">Pensez à ajouter le premier niveau pour commencer.</p>} 
              </div>
          )}
        </div>
        
        {/* DETAIL CARDS (Conditional Rendering) */}
        {selectedGrade && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in-50 duration-500 mt-12">
                <DetailCard 
                    title="Classes" 
                    count={selectedGrade._count.classes} 
                    icon={Layers3}
                    href={`/list/classes?viewGradeId=${selectedGrade.id}`}
                />
                <DetailCard 
                    title="Professeurs" 
                    count={selectedGrade.teachers?.length || 0}
                    icon={Users}
                    href={`/list/teachers?gradeId=${selectedGrade.id}`}
                />
                <DetailCard 
                    title="Élèves" 
                    count={selectedGrade._count.students}
                    icon={GraduationCap}
                    href={`/list/students?gradeId=${selectedGrade.id}`}
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default ClassesView;
