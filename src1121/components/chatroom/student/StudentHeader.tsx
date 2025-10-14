import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { SafeUser } from '@/types';

interface StudentHeaderProps {
  user: SafeUser;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function StudentHeader({ user, onLogout, isLoggingOut }: StudentHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎓</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                EduChat Live
              </h1>
              <p className="text-sm text-gray-600">Espace élève</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <img
                src={user.img || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.name}`}
                alt={user.name || ''}
                className="w-8 h-8 rounded-full"
              />
              <div className="text-right">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-gray-500">Élève</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={onLogout} className="flex items-center gap-2" disabled={isLoggingOut}>
              {isLoggingOut ? <Spinner size="sm" className="mr-2" /> : <LogOut className="w-4 h-4" />}
              {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
