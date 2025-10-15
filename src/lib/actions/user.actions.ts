// src/lib/actions/user.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function updateUserProfileImage(imageUrl: string) {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  revalidatePath('/teacher/profile');
  revalidatePath(`/student/${session.user.id}`);

  return updatedUser;
}
