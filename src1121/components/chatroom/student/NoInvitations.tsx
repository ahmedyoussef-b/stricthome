import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export function NoInvitations() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bell className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune invitation pour le moment
        </h3>
        <p className="text-gray-600 mb-6">
          Vous recevrez une notification dès qu'un professeur lancera une session.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          En attente de sessions...
        </div>
      </CardContent>
    </Card>
  );
}