// src/components/wizard/forms/ImportConfigDialog.tsx

'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import Papa, { type ParseResult, type ParseError } from 'papaparse';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// UI Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, List, Trash2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Redux Actions
import { setAllSubjects } from '@/lib/redux/features/subjects/subjectsSlice';
import { setAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { setAllClassrooms } from '@/lib/redux/features/classrooms/classroomsSlice';
import { setAllTeachers } from '@/lib/redux/features/teachers/teachersSlice';
import { setAllTeacherAssignments, setAssignment } from '@/lib/redux/features/teacherAssignmentsSlice';
import { Role, UserSex, type Grade, type TeacherWithDetails, type Subject, type ClassWithGrade } from '@/types'; 
import { selectAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { selectLessonRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';

// Schemas for validation
const subjectSchema = z.object({
  name: z.string().min(1),
  weeklyHours: z.coerce.number().min(0),
  coefficient: z.coerce.number().min(0),
});

const classSchema = z.object({
  name: z.string().min(1),
  gradeLevel: z.coerce.number().min(1),
  capacity: z.coerce.number().min(1),
});

const classroomSchema = z.object({
  name: z.string().min(1),
  capacity: z.coerce.number().min(1),
  building: z.string().optional(),
});

const teacherCsvSchema = z.object({
    name: z.string().min(1),
    surname: z.string().min(1),
    email: z.string().email(),
    subjects: z.string().min(1),
});

type ImportType = 'subjects' | 'classes' | 'teachers' | 'classrooms';

interface ImportConfigDialogProps {
  grades: Grade[];
}

export const ImportConfigDialog: React.FC<ImportConfigDialogProps> = ({ grades }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<ImportType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const allSubjects = useAppSelector(state => state.subjects.items);
  const allRequirements = useAppSelector(selectLessonRequirements);
  const allClasses = useAppSelector(state => state.classes.items);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: ImportType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(type);
    setError(null);

    Papa.parse(file as any, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => {
          try {
            if (results.errors.length > 0) {
              throw new Error(results.errors.map(e => e.message).join(', '));
            }

            if (type === 'subjects') {
              const parsedData = z.array(subjectSchema).parse(results.data);
              const subjects: Subject[] = parsedData.map((item, index) => ({
                id: -(Date.now() + index),
                name: item.name,
                weeklyHours: item.weeklyHours,
                coefficient: item.coefficient,
                requiresRoom: false,
                isOptional: false,
                optionalGroupId: null,
              }));
              dispatch(setAllSubjects(subjects));
              toast({ title: "Succès", description: `${subjects.length} matières importées.` });
            } else if (type === 'classes') {
              const parsedData = z.array(classSchema).parse(results.data);
              const classes: ClassWithGrade[] = parsedData.map((item, index) => {
                const grade = grades.find(g => g.level === item.gradeLevel);
                if (!grade) {
                  throw new Error(`Niveau invalide "${item.gradeLevel}" pour la classe "${item.name}" à la ligne ${index + 2}.`);
                }
                return {
                  id: -(Date.now() + index),
                  name: item.name,
                  abbreviation: `${item.gradeLevel}${item.name}`,
                  capacity: item.capacity,
                  gradeId: grade.id,
                  grade: grade,
                  _count: { students: 0, lessons: 0 },
                  superviseurId: null,
                  supervisor: null,
                };
              });
              dispatch(setAllClasses(classes));
              toast({ title: "Succès", description: `${classes.length} classes importées.` });
            } else if (type === 'classrooms') {
              const parsedData = z.array(classroomSchema).parse(results.data);
              const classrooms = parsedData.map((item, index) => ({
                id: -(Date.now() + index),
                name: item.name,
                capacity: item.capacity,
                building: item.building || null,
                abbreviation: null,
              }));
              dispatch(setAllClassrooms(classrooms));
              toast({ title: "Succès", description: `${classrooms.length} salles importées.` });
            } else if (type === 'teachers') {
               // Advanced Teacher Import with Random Assignment Logic
              const parsedTeachers = z.array(teacherCsvSchema).parse(results.data);
              const TEACHER_HOURS_QUOTA = 25;
              
              const teacherWorkload: Record<string, number> = {};
              dispatch(setAllTeacherAssignments([])); // Reset assignments

              const newTeachers: TeacherWithDetails[] = parsedTeachers.map((teacherData, index) => {
                  const tempId = `csv_teacher_${Date.now()}_${index}`;
                  teacherWorkload[tempId] = 0;
                  
                  const subjectNames = teacherData.subjects.split(';').map(s => s.trim().toLowerCase());
                  const teacherSubjects = allSubjects.filter(s => subjectNames.includes(s.name.toLowerCase()));
                  
                  return {
                      id: tempId,
                      userId: `csv_user_${Date.now()}_${index}`,
                      name: teacherData.name,
                      surname: teacherData.surname,
                      phone: null, address: null, img: null, bloodType: null,
                      birthday: new Date(), sex: UserSex.MALE,
                      user: {
                        id: `csv_user_${Date.now()}_${index}`,
                        name: `${teacherData.name} ${teacherData.surname}`,
                        email: teacherData.email, username: teacherData.email, role: Role.TEACHER, active: true,
                        img: null, createdAt: new Date(), updatedAt: new Date(),
                        twoFactorEnabled: false, firstName: teacherData.name, lastName: teacherData.surname, 
                      },
                      subjects: teacherSubjects,
                      classes: [],
                      _count: { subjects: teacherSubjects.length, classes: 0, lessons: 0 }
                  };
              });
              
              dispatch(setAllTeachers(newTeachers));

              const requirementsToAssign = [...allRequirements].filter(r => r.hours > 0);

              for(const req of requirementsToAssign) {
                const competentTeachers = newTeachers.filter(t => t.subjects.some(s => s.id === req.subjectId));
                const shuffledCompetentTeachers = [...competentTeachers].sort(() => 0.5 - Math.random());
                
                let assigned = false;
                for (const teacher of shuffledCompetentTeachers) {
                  if (teacherWorkload[teacher.id] + req.hours <= TEACHER_HOURS_QUOTA) {
                    dispatch(setAssignment({ teacherId: teacher.id, subjectId: req.subjectId, classIds: [req.classId] }));
                    teacherWorkload[teacher.id] += req.hours;
                    assigned = true;
                    break; 
                  }
                }
                if (!assigned) {
                  const subjectName = allSubjects.find(s => s.id === req.subjectId)?.name;
                  const className = allClasses.find(c => c.id === req.classId)?.name;
                  console.warn(`Could not assign teacher for ${subjectName} in ${className}. No teacher available with enough hours.`);
                }
              }

              toast({ title: 'Professeurs importés et pré-assignés !', description: 'Vérifiez les assignations dans l\'étape "Professeurs".' });
            }
            setLoading(null);
            setIsOpen(false);
          } catch (e: any) {
            console.error("Erreur de parsing CSV:", e);
            const message = e instanceof z.ZodError ? "Le format du fichier est incorrect. Veuillez vérifier les colonnes et les types de données." : e.message;
            setError(message);
            setLoading(null);
          }
        },
    });
  };
  
  const ImportTabContent = ({ type, title, headers, example }: { type: ImportType, title: string, headers: string, example: string }) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Importez vos {title.toLowerCase()} via un fichier CSV. Le fichier doit contenir les colonnes suivantes : <code className="bg-muted px-1 py-0.5 rounded-sm">{headers}</code>.
        <br />
        Exemple : <code className="bg-muted px-1 py-0.5 rounded-sm">{example}</code>
      </p>
      {error && type === loading && (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur d'importation</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-center">
        <label htmlFor={`csv-upload-${type}`} className="w-full">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                {loading === type ? (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-muted-foreground">Traitement...</span>
                    </>
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="font-semibold">Cliquez pour téléverser un fichier CSV</span>
                        <span className="text-xs text-muted-foreground">ou glissez-déposez le fichier ici</span>
                    </>
                )}
            </div>
            <input
                id={`csv-upload-${type}`}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileChange(e, type)}
                disabled={!!loading}
            />
        </label>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Importer depuis CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer une Configuration depuis CSV</DialogTitle>
          <DialogDescription>
            Accélérez la configuration en importent vos données en masse.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="subjects" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="subjects">Matières</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="teachers">Professeurs</TabsTrigger>
                <TabsTrigger value="classrooms">Salles</TabsTrigger>
            </TabsList>
            <TabsContent value="subjects" className="pt-4">
                <ImportTabContent type="subjects" title="Matières" headers="name, weeklyHours, coefficient" example="Mathématiques, 4, 2"/>
            </TabsContent>
            <TabsContent value="classes" className="pt-4">
                <ImportTabContent type="classes" title="Classes" headers="name, gradeLevel, capacity" example="7ème Base 1, 7, 30"/>
            </TabsContent>
            <TabsContent value="teachers" className="pt-4">
                <ImportTabContent type="teachers" title="Professeurs" headers="name, surname, email, subjects" example="Dupont, Jean, j.dupont@email.com, Mathématiques;Physique"/>
            </TabsContent>
             <TabsContent value="classrooms" className="pt-4">
                <ImportTabContent type="classrooms" title="Salles" headers="name, capacity, building" example="Salle 101, 30, A"/>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportConfigDialog;
