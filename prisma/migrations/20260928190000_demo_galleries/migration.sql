ALTER TABLE "users" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_posts" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "community_posts" ADD COLUMN "photoAttribution" TEXT;
ALTER TABLE "community_posts" ADD COLUMN "photoLicense" TEXT;
ALTER TABLE "community_posts" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_comments" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "community_posts_sourceUrl_key" ON "community_posts"("sourceUrl");
