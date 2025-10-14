// src/app/[locale]/(dashboard)/admin/replacements/page.tsx
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck, AlertTriangle } from 'lucide-react';

export default async function ReplacementPage() {

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Assistant de Remplacement</h1>
                    <p className="text-muted-foreground mt-1">
                        Cette fonctionnalité est temporairement désactivée.
                    </p>
                </div>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Fonctionnalité en maintenance</CardTitle>
                    <CardDescription>
                        L'assistant de remplacement basé sur l'IA est en cours de maintenance. Veuillez réessayer plus tard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mr-4"/>
                        <p className="text-muted-foreground">Nous nous excusons pour la gêne occasionnée.</p>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}
