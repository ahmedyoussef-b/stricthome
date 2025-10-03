/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Annonce` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Classe` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Classe` table. All the data in the column will be lost.
  - You are about to drop the `_SessionParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Annonce" DROP CONSTRAINT "Annonce_classeId_fkey";

-- DropForeignKey
ALTER TABLE "CoursSession" DROP CONSTRAINT "CoursSession_professeurId_fkey";

-- DropForeignKey
ALTER TABLE "_SessionParticipants" DROP CONSTRAINT "_SessionParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_SessionParticipants" DROP CONSTRAINT "_SessionParticipants_B_fkey";

-- DropIndex
DROP INDEX "Metier_nom_key";

-- AlterTable
ALTER TABLE "Annonce" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Classe" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Metier" ALTER COLUMN "icon" DROP NOT NULL,
ALTER COLUMN "theme" SET DEFAULT '{"backgroundColor":"from-gray-100 to-gray-200","textColor":"text-gray-800","primaryColor":"240 5.9% 10%","accentColor":"240 4.8% 95.9%","cursor":"cursor-default"}';

-- DropTable
DROP TABLE "_SessionParticipants";

-- CreateTable
CREATE TABLE "_SessionsParticipees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SessionsParticipees_AB_unique" ON "_SessionsParticipees"("A", "B");

-- CreateIndex
CREATE INDEX "_SessionsParticipees_B_index" ON "_SessionsParticipees"("B");

-- AddForeignKey
ALTER TABLE "CoursSession" ADD CONSTRAINT "CoursSession_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionsParticipees" ADD CONSTRAINT "_SessionsParticipees_A_fkey" FOREIGN KEY ("A") REFERENCES "CoursSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionsParticipees" ADD CONSTRAINT "_SessionsParticipees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
