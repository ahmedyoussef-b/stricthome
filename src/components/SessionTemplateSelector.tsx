// src/components/SessionTemplateSelector.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, HelpCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type Template = {
  id: 'standard' | 'quiz' | 'poll';
  title: string;
  description: string;
  icon: React.ElementType;
};

const templates: Template[] = [
  {
    id: 'standard',
    title: 'Leçon Standard',
    description: 'Une session vidéo simple avec un espace de travail partagé.',
    icon: FileText,
  },
  {
    id: 'quiz',
    title: 'Quiz Interactif',
    description: 'Lancez un quiz et suivez les réponses des élèves en direct.',
    icon: HelpCircle,
  },
  {
    id: 'poll',
    title: 'Sondage Rapide',
    description: 'Posez une question et recueillez rapidement l\'avis de la classe.',
    icon: Lightbulb,
  },
];

interface SessionTemplateSelectorProps {
    onSelect: (template: Template) => void;
}

export function SessionTemplateSelector({ onSelect }: SessionTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (template: Template) => {
    setSelectedId(template.id);
    onSelect(template);
  };

  return (
    <div className="p-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            onClick={() => handleSelect(template)}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg',
              selectedId === template.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'
            )}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <template.icon className="h-6 w-6 text-primary" />
              <CardTitle className="text-base font-semibold">{template.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
