/*
  Warnings:

  - You are about to drop the `AbsenceRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AbsenceRequest" DROP CONSTRAINT "AbsenceRequest_userId_fkey";

-- DropTable
DROP TABLE "AbsenceRequest";

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'absence',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "motif" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "traiteePar" TEXT,
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateTraitement" TIMESTAMP(3),
    "commentaire" TEXT,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
