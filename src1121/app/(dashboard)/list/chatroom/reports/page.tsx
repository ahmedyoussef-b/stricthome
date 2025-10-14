
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, Clock, Users, TrendingUp } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux-hooks';
import SessionReportCard from '@/components/chatroom/reports/SessionReportCard';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { Role } from '@/types';

export type SessionReport = {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  duration: number;
  participants: {
    id: string;
    name: string;
    email: string;
    joinTime: string;
    leaveTime: string;
    duration: number;
  }[];
  maxParticipants: number;
  status: 'active' | 'completed';
};

export default function ReportsPage() {
  console.log("📊 [TeacherReportsPage] Le composant est en cours de rendu.");
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const { sessions, loading } = useAppSelector(state => state.reports) as { sessions: SessionReport[]; loading: boolean };

  useEffect(() => {
     console.log("📊 [TeacherReportsPage] Le composant est monté. Vérification du rôle.");
    if (!user || user.role !== Role.TEACHER) {
       console.warn("📊 [TeacherReportsPage] Utilisateur non enseignant ou non trouvé. Redirection.");
      router.replace('/');
      return;
    }
  }, [user, router]);

  if (!user || user.role !== Role.TEACHER) {
    return <div>Accès non autorisé</div>;
  }

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s: SessionReport) => s.status === 'active').length;
  const completedSessions = sessions.filter((s: SessionReport) => s.status === 'completed').length;
  const totalParticipants = sessions.reduce((sum: number, s: SessionReport) => sum + s.participants.length, 0);
  const averageSessionDuration = totalSessions > 0 
 ? sessions.reduce((sum, s: SessionReport) => sum + s.duration, 0) / totalSessions 
    : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/list/chatroom/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au tableau de bord
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Rapports des Sessions</h1>
          </div>
          <p className="text-gray-600">Vue d'ensemble de toutes les sessions organisées</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions totales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{activeSessions} actives</Badge>
                <Badge variant="outline">{completedSessions} terminées</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants totaux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Moyenne: {totalSessions > 0 ? Math.round(totalParticipants / totalSessions) : 0} par session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(Math.round(averageSessionDuration))}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Par session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSessions > 0 ? Math.round((totalParticipants / (totalSessions * 4)) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taux de participation moyen
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Sessions</CardTitle>
            <CardDescription>
              Liste détaillée de toutes les sessions organisées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune session trouvée
                </h3>
                <p className="text-gray-500">
                  Les rapports des sessions apparaîtront ici une fois qu'elles seront créées.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {sessions.map((session) => (
                  <SessionReportCard key={session.id} session={session as any} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
