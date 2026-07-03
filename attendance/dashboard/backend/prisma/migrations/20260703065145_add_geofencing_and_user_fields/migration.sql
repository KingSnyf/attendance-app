-- AlterTable
ALTER TABLE "Anomaly" ADD COLUMN     "commentaire" TEXT,
ADD COLUMN     "geolocVerifiee" BOOLEAN;

-- AlterTable
ALTER TABLE "SessionPresence" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "geofencingActif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitudeBureau" DOUBLE PRECISION,
ADD COLUMN     "longitudeBureau" DOUBLE PRECISION,
ADD COLUMN     "rayonGeofencingMetres" INTEGER DEFAULT 120;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "departement" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ALTER COLUMN "methodeAuth" SET DEFAULT 'pin',
ALTER COLUMN "role" SET DEFAULT 'employe',
ALTER COLUMN "statutActuel" SET DEFAULT 'absent';
