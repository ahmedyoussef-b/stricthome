import * as React from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Users, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Class, Teacher } from '@/types';

interface ViewModeTabsProps {
  viewMode: 'class' | 'teacher';
  onViewModeChange: (value: string) => void;
  selectedClassId: string;
  onClassChange: (value: string) => void;
  selectedTeacherId: string;
  onTeacherChange: (value: string) => void;
  classes: Pick<Class, 'id' | 'name'>[];
  teachers: Pick<Teacher, 'id' | 'name' | 'surname'>[];
}

const ViewModeTabs: React.FC<ViewModeTabsProps> = ({
  viewMode,
  onViewModeChange,
  selectedClassId,
  onClassChange,
  selectedTeacherId,
  onTeacherChange,
  classes,
  teachers
}) => {
  return (
    <div className="flex-1">
      <Tabs value={viewMode} onValueChange={onViewModeChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="class">
            <Users className="mr-2 h-4 w-4" />
            Par Classe
          </TabsTrigger>
          <TabsTrigger value="teacher">
            <User className="mr-2 h-4 w-4" />
            Par Professeur
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="class" className="mt-4">
          <Label>Classe :</Label>
          <Select value={selectedClassId} onValueChange={onClassChange}>
            <SelectTrigger className="w-full md:w-72 mt-1">
              <SelectValue placeholder="Sélectionner une classe..." />
            </SelectTrigger>
            <SelectContent>
              {classes.filter(classItem => classItem && classItem.id).map(classItem => (
                <SelectItem key={classItem.id} value={classItem.id.toString()}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>

        <TabsContent value="teacher" className="mt-4">
          <Label>Professeur :</Label>
          <Select value={selectedTeacherId} onValueChange={onTeacherChange}>
            <SelectTrigger className="w-full md:w-72 mt-1">
              <SelectValue placeholder="Sélectionner un professeur..." />
            </SelectTrigger>
            <SelectContent>
              {teachers.filter(teacher => teacher && teacher.id).map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.surname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewModeTabs;
