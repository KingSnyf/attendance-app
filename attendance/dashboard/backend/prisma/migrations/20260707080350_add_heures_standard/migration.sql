-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "heureDebutJournee" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN     "heureFinJournee" TEXT NOT NULL DEFAULT '17:00';
