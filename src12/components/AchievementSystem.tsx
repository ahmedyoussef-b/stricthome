// components/AchievementSystem.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Users, 
  Brain,
  Award,
  Crown
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  progress: number;
  target: number;
  reward: number;
  category: 'skills' | 'collaboration' | 'mastery' | 'consistency';
  unlocked: boolean;
}

export function AchievementSystem() {
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Premiers Pas',
      description: 'Compléter 5 sessions d\'apprentissage',
      icon: <Zap className="h-6 w-6" />,
      progress: 3,
      target: 5,
      reward: 100,
      category: 'consistency',
      unlocked: false
    },
    {
      id: '2',
      title: 'Communicateur Né',
      description: 'Atteindre le niveau 80 en compétence Communication',
      icon: <Users className="h-6 w-6" />,
      progress: 65,
      target: 80,
      reward: 200,
      category: 'skills',
      unlocked: false
    },
    {
      id: '3',
      title: 'Maître de la Pensée Critique',
      description: 'Résoudre 10 problèmes complexes',
      icon: <Brain className="h-6 w-6" />,
      progress: 7,
      target: 10,
      reward: 300,
      category: 'mastery',
      unlocked: false
    },
    {
      id: '4',
      title: 'Leader Collaboratif',
      description: 'Animer 3 sessions de groupe avec succès',
      icon: <Crown className="h-6 w-6" />,
      progress: 2,
      target: 3,
      reward: 250,
      category: 'collaboration',
      unlocked: false
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'skills': return 'bg-blue-100 text-blue-800';
      case 'collaboration': return 'bg-green-100 text-green-800';
      case 'mastery': return 'bg-purple-100 text-purple-800';
      case 'consistency': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Système de Récompenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(achievement => (
            <div key={achievement.id} className={`border rounded-lg p-4 ${
              achievement.unlocked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {achievement.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{achievement.title}</h4>
                    <Badge className={getCategoryColor(achievement.category)}>
                      {achievement.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>{achievement.progress}/{achievement.target}</span>
                    </div>
                    <Progress 
                      value={(achievement.progress / achievement.target) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <Award className="h-4 w-4" />
                      {achievement.reward} pts
                    </div>
                    {achievement.unlocked && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Débloqué
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Points totaux et classement */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Points totaux: 1,250
              </h4>
              <p className="text-sm text-muted-foreground">
                Classé #3 dans la classe
              </p>
            </div>
            <Badge variant="secondary" className="text-lg">
              🥉 Bronze
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
