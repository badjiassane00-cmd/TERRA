CREATE TYPE "ObservationLocationVisibility" AS ENUM ('PUBLIC', 'APPROXIMATE', 'PRIVATE');

ALTER TABLE "community_posts"
ADD COLUMN "observedAt" TIMESTAMP(3),
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "locationVisibility" "ObservationLocationVisibility" NOT NULL DEFAULT 'APPROXIMATE';

CREATE TABLE "community_comments" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "community_comments_postId_createdAt_idx" ON "community_comments"("postId", "createdAt");
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "community_identifications" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "taxonName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_identifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "community_identifications_postId_userId_key" ON "community_identifications"("postId", "userId");
CREATE INDEX "community_identifications_postId_createdAt_idx" ON "community_identifications"("postId", "createdAt");
ALTER TABLE "community_identifications" ADD CONSTRAINT "community_identifications_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_identifications" ADD CONSTRAINT "community_identifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
