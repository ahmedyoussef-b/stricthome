// src/components/student/StudentProfileCard.tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import FormContainer from "@/components/FormContainer";
import DynamicAvatar from "@/components/DynamicAvatar";
import { Role } from "@prisma/client";
import type { StudentWithDetails } from "@/types/index";
import { Droplets, Calendar as CalendarIcon, Mail, Phone, Edit } from 'lucide-react';

interface StudentProfileCardProps {
  student: StudentWithDetails;
  userRole?: Role;
}

export default function StudentProfileCard({ student, userRole }: StudentProfileCardProps) {
  return (
    <Card className="flex-1 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="p-0 relative h-32 bg-gradient-to-r from-primary/20 to-accent/20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(20%+1rem)] transform">
          <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background bg-background shadow-lg">
            <DynamicAvatar
              imageUrl={student.user?.img || student.img}
              seed={student.id || student.user?.email}
              alt={`Avatar de ${student.name} ${student.surname}`}
              isLCP={true}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-20 p-6 text-center">
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">{student.name} {student.surname}</h2>
          {userRole === Role.ADMIN && (
            <FormContainer
              table="student"
              type="update"
              data={{
                ...student,
                username: student.user?.username,
                email: student.user?.email,
                birthday: student.birthday ? new Date(student.birthday) : undefined,
              }}
            />
          )}
        </div>
        <p className="text-muted-foreground mt-1">Étudiant à Riadh5College, apprenant enthousiaste.</p>
        
        <div className="mt-6 grid grid-cols-2 gap-4 text-left text-sm text-muted-foreground">
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
            <Droplets size={16} className="text-primary"/>
            <span>{student.bloodType || "-"}</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
            <CalendarIcon size={16} className="text-primary"/>
            <span>{student.birthday ? new Intl.DateTimeFormat("fr-FR").format(new Date(student.birthday)) : "-"}</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
            <Mail size={16} className="text-primary"/>
            <span className="truncate">{student.user?.email || "-"}</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
            <Phone size={16} className="text-primary"/>
            <span>{student.phone || "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
