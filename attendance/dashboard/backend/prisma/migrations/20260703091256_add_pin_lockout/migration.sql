-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blocagePinJusqua" TIMESTAMP(3),
ADD COLUMN     "tentativesPin" INTEGER NOT NULL DEFAULT 0;
