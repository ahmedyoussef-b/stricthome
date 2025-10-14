// src/components/Navbar.tsx
"use client"; 
import Image from "next/image";
import Link from 'next/link';
import { AppHeaderLogoutButton } from "./layout/AppHeaderLogoutButton";
import { ThemeToggleButton } from "./layout/ThemeToggleButton";
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import NotificationDropdown from './NotificationDropdown';
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/lib/redux/slices/authSlice";
import { selectUnreadCount } from '@/lib/redux/slices/notificationSlice';
import type { SafeUser, Role } from "@/types";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, Search, Mail, Bell } from "lucide-react";
import Menu from "@/components/Menu";
import { SidebarTrigger } from "./ui/sidebar";

interface NavbarProps {
  user: SafeUser | null;
}

const Navbar: React.FC<NavbarProps> = ({ user: initialUser }) => {
    const currentUser = useSelector(selectCurrentUser);
    const unreadNotifications = useSelector(selectUnreadCount);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
    // Determine which user object to display. Prioritize the client-side Redux state once mounted.
    const userToDisplay = mounted ? currentUser : initialUser;
    const rolePath = userToDisplay?.role.toLowerCase();
  
    useEffect(() => {
      setSearchQuery(searchParams.get('search') || '');
    }, [searchParams]);
  
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (searchQuery === (searchParams.get('search') || '')) {
          return;
        }
        
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) {
          params.set('search', searchQuery);
        } else {
          params.delete('search');
        }
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
      }, 500);
  
      return () => clearTimeout(timeoutId);
    }, [searchQuery, pathname, searchParams, router]);
  
    useEffect(() => {
      setMounted(true);
    }, []);
  
    if (!mounted) {
      return (
        <div className="flex items-center justify-between p-4 border-b bg-background w-full fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-md animate-pulse"></div>
              <div className="hidden md:block h-8 w-40 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="flex-1 flex justify-center px-8">
              <div className="h-10 w-full max-w-sm bg-muted rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
              <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
              <div className="h-9 w-24 bg-muted rounded-md animate-pulse"></div>
          </div>
        </div>
      );
    }
  
    return (
      <div className="flex items-center  justify-between p-4 border-b bg-background">
          {/* LEFT SIDE: Menu & Logo */}
          <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <MenuIcon/>
                        <span className="sr-only">Ouvrir le menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <SheetHeader className="p-4 border-b">
                       <SheetTitle>Menu</SheetTitle>
                       <SheetDescription className="sr-only">
                           Navigation principale de l'application
                       </SheetDescription>
                    </SheetHeader>
                    <Menu role={userToDisplay?.role} />
                </SheetContent>
              </Sheet>
              
              <Link href={rolePath ? `/${rolePath}` : `/accueil`} className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <Image src="https://picsum.photos/32/32" alt="logo" width={32} height={32} data-ai-hint="logo company" priority />
                  <span className="font-bold text-lg text-primary">College Riadh5</span>
              </Link>
          </div>
  
          {/* CENTER: Search Bar */}
          <div className="flex-1 flex justify-center px-8">
               <div className="w-full max-w-sm hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-border px-2">
                  <Search size={14} className="opacity-50" />
                  <input
                    type="text"
                    placeholder="Rechercher sur toute la plateforme..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 bg-transparent outline-none"
                  />
              </div>
          </div>
  
          {/* RIGHT SIDE: Actions & User */}
          <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggleButton />
              
              <Link href="/list/messages" className="bg-card border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer">
                  <Mail size={18}/>
              </Link>
              
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <button className="bg-card border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative">
                          <Bell size={18}/>
                          {unreadNotifications > 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px] animate-pulse">
                                  {unreadNotifications}
                              </div>
                          )}
                      </button>
                  </DropdownMenuTrigger>
                  <NotificationDropdown />
              </DropdownMenu>
  
              {userToDisplay ? (
                  <>
                      <div className="hidden sm:flex flex-col text-right">
                          <span className="text-sm font-semibold">{userToDisplay.name || userToDisplay.email}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                              {userToDisplay.role.toLowerCase()}
                          </span>
                      </div>
                       <Link href="/profile" className="relative h-10 w-10 cursor-pointer">
                          <Image
                              src={userToDisplay.img ? userToDisplay.img : `https://placehold.co/128x128.png`}
                              alt="Photo de profil"
                              fill
                              sizes="40px"
                              className="rounded-full object-cover"
                              data-ai-hint="forest sun"
                          />
                      </Link>
                      <AppHeaderLogoutButton /> 
                  </>
              ) : (
                  <span className="text-xs text-muted-foreground">Non connecté</span>
              )}
          </div>
      </div>
    );
  };
  
  export default Navbar;
