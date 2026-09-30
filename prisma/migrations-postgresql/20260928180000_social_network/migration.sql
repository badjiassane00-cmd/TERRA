ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
CREATE TABLE "community_post_likes" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_post_likes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "user_follows" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "community_post_likes_postId_userId_key" ON "community_post_likes"("postId", "userId");
CREATE INDEX "community_post_likes_userId_createdAt_idx" ON "community_post_likes"("userId", "createdAt");
CREATE UNIQUE INDEX "user_follows_followerId_followedId_key" ON "user_follows"("followerId", "followedId");
CREATE INDEX "user_follows_followedId_createdAt_idx" ON "user_follows"("followedId", "createdAt");
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
