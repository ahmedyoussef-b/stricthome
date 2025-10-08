// components/SkillMatrix.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Target, TrendingUp, Brain, Zap } from 'lucide-react';

interface SkillMetric {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  sessions: number;
  lastActivity: Date;
}

interface SkillMatrixProps {
  studentId: string;
  classId: string | null | undefined;
}

export function SkillMatrix({ studentId, classId }: SkillMatrixProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Données simulées - à remplacer par votre API
  const skillData: SkillMetric[] = [
    { skill: 'Résolution de problèmes', currentLevel: 75, targetLevel: 90, progress: 65, sessions: 12, lastActivity: new Date() },
    { skill: 'Collaboration', currentLevel: 60, targetLevel: 85, progress: 45, sessions: 8, lastActivity: new Date() },
    { skill: 'Pensée critique', currentLevel: 70, targetLevel: 95, progress: 55, sessions: 15, lastActivity: new Date() },
    { skill: 'Communication', currentLevel: 65, targetLevel: 80, progress: 70, sessions: 10, lastActivity: new Date() },
    { skill: 'Créativité', currentLevel: 55, targetLevel: 75, progress: 40, sessions: 6, lastActivity: new Date() },
  ];

  const radarData = skillData.map(skill => ({
    subject: skill.skill,
    A: skill.currentLevel,
    B: skill.targetLevel,
    fullMark: 100,
  }));

  const recommendations = useMemo(() => [
    { skill: 'Résolution de problèmes', action: 'Proposer des défis algorithmiques complexes', priority: 'high' },
    { skill: 'Collaboration', action: 'Activités de groupe avec rôles définis', priority: 'medium' },
    { skill: 'Créativité', action: 'Sessions de brainstorming guidé', priority: 'high' },
  ], []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Radar Chart des Compétences */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Profil des Compétences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Niveau Actuel" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Objectif" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations Intelligentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-3 rounded-lg border-l-4 ${
              rec.priority === 'high' 
                ? 'border-l-red-500 bg-red-50' 
                : 'border-l-yellow-500 bg-yellow-50'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm">{rec.skill}</span>
                <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                  {rec.priority === 'high' ? 'Prioritaire' : 'Recommandé'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{rec.action}</p>
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Zap className="h-3 w-3 mr-1" />
                Appliquer
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Progression Détaillée */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Détail des Progrès
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {skillData.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{skill.skill}</span>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{skill.sessions} sessions</Badge>
                    <span className="text-sm font-bold text-blue-600">
                      Niveau {skill.currentLevel}/100
                    </span>
                  </div>
                </div>
                <Progress value={skill.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Objectif: {skill.targetLevel}/100</span>
                  <span>Dernière activité: {skill.lastActivity.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
