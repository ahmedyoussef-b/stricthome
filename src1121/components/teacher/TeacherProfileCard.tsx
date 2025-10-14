// src/components/teacher/TeacherProfileCard.tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import FormContainer from "@/components/FormContainer";
import DynamicAvatar from "@/components/DynamicAvatar";
import { Role } from "@prisma/client";
import type { TeacherWithDetails } from "@/types/index";
import { Mail, Phone, Cake, Droplets } from 'lucide-react';

interface TeacherProfileCardProps {
  teacher: TeacherWithDetails;
  userRole?: Role;
}

export default function TeacherProfileCard({ teacher, userRole }: TeacherProfileCardProps) {
  return (
     <Card className="flex-1 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="p-0 relative h-32 bg-gradient-to-r from-primary/20 to-accent/20">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(20%+1rem)] transform">
                <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background bg-background shadow-lg">
                    <DynamicAvatar 
                        imageUrl={teacher.user?.img || teacher.img}
                        seed={teacher.id || teacher.user?.email}
                        alt={`Avatar de ${teacher.name} ${teacher.surname}`}
                        isLCP={true}
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-20 p-6 text-center">
          <div className="flex items-center justify-center gap-4">
             <h2 className="text-2xl font-bold text-foreground">{teacher.name} {teacher.surname}</h2>
             {userRole === Role.ADMIN && (
                <FormContainer
                table="teacher"
                type="update"
                data={{
                    ...teacher,
                    username: teacher.user?.username,
                    email: teacher.user?.email,
                    birthday: teacher.birthday ? new Date(teacher.birthday) : undefined,
                    subjects: teacher.subjects,
                }}
              />
            )}
          </div>
          <p className="text-muted-foreground mt-1">Éducateur dévoué chez Riadh5College.</p>
          
           <div className="mt-6 grid grid-cols-2 gap-4 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                <Mail size={16} className="text-primary"/>
                <span className="truncate">{teacher.user?.email || "-"}</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                <Phone size={16} className="text-primary"/>
                <span>{teacher.phone || "-"}</span>
              </div>
               <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                <Cake size={16} className="text-primary"/>
                <span>{teacher.birthday ? new Intl.DateTimeFormat("fr-FR").format(new Date(teacher.birthday)) : "-"}</span>
              </div>
               <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                <Droplets size={16} className="text-primary"/>
                <span>{teacher.bloodType}</span>
              </div>
          </div>
        </CardContent>
    </Card>
  );
}
