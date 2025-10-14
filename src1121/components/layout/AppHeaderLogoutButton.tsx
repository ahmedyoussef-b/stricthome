// src/components/layout/AppHeaderLogoutButton.tsx
"use client";

import { LogOut } from "lucide-react";
import { useLogoutMutation } from "@/lib/redux/api/authApi";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import styles from './AppHeaderLogoutButton.module.css';
import { cn } from "@/lib/utils";

export function AppHeaderLogoutButton() {
  const [logout, { isLoading: logoutLoading }] = useLogoutMutation();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast({ title: "Déconnexion réussie", description: "Vous avez été déconnecté avec succès." });
      window.location.href = '/'; // Force reload to ensure session state is cleared and redirect to home
    } catch (err) {
      toast({ variant: "destructive", title: "Échec de la déconnexion", description: "Une erreur est survenue lors de la déconnexion." });
      window.location.href = '/'; // Still redirect on error
    }
  };

  return (
    <button 
        onClick={handleLogout} 
        disabled={logoutLoading} 
        className={cn(styles.button41)}
        role="button"
    >
      <span className={styles.text}>
        {logoutLoading ? (
            <Spinner size="sm"/>
        ) : (
            <LogOut className="h-4 w-4" />
        )}
        <span>
            {logoutLoading ? "Déconnexion..." : "Déconnexion"}
        </span>
      </span>
    </button>
  );
}

export default AppHeaderLogoutButton;
