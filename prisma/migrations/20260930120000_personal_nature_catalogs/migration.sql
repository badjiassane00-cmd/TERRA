CREATE TABLE "nature_catalogs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nature_catalogs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "catalog_entries" (
  "id" TEXT NOT NULL,
  "catalogId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scientificName" TEXT,
  "group" "OrganismGroup" NOT NULL DEFAULT 'PLANT',
  "imageUrl" TEXT,
  "note" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "nature_catalogs_userId_updatedAt_idx" ON "nature_catalogs"("userId", "updatedAt");
CREATE INDEX "catalog_entries_catalogId_position_idx" ON "catalog_entries"("catalogId", "position");
ALTER TABLE "nature_catalogs" ADD CONSTRAINT "nature_catalogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_entries" ADD CONSTRAINT "catalog_entries_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "nature_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
