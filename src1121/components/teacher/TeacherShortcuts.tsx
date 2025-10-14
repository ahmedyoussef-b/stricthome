// src/components/teacher/TeacherShortcuts.tsx
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TeacherShortcutsProps {
  teacherId: string;
}

export default function TeacherShortcuts({ teacherId }: TeacherShortcutsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Raccourcis</CardTitle>
        <CardDescription>Accès rapide à vos pages les plus utilisées.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 flex-wrap">
          <Button asChild variant="outline">
            <Link href={`/list/classes?teacherId=${teacherId}`}>Mes Classes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/list/lessons?teacherId=${teacherId}`}>Mes Cours</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/list/exams?teacherId=${teacherId}`}>Mes Examens</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/list/assignments?teacherId=${teacherId}`}>Mes Devoirs</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
