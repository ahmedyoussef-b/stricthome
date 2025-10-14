// src/components/wizard/forms/ClassesForm.tsx
'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { Users, Plus, Trash2, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCreateClassMutation, useDeleteClassMutation } from '@/lib/redux/api/entityApi';
import { selectAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { useToast } from '@/hooks/use-toast';
import { sectionOptions } from '@/lib/constants';

interface ClassesFormProps {}

const ClassesForm: React.FC<ClassesFormProps> = () => {
  const data = useAppSelector(selectAllClasses);
  const grades = useAppSelector(selectAllGrades);
  const { toast } = useToast();
  
  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();
  const [deleteClass] = useDeleteClassMutation();
  
  const [newClass, setNewClass] = useState({ 
    gradeLevel: '',
    section: '', 
    capacity: 25 
  });

  const handleAddClass = async () => {
    if (!newClass.gradeLevel || !newClass.section || !newClass.capacity) {
        toast({ variant: 'destructive', title: "Champs manquants", description: "Veuillez sélectionner un niveau et une section." });
        return;
    }
    
    const selectedGrade = grades.find(g => g.level === parseInt(newClass.gradeLevel, 10));
    if (!selectedGrade) {
        toast({ variant: 'destructive', title: "Niveau invalide" });
        return;
    }
    
    const newClassName = `Niveau ${selectedGrade.level} - ${newClass.section}`;
    const classExists = data && data.some(cls => cls.name.trim().toLowerCase() === newClassName.trim().toLowerCase());

    if (classExists) {
        toast({ variant: 'destructive', title: "Classe existante", description: `La classe "${newClassName}" existe déjà.` });
        return;
    }

    try {
        await createClass({
            name: newClassName,
            abbreviation: `${selectedGrade.level}${newClass.section}`,
            capacity: newClass.capacity,
            gradeLevel: selectedGrade.level,
        }).unwrap();
        
        toast({ title: 'Classe créée', description: `La classe "${newClassName}" a été ajoutée à la base de données.` });
        setNewClass({ gradeLevel: '', section: '', capacity: 25 });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.data?.message || "Impossible de créer la classe." });
    }
  };

  const handleDeleteClass = async (id: number) => {
    try {
        await deleteClass(id).unwrap();
        toast({ title: 'Classe supprimée', description: 'La classe a été supprimée de la base de données.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.data?.message || "Impossible de supprimer la classe." });
    }
  };

  // Safely calculate stats only when data is an array
  const totalStudents = Array.isArray(data) ? data.reduce((sum, cls) => sum + (cls.capacity || 0), 0) : 0;
  const averageClassSize = Array.isArray(data) && data.length > 0 ? Math.round(totalStudents / data.length) : 0;
  const uniqueGradeLevels = Array.isArray(data) ? new Set(data.map(cls => cls.grade?.level)).size : 0;


  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Ajouter une classe</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Niveau</Label>
            <Select value={newClass.gradeLevel} onValueChange={(value) => setNewClass({ ...newClass, gradeLevel: value })} disabled={isCreating}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un niveau" /></SelectTrigger>
              <SelectContent>
                {grades && grades.map(grade => <SelectItem key={grade.id} value={String(grade.level)}>{`Niveau ${grade.level}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Section</Label>
            <Select value={newClass.section} onValueChange={(value) => setNewClass({ ...newClass, section: value })} disabled={isCreating}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                {sectionOptions.map(section => <SelectItem key={section} value={section}>{section}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Nombre d'élèves</Label>
            <Input type="number" value={newClass.capacity} onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 0 })} min="1" max="40" className="mt-1" disabled={isCreating} />
          </div>
          
          <div className="flex items-end">
            <Button onClick={handleAddClass} disabled={!newClass.gradeLevel || !newClass.section || !newClass.capacity || isCreating} className="w-full">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Classes configurées ({data?.length || 0})</h3>
        </div>
        
        {!data || data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users size={48} className="mx-auto mb-4 text-muted" />
            <p>Aucune classe configurée</p>
            <p className="text-sm">Commencez par ajouter votre première classe</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((cls) => (
              <Card key={cls.id} className="p-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{cls.name}</h4>
                      <p className="text-sm text-muted-foreground">{cls.capacity || 0} élèves</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Info', description: "L'édition se fait via la page 'Classes'."})}><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(cls.id)} className="text-destructive hover:text-destructive/90"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Niveau: {cls.grade?.level || 'N/A'}</span>
                    <span>Section: {cls.abbreviation}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {data && data.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-3">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-primary/90">
            <div><p className="font-medium">Total classes</p><p className="text-2xl font-bold">{data.length}</p></div>
            <div><p className="font-medium">Total élèves</p><p className="text-2xl font-bold">{totalStudents}</p></div>
            <div><p className="font-medium">Niveaux différents</p><p className="text-2xl font-bold">{uniqueGradeLevels}</p></div>
            <div><p className="font-medium">Effectif moyen</p><p className="text-2xl font-bold">{averageClassSize}</p></div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClassesForm;
