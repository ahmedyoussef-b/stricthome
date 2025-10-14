import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  description?: string;
}

export function ChatHeader({ title, description }: ChatHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            1 en ligne
          </Badge>
        </div>
      </div>
    </CardHeader>
  );
}