// src/components/dashboard/admin/ChatroomDashboard.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Users, Clock, Video, BarChart3, Presentation } from 'lucide-react';
import { useEffect, useState } from 'react';

type SessionData = {
    id: string;
    title: string;
    host: { name: string | null } | null;
    startTime: string; // Changed to string
    endTime: string | null; // Changed to string
    _count: { participants: number };
};

type Stats = {
    totalSessions: number;
    avgParticipants: number;
    avgDuration: number;
    sessionsPerTeacher: { name: string; sessions: number }[];
    recentSessions: SessionData[];
};

interface ChatroomDashboardProps {
    initialStats: Stats;
}

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
};

export default function ChatroomDashboard({ initialStats }: ChatroomDashboardProps) {
    const [stats] = useState<Stats>(initialStats);

    if (!stats) {
        return <div>Chargement des données du tableau de bord...</div>;
    }
    
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Presentation className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Chatroom</h1>
                    </div>
                    <p className="text-muted-foreground">Statistiques agrégées sur l'utilisation des sessions interactives.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                      <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Retour
                      </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/list/chatroom/chat/admin">
                            <Video className="mr-2 h-4 w-4"/>
                            Lancer une Réunion
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Sessions totales</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSessions}</div>
                        <p className="text-xs text-muted-foreground">sur les 7 derniers jours</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Participants moyens</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgParticipants.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">par session</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
                        <p className="text-xs text-muted-foreground">par session</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Sessions par Professeur</CardTitle>
                        <CardDescription>Nombre de sessions lancées par chaque professeur cette semaine.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.sessionsPerTeacher}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                <Legend/>
                                <Bar dataKey="sessions" name="Sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sessions Récentes</CardTitle>
                        <CardDescription>Les 5 dernières sessions interactives.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titre</TableHead>
                                    <TableHead>Professeur</TableHead>
                                    <TableHead className="text-right">Participants</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentSessions.slice(0, 5).map(session => (
                                    <TableRow key={session.id}>
                                        <TableCell className="font-medium">{session.title}</TableCell>
                                        <TableCell>{session.host?.name ?? 'N/A'}</TableCell>
                                        <TableCell className="text-right">{session._count.participants}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
