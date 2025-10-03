// src/components/ToggleButton.tsx
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function ToggleButton() {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        'text-white transition-colors duration-300',
        isActive 
          ? 'bg-red-custom hover:bg-red-custom/90' 
          : 'bg-orange-custom hover:bg-orange-custom/90'
      )}
    >
      {isActive ? <AlertTriangle className="mr-2" /> : <CheckCircle className="mr-2" />}
      {isActive ? 'Activé' : 'Désactivé'}
    </Button>
  );
}
