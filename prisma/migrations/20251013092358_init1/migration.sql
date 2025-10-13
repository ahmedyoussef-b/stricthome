-- DropForeignKey
ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_professeurId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_classroomId_fkey";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
