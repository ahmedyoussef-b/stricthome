
"use client";

import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react"; 
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthLoading } from "@/lib/redux/slices/authSlice";
import { useLogoutMutation } from "@/lib/redux/api/authApi";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SafeUser } from "@/types"; // Import SafeUser


interface ApiErrorData {
  message: string;
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error;
}


export function AppHeader() {
  const user: SafeUser | null = useSelector(selectCurrentUser); // Explicitly type user
  const authLoading: boolean = useSelector(selectIsAuthLoading); // Explicitly type authLoading
  const [logout, { isLoading: logoutLoading, isSuccess: logoutSuccess, isError: logoutIsError, error: logoutErrorData }] = useLogoutMutation();
  
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (logoutSuccess) {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    }
    if (logoutIsError) {
      let errorMessage = "Could not log you out properly.";
      if (isFetchBaseQueryError(logoutErrorData)) {
        const errorData = logoutErrorData.data as ApiErrorData;
        errorMessage = errorData?.message || `Error ${logoutErrorData.status}`;
      } else if (isSerializedError(logoutErrorData)) {
        errorMessage = logoutErrorData.message || "A serialized error occurred during logout.";
      }
      toast({ variant: "destructive", title: "Logout Failed", description: errorMessage });
      router.push('/login');
    }
  }, [logoutSuccess, logoutIsError, logoutErrorData, router, toast]);


  const handleLogout = async () => {
    await logout();
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={user ? `/${user.role.toLowerCase()}` : "/login"} className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="font-headline text-xl font-semibold text-primary">RoleAuthFlow</span>
        </Link>
        <div className="flex items-center space-x-4">
          {authLoading && !user ? ( 
             <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          ) : user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email} ({user.role})
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutLoading}>
                {logoutLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Logout
              </Button>
            </>
          ) : ( 
            <Button variant="default" size="sm" asChild>
              <Link href="/login">
                <UserCircle className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
