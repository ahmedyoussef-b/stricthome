// src/components/wizard/forms/ConstraintsForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { Users, Building, Clock, PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { addTeacherConstraint, removeTeacherConstraint, selectTeacherConstraints } from '@/lib/redux/features/teacherConstraintsSlice';
import { selectAllProfesseurs } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { selectAllSalles } from '@/lib/redux/features/classrooms/classroomsSlice';
import { dayLabels } from '@/lib/constants';
import { TimePreference, TeacherConstraint, Day, Subject, Classroom } from '@/types';
import { MultiSelectField } from '@/components/forms/MultiSelectField'; // Import the multi-select component
import { selectSubjectRequirements, setAllowedRoomsForSubject, setSubjectTimePreference } from '@/lib/redux/features/subjectRequirementsSlice';

interface ConstraintsFormProps {}

const ConstraintsForm: React.FC<ConstraintsFormProps> = () => {
  const dispatch = useAppDispatch();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [newTeacherConstraint, setNewTeacherConstraint] = useState<{
    day: string;
    startTime: string;
    endTime: string;
    description: string;
  }>({
    day: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  // Define a local type for TeacherConstraint to allow string or number id before saving
  type LocalTeacherConstraint = Omit<TeacherConstraint, 'id'> & {
    id: string | number;
  };
  const teachers = useAppSelector(selectAllProfesseurs);
  const subjects = useAppSelector(selectAllMatieres);
  const salles = useAppSelector(selectAllSalles);
  const teacherConstraints = useAppSelector(selectTeacherConstraints);
  const subjectRequirements = useAppSelector(selectSubjectRequirements);
  

  const filteredTeacherConstraints = useMemo(() => {
    if (!selectedTeacherId) return [];
    return teacherConstraints.filter(c => c.teacherId === selectedTeacherId);
  }, [teacherConstraints, selectedTeacherId]);

  const handleAddTeacherConstraint = () => {
    if (!selectedTeacherId || !newTeacherConstraint.day || !newTeacherConstraint.startTime || !newTeacherConstraint.endTime) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const newEntry: LocalTeacherConstraint = {
      id: (-Date.now()).toString() , // Create a temporary unique string ID for client-side
      teacherId: selectedTeacherId,
      day: newTeacherConstraint.day as Day,
      startTime: newTeacherConstraint.startTime,
      endTime: newTeacherConstraint.endTime,
      description: newTeacherConstraint.description,
      scheduleDraftId: '' ,
    };

    dispatch(addTeacherConstraint(newEntry as TeacherConstraint));
    setIsTeacherFormOpen(false);
    setNewTeacherConstraint({ day: '', startTime: '', endTime: '', description: '' });
  };

  const handleDeleteTeacherConstraint = (id: string | number) => {
    dispatch(removeTeacherConstraint(id));
  };

  const handleAllowedRoomsChange = (subjectId: number, allowedRoomValues: string[]) => {
    const allowedRoomIds = allowedRoomValues.map(id => parseInt(id, 10));
    dispatch(setAllowedRoomsForSubject({ subjectId, allowedRoomIds }));
  };

  const handleTimePreferenceChange = (subjectId: number, timePreference: TimePreference) => {
    dispatch(setSubjectTimePreference({ subjectId, timePreference }));
  };

  const allRoomOptions = salles.map(salle => ({
    value: salle.id.toString(),
    label: salle.name,
  }));


  return (
    <div className="space-y-6">
    <Tabs defaultValue="teacher_constraints" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="teacher_constraints">
          <Users className="mr-2 h-4 w-4"/>
          Indisponibilités Enseignants
        </TabsTrigger>
        <TabsTrigger value="subject_requirements">
          <Building className="mr-2 h-4 w-4" />
          Exigences des Matières
        </TabsTrigger>
      </TabsList>

      <TabsContent value="teacher_constraints">
        <Card className="shadow-inner">
          <CardHeader>
            <CardTitle>Indisponibilités des Enseignants</CardTitle>
            <CardDescription>
              Définissez les périodes où chaque enseignant ne peut pas être planifié.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Select 
                value={selectedTeacherId} 
                onValueChange={setSelectedTeacherId} 
                disabled={teachers.length === 0}
              >
                <SelectTrigger className="w-full md:w-72">
                  <SelectValue placeholder="Sélectionner un enseignant..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isTeacherFormOpen} onOpenChange={setIsTeacherFormOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!selectedTeacherId}>
                    <PlusCircle className="mr-2 h-4 w-4" /> 
                    Ajouter une indisponibilité
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouvelle Indisponibilité</DialogTitle>
                    <DialogDescription>
                      Pour : {teachers.find(t => t.id === selectedTeacherId)?.name} {teachers.find(t => t.id === selectedTeacherId)?.surname}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher-day">Jour</Label>
                      <Select 
                        value={newTeacherConstraint.day} 
                        onValueChange={(value) => setNewTeacherConstraint(s => ({
                          ...s, 
                          day: value
                        }))}
                      >
                        <SelectTrigger id="teacher-day">
                          <SelectValue placeholder="Choisir un jour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(dayLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Heure de début</Label>
                        <Input 
                          id="start-time" 
                          type="time" 
                          value={newTeacherConstraint.startTime} 
                          onChange={(e) => setNewTeacherConstraint(s => ({
                            ...s, 
                            startTime: e.target.value
                          }))} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="end-time">Heure de fin</Label>
                        <Input 
                          id="end-time" 
                          type="time" 
                          value={newTeacherConstraint.endTime} 
                          onChange={(e) => setNewTeacherConstraint(s => ({
                            ...s, 
                            endTime: e.target.value
                          }))} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="teacher-description">Raison (Optionnel)</Label>
                      <Input 
                        id="teacher-description" 
                        placeholder="Ex: Rendez-vous médical" 
                        value={newTeacherConstraint.description} 
                        onChange={(e) => setNewTeacherConstraint(s => ({
                          ...s, 
                          description: e.target.value
                        }))} 
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTeacherFormOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddTeacherConstraint}>
                      Sauvegarder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="border rounded-lg p-4 space-y-3 min-h-[10rem]">
              {filteredTeacherConstraints.length > 0 ? (
                filteredTeacherConstraints.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="text-sm">
                      <p className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        Indisponible le <span className="font-bold">{dayLabels[c.day as keyof typeof dayLabels]}</span> de <span className="font-bold">{c.startTime}</span> à <span className="font-bold">{c.endTime}</span>.
                      </p>
                      {c.description && (
                        <p className="text-muted-foreground text-xs italic pl-6">
                          "{c.description}"
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive" 
                      onClick={() => handleDeleteTeacherConstraint(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full">
                  <p className="text-lg">Aucune indisponibilité définie pour cet enseignant.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subject_requirements">
        <Card className="shadow-inner">
          <CardHeader>
            <CardTitle>Exigences des Matières</CardTitle>
            <CardDescription>
              Associez des matières à des salles spécifiques ou à des préférences horaires (matin/après-midi).
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {subjects.length > 0 ? (
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const requirement = subjectRequirements.find(r => r.subjectId === subject.id);
                  const selectedRoomIds = requirement?.allowedRoomIds.map(id => id.toString()) || [];
                  const selectedTimePref = requirement ? requirement.timePreference : 'ANY';
                  
                  return (
                    <div 
                      key={subject.id} 
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 gap-4"
                    >
                      <Label 
                        htmlFor={`subject-req-${subject.id}`} 
                        className="text-base font-medium flex-1 pt-2"
                      >
                        {subject.name}
                      </Label>
                      
                      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="flex-1 min-w-[250px]">
                            <MultiSelectField
                                label="Salles autorisées (optionnel)"
                                options={allRoomOptions}
                                selected={selectedRoomIds}
                                onChange={(values) => handleAllowedRoomsChange(subject.id, values)}
                                placeholder="Toutes les salles par défaut..."
                            />
                        </div>
                        
                        <div className="flex-1 min-w-[150px]">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock size={12} />
                            Préférence horaire
                          </Label>
                          
                          <Select 
                            value={selectedTimePref} 
                            onValueChange={(value: TimePreference) => 
                              handleTimePreferenceChange(subject.id, value)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ANY">Indifférent</SelectItem>
                              <SelectItem value="AM">Matin</SelectItem>
                              <SelectItem value="PM">Après-midi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full">
                <p className="text-lg">Aucune matière ou salle disponible.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  );
};

export default ConstraintsForm;
