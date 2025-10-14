// src/components/classes/ClassCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ClassWithDetails } from '@/app/(dashboard)/list/classes/page';

interface ClassCardProps {
    classItem: ClassWithDetails;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem }) => {
    const studentPercentage = classItem.capacity > 0 ? (classItem._count.students / classItem.capacity) * 100 : 0;

    return (
        <Card className="hover:shadow-xl transition-all duration-300 bg-card hover:-translate-y-1 group flex flex-col justify-between">
            <Link href={`/list/classes/${classItem.id}`} passHref className="flex flex-col flex-grow p-4">
                <CardHeader className="p-0 mb-4">
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-primary font-bold">
                            {classItem.name}
                        </CardTitle>
                         <div className="p-2 bg-primary/10 rounded-lg">
                             <Users className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow">
                     <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm font-medium text-foreground">Effectif</span>
                            <span className="text-lg font-bold text-foreground">{classItem._count.students} / {classItem.capacity}</span>
                        </div>
                        <Progress value={studentPercentage} className="h-2" />
                    </div>
                </CardContent>
                <CardFooter className="p-0 mt-4">
                     <Button variant="link" className="p-0 h-auto text-sm text-primary group-hover:underline">
                        Voir les Détails <ArrowRight className="ml-1 h-4 w-4" />
                     </Button>
                </CardFooter>
            </Link>
        </Card>
    );
};

export default ClassCard;
