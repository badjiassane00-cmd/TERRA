ALTER TABLE "community_posts" ADD COLUMN "clientSubmissionId" TEXT;
CREATE UNIQUE INDEX "community_posts_clientSubmissionId_key" ON "community_posts"("clientSubmissionId");
