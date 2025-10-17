// src/app/page.tsx
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPublicAnnouncements } from '@/lib/actions/announcement.actions';
import { ArrowRight, BookOpen, UserCheck, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { AnnouncementWithAuthor } from '@/lib/types';
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Menu from '@/components/Menu';
import { Suspense } from 'react';
import { HomePageContent } from '@/components/HomePageContent';


export default async function HomePage() {
  const announcements = await getPublicAnnouncements(3);

  // The session logic is now handled in HomePageContent
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <HomePageContent announcements={announcements} />
    </Suspense>
  );
}
