// src/app/(dashboard)/admin/chatroom/page.tsx
export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import ChatroomDashboard from '@/components/dashboard/admin/ChatroomDashboard';
import { getServerSession } from '@/lib/auth-utils';
import { Role } from '@/types';
import { redirect } from 'next/navigation';

async function getStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const rawSessions = await prisma.chatroomSession.findMany({
        where: {
            startTime: {
                gte: sevenDaysAgo,
            },
        },
        include: {
            host: {
                select: {
                    name: true,
                }
            },
            _count: {
                select: { participants: true },
            },
        },
        orderBy: {
            startTime: 'desc',
        },
    });

    let totalDurationSeconds = 0;
    let totalParticipants = 0;
    const teacherSessionsMap = new Map<string, number>();

    rawSessions.forEach(session => {
        if (session.endTime && session.host?.name) {
            totalDurationSeconds += (session.endTime.getTime() - session.startTime.getTime()) / 1000;
        }
        totalParticipants += session._count.participants;

        if (session.host?.name) {
            teacherSessionsMap.set(
                session.host.name,
                (teacherSessionsMap.get(session.host.name) || 0) + 1
            );
        }
    });

    const totalSessions = rawSessions.length;
    const avgDuration = totalSessions > 0 ? totalDurationSeconds / totalSessions : 0;
    const avgParticipants = totalSessions > 0 ? totalParticipants / totalSessions : 0;

    const sessionsPerTeacher = Array.from(teacherSessionsMap.entries()).map(([name, sessionCount]) => ({
        name,
        sessions: sessionCount,
    }));

    // Convert Date objects to strings for serialization
    const recentSessions = rawSessions.map(session => ({
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime ? session.endTime.toISOString() : null,
    }));

    return {
        totalSessions,
        avgParticipants,
        avgDuration,
        sessionsPerTeacher,
        recentSessions,
    };
}


export default async function AdminChatroomDashboardPage() {
    const session = await getServerSession();
    if (!session || session.user.role !== Role.ADMIN) {
        redirect('/login');
    }

    const stats = await getStats();
    
    return <ChatroomDashboard initialStats={stats} />;
}
