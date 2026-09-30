-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('DRAFT', 'TRAINING', 'READY', 'DEPLOYED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('TRAINING_IMAGE', 'LABEL_CORRECTION', 'PLANT_SIGHTING', 'DISEASE_REPORT');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('WATERING', 'SUNLIGHT', 'FERTILIZING', 'PRUNING');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'INSTITUTION', 'ADMIN');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('JARDIN_BOTANIQUE', 'PARC_NATIONAL', 'RESERVE', 'JARDIN_UNIVERSITAIRE', 'COMMERCE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "commonNames" TEXT NOT NULL DEFAULT '[]',
    "kingdom" TEXT,
    "phylum" TEXT,
    "taxClass" TEXT,
    "order" TEXT,
    "family" TEXT,
    "genus" TEXT,
    "species" TEXT,
    "description" TEXT,
    "taxonomy" TEXT,
    "medicinal" BOOLEAN,
    "edibleParts" TEXT NOT NULL DEFAULT '[]',
    "toxicity" TEXT NOT NULL DEFAULT '[]',
    "watering" TEXT,
    "sunlight" TEXT,
    "soil" TEXT,
    "growthRate" TEXT,
    "sowingMonths" TEXT NOT NULL DEFAULT '[]',
    "bloomingMonths" TEXT NOT NULL DEFAULT '[]',
    "harvestMonths" TEXT NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "gbifId" TEXT,
    "iNaturalistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diseases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "treatment" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_diseases" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "region" TEXT NOT NULL,
    "speciesCount" INTEGER NOT NULL DEFAULT 0,
    "type" "LocationType" NOT NULL,
    "description" TEXT,
    "bloomingMonths" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_plants" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" TEXT,
    "imageUrl" TEXT,
    "result" JSONB,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "courseName" TEXT,
    "objective" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseName" TEXT,
    "supervisorId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "description" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "badges" TEXT NOT NULL DEFAULT '[]',
    "streak" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamification_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "plantName" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "nextReminder" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "plantName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "usedForTraining" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accuracy" DOUBLE PRECISION,
    "loss" DOUBLE PRECISION,
    "trainingDataCount" INTEGER NOT NULL,
    "status" "ModelStatus" NOT NULL DEFAULT 'DRAFT',
    "modelUrl" TEXT,
    "deployed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_names" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contributedBy" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "local_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_contributions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ContributionType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibitions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "theme" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exhibitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibition_items" (
    "id" TEXT NOT NULL,
    "exhibitionId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "note" TEXT,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exhibition_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "plants_scientificName_key" ON "plants"("scientificName");

-- CreateIndex
CREATE UNIQUE INDEX "diseases_name_key" ON "diseases"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plant_diseases_plantId_diseaseId_key" ON "plant_diseases"("plantId", "diseaseId");

-- CreateIndex
CREATE UNIQUE INDEX "location_plants_locationId_plantId_key" ON "location_plants"("locationId", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "field_sessions_code_key" ON "field_sessions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_plantId_key" ON "favorites"("userId", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_locationId_key" ON "favorites"("userId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_profiles_userId_key" ON "gamification_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "model_versions_version_key" ON "model_versions"("version");

-- CreateIndex
CREATE UNIQUE INDEX "local_names_plantId_language_name_key" ON "local_names"("plantId", "language", "name");

-- CreateIndex
CREATE UNIQUE INDEX "exhibition_items_exhibitionId_plantId_key" ON "exhibition_items"("exhibitionId", "plantId");

-- AddForeignKey
ALTER TABLE "plant_diseases" ADD CONSTRAINT "plant_diseases_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_diseases" ADD CONSTRAINT "plant_diseases_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "diseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_plants" ADD CONSTRAINT "location_plants_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_plants" ADD CONSTRAINT "location_plants_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_history" ADD CONSTRAINT "scan_history_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "field_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_history" ADD CONSTRAINT "scan_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_history" ADD CONSTRAINT "scan_history_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_sessions" ADD CONSTRAINT "field_sessions_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_names" ADD CONSTRAINT "local_names_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibitions" ADD CONSTRAINT "exhibitions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibition_items" ADD CONSTRAINT "exhibition_items_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "exhibitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibition_items" ADD CONSTRAINT "exhibition_items_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
