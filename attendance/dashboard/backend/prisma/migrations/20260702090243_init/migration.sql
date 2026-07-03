-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "codePinHash" TEXT,
    "methodeAuth" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "statutActuel" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifiantAppareil" TEXT NOT NULL,
    "modele" TEXT,
    "dateAssociation" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPresence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "heureArrivee" TIMESTAMP(3) NOT NULL,
    "heureDepart" TIMESTAMP(3),
    "typeArrivee" TEXT NOT NULL,
    "methodeValidation" TEXT NOT NULL,
    "appareilId" TEXT,
    "retardMinutes" INTEGER,
    "valide" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SessionPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "dateDetection" TIMESTAMP(3) NOT NULL,
    "traitee" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestModification" (
    "id" TEXT NOT NULL,
    "gestionnaireId" TEXT NOT NULL,
    "sessionPresenceId" TEXT NOT NULL,
    "modificationProposee" TEXT NOT NULL,
    "raison" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "adminId" TEXT,
    "dateDemande" TIMESTAMP(3) NOT NULL,
    "dateTraitement" TIMESTAMP(3),

    CONSTRAINT "RequestModification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAction" (
    "id" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "cibleId" TEXT NOT NULL,
    "details" TEXT,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "reseauBssid" TEXT,
    "plageIpLocale" TEXT,
    "toleranceRetardMinutes" INTEGER,
    "dureePauseMaxMinutes" INTEGER,
    "joursFeries" TEXT,
    "joursOuvres" TEXT,
    "politiqueConfidentialite" TEXT,
    "geolocalisationSecoursActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPresence" ADD CONSTRAINT "SessionPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
