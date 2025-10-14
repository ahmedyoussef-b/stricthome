// src/components/chatroom/dashboard/TemplateSelector.tsx
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, BarChart3, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SESSION_TEMPLATES } from '@/lib/constants';
import { SessionTemplate } from '@/lib/redux/slices/session/types'; // Import SessionTemplate type

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string | null) => void;
}

export default function TemplateSelector({ selectedTemplateId, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold">Étape 1: Choisir un modèle (Optionnel)</h2>
        <p className="text-muted-foreground">
          Sélectionnez un modèle pour pré-charger des quiz et des sondages dans votre session.
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(SESSION_TEMPLATES as SessionTemplate[]).map((template) => { // Cast SESSION_TEMPLATES to SessionTemplate[]
            const isSelected = selectedTemplateId === template.id;
            return (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(isSelected ? null : template.id)}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md rounded-lg',
                  isSelected && 'ring-2 ring-primary border-primary bg-primary/5'
                )}
              >
                <div className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-semibold">
                      {template.name}
                    </h3>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex gap-2">
                    {template.quizzes.length > 0 && (
                      <Badge variant="outline">
                        <Brain className="w-3 h-3 mr-1" />
                        {template.quizzes.length} Quiz
                      </Badge>
                    )}
                    {template.polls.length > 0 && (
                      <Badge variant="outline">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        {template.polls.length} Sondage
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
