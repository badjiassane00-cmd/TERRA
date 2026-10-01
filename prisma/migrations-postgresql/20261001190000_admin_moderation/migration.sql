ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

CREATE TYPE "ReportTargetType" AS ENUM ('POST', 'USER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

CREATE TABLE "community_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" VARCHAR(80) NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_reports_reporterId_targetType_targetId_key" ON "community_reports"("reporterId", "targetType", "targetId");
CREATE INDEX "community_reports_status_createdAt_idx" ON "community_reports"("status", "createdAt");
CREATE INDEX "community_reports_targetType_targetId_idx" ON "community_reports"("targetType", "targetId");

ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;