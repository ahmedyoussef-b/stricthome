import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface ActionButtonsProps {
  onBack: () => void;
  onSave: () => void;
  isLoading: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onBack, onSave, isLoading }) => {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>
      <Button onClick={onSave} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Sauvegarder
      </Button>
    </div>
  );
};

export default ActionButtons;