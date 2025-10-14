// src/app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { studentSchema } from '@/lib/formValidationSchemas'; // Assuming you might want to reuse parts of it
import { Prisma } from '@prisma/client';

// GET a single student by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        class: true,
        grade: true,
        parent: true,
      },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json(student, { status: 200 });
  } catch (error) {
    console.error(`Error fetching student ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching student', error: (error as Error).message }, { status: 500 });
  }
}

// PUT (update) a student by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await request.json();

    const {
      username,
      email,
      // password is removed
      name,
      surname,
      phone,
      address,
      img,
      bloodType,
      birthday,
      sex,
      gradeId,
      classId,
      parentId,
    } = body;

    // Prepare data for User and Student models
    const userData: Prisma.UserUpdateInput = {};
    if (username) userData.username = username;
    if (email) userData.email = email;
    if (img !== undefined) userData.img = img; // User model also has img

    const studentData: Prisma.StudentUpdateInput = {};
    if (name) studentData.name = name;
    if (surname) studentData.surname = surname;
    if (phone) studentData.phone = phone;
    if (address) studentData.address = address;
    if (img !== undefined) studentData.img = img; // Student model has img
    if (bloodType) studentData.bloodType = bloodType;
    if (birthday) studentData.birthday = new Date(birthday);
    if (sex) studentData.sex = sex;
    
    // Update relationships using 'connect'
    if (gradeId) {
      studentData.grade = {
        connect: { id: gradeId },
      };
    }
    if (classId) {
      studentData.class = {
        connect: { id: classId },
      };
    }
    if (parentId) {
      studentData.parent = {
        connect: { id: parentId },
      };
    }

    // Use a transaction to update User and Student atomically
    const updatedStudent = await prisma.$transaction(async (tx) => {
      const studentToUpdate = await tx.student.findUnique({ where: { id } });
      if (!studentToUpdate) {
        throw new Error('Student not found for update');
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: studentToUpdate.userId },
          data: userData,
        });
      }

      const result = await tx.student.update({
        where: { id },
        data: studentData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            }
          }
        }
      });
      return result;
    });

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    console.error(`Error updating student ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Student or related user not found for update' }, { status: 404 });
      }
    }
    return NextResponse.json({ message: 'Error updating student', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE a student by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Use a transaction to delete the student and their associated user record
    // This assumes a 1-to-1 required relationship where student.userId is the foreign key to User
    // If the User can exist without a student, only delete the student.
    // For this example, let's assume the user record should also be cleaned up if it's tightly coupled.
    await prisma.$transaction(async (tx) => {
      await tx.student.delete({
        where: { id },
      });
      // Optionally, delete the user if they have no other roles or are only a student
      // This logic can be complex, for now, let's assume the user might have other roles or this is handled elsewhere.
      // If you want to delete the user:
      // await tx.user.delete({ where: { id: student.userId }});
    });

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting student ${id}:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2014: The change you are trying to make would violate the required relation '{relation_name}' between the '{model_a_name}' and '{model_b_name}' models.
      // This might happen if other records depend on this student.
      if (error.code === 'P2014' || error.code === 'P2003') { // P2003 is foreign key constraint failed on delete
        return NextResponse.json({ message: 'Cannot delete student. Other records depend on it.', code: error.code }, { status: 409 });
      }
    }
    return NextResponse.json({ message: 'Error deleting student', error: (error as Error).message }, { status: 500 });
  }
}
