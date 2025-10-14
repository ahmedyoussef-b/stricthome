// src/app/(dashboard)/profile/page.tsx
import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import UserProfileClient from "@/components/profile/UserProfileClient";
import type { UserProfile } from "@/components/profile/types";

async function getUserProfile(session: any): Promise<UserProfile | null> {
    if (!session?.user?.id || !session.user.role) {
        return null;
    }

    const includeUser = {
        user: {
            select: { id: true, email: true, username: true, role: true, img: true, twoFactorEnabled: true }
        }
    };

    try {
        switch (session.user.role) {
            case Role.ADMIN:
                return await prisma.admin.findUnique({ where: { userId: session.user.id }, include: includeUser }) as UserProfile;
            case Role.TEACHER:
                return await prisma.teacher.findUnique({ where: { userId: session.user.id }, include: includeUser }) as UserProfile;
            case Role.STUDENT:
                return await prisma.student.findUnique({ where: { userId: session.user.id }, include: includeUser }) as UserProfile;
            case Role.PARENT:
                return await prisma.parent.findUnique({ where: { userId: session.user.id }, include: includeUser }) as UserProfile;
            default:
                return null;
        }
    } catch (error) {
        console.error("Failed to fetch user profile:", error);
        return null;
    }
}


const ProfilePage = async () => {
  const session = await getServerSession();

  if (!session?.user?.id || !session.user.role) {
    redirect(`/login`);
    return null;
  }

  const userProfile = await getUserProfile(session);

  if (!userProfile) {
    return (
      <div className="p-4 md:p-6 text-center">
        Profil non trouvé. Veuillez contacter l'administration.
      </div>
    );
  }

  return <UserProfileClient userProfile={userProfile} />;
};

export default ProfilePage;
