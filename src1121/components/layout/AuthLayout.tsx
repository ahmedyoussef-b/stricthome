// src/components/layout/AuthLayout.tsx
import type React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 overflow-hidden">
        <div className="form w-full max-w-md z-10">
            <div id="heading" className="text-center mb-0">
            <h1 className="font-belleza text-3xl sm:text-4xl font-bold text-white">{title}</h1>
            {description && <p className="font-alegreya text-muted-foreground mt-2 text-sm sm:text-base">{description}</p>}
            </div>
            <div>
            {children}
            </div>
            <p className="text-center text-muted-foreground text-xs mt-8">
            &copy; {new Date().getFullYear()} RoleAuthFlow. All rights reserved.
            </p>
        </div>
    </div>
  );
}
