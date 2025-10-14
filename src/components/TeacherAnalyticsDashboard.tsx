// components/TeacherAnalyticsDashboard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Brain
} from 'lucide-react';
import { Button } from './ui/button';

const skillDistributionData = [
  { skill: 'Communication', students: 12, average: 75 },
  { skill: 'Résolution', students: 15, average: 68 },
  { skill: 'Collaboration', students: 8, average: 62 },
  { skill: 'Créativité', students: 6, average: 58 },
  { skill: 'Leadership', students: 4, average: 72 }
];

const progressData = [
  { week: 'Sem 1', communication: 65, resolution: 60, collaboration: 55 },
  { week: 'Sem 2', communication: 68, resolution: 63, collaboration: 58 },
  { week: 'Sem 3', communication: 72, resolution: 67, collaboration: 62 },
  { week: 'Sem 4', communication: 75, resolution: 70, collaboration: 65 }
];

const interventionData = [
  { name: 'Nécessite aide', value: 3 },
  { name: 'En progression', value: 12 },
  { name: 'Autonome', value: 8 }
];

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export function TeacherAnalyticsDashboard() {
  return (
    <div className="space-y-6 mt-12">
        <h2 className="text-2xl font-bold tracking-tight">Analyses de la Classe</h2>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              +12% depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18%</div>
            <p className="text-xs text-muted-foreground">
              Sur les 4 dernières semaines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interventions Requises</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Élèves nécessitant un soutien
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectifs Atteints</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              Des objectifs mensuels accomplis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Progression dans le Temps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Progression Hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="communication" stroke="#3b82f6" />
                <Line type="monotone" dataKey="resolution" stroke="#10b981" />
                <Line type="monotone" dataKey="collaboration" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* État des Interventions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              État des Élèves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={interventionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {interventionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alertes et Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Actions Prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-red-800">Intervention Requise</span>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  3 élèves stagnent en compétence "Résolution de problèmes"
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Planifier un atelier de soutien
                </Button>
              </div>

              <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-yellow-800">Reconnaissance</span>
                  <Badge variant="secondary">Recommandé</Badge>
                </div>
                <p className="text-sm text-yellow-700 mb-2">
                  5 élèves ont dépassé leurs objectifs ce mois-ci
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Attribuer des badges de performance
                </Button>
              </div>

              <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-blue-800">Optimisation</span>
                  <Badge variant="secondary">Suggestion</Badge>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  Le groupe montre un fort potentiel en créativité
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Proposer des défis créatifs avancés
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
