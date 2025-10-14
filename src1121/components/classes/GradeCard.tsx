// src/components/classes/GradeCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import FormContainer from '@/components/FormContainer';
import { Role as AppRole, type Grade } from "@/types/index";
import { Layers3, ArrowRight } from 'lucide-react';
import { GradeWithCounts } from '@/app/(dashboard)/list/classes/page';
import { cn } from '@/lib/utils';

interface GradeCardProps {
    grade: GradeWithCounts;
    userRole?: AppRole;
    onSelect: () => void;
    isSelected: boolean;
}

const GradeCard: React.FC<GradeCardProps> = ({ grade, userRole, onSelect, isSelected }) => {
    return (
        <Card 
            className={cn(
                "hover:shadow-xl transition-all duration-300 bg-card hover:-translate-y-1 group flex flex-col justify-between cursor-pointer",
                isSelected && "shadow-xl border-primary"
            )}
            onClick={onSelect}
        >
            <div className="flex flex-col flex-grow p-4">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-primary font-bold">
                            {`Niveau ${grade.level}`}
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                             <Layers3 className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center py-6 transition-all duration-500">
                     <div className={cn("text-center transition-all duration-500", isSelected ? 'scale-125' : 'scale-100')}>
                        <p className="text-5xl font-extrabold text-foreground">{grade._count.classes}</p>
                    </div>
                </CardContent>
                <CardFooter className={cn(
                    "p-0 h-5", // Added height to prevent layout shift
                    isSelected ? "opacity-0" : "opacity-100"
                )}>
                    {/* The "Voir les détails" link has been removed */}
                </CardFooter>
            </div>
            {userRole === AppRole.ADMIN && (
                <div 
                    className={cn(
                        "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity",
                        isSelected && "opacity-0"
                    )}
                    onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with buttons
                >
                    <FormContainer table="grade" type="delete" id={grade.id} />
                </div>
            )}
        </Card>
    );
};

export default GradeCard;
