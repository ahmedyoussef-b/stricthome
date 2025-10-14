import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export function ChatAccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Accès non autorisé
          </h3>
          <p className="text-gray-500">
            Vous n'avez pas les permissions nécessaires pour accéder à cette salle de chat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}