import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/moderation";
import { withApiErrors } from "@/server/http/api-handler";

async function GETImpl() {
  const admin = await requireAdmin(await getSessionUserId());
  if (!admin) return NextResponse.json({ error: "Accès réservé à l’administration." }, { status: 403 });

  const [userCount, adminCount, superAdminCount, institutionCount, reportCount, openReportCount, reportsByStatus, reportsByReason, topPost, topAccount, users, reports] = await Promise.all([
    prisma.user.count({ where: { role: "USER", isDemo: false } }),
    prisma.user.count({ where: { role: "ADMIN", isDemo: false } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN", isDemo: false } }),
    prisma.user.count({ where: { role: "INSTITUTION", isDemo: false } }),
    prisma.communityReport.count(),
    prisma.communityReport.count({ where: { status: "OPEN" } }),
    prisma.communityReport.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.communityReport.groupBy({ by: ["reason"], _count: { _all: true }, orderBy: { _count: { reason: "desc" } } }),
    prisma.communityPost.findFirst({ where: { removed: false }, orderBy: [{ likes: "desc" }, { createdAt: "desc" }], select: { id: true, plantName: true, likes: true, user: { select: { id: true, name: true } } } }),
    prisma.user.findFirst({ where: { isDemo: false }, orderBy: { followers: { _count: "desc" } }, select: { id: true, name: true, role: true, _count: { select: { followers: true } } } }),
    prisma.user.findMany({ where: { isDemo: false }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    prisma.communityReport.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { reporter: { select: { id: true, name: true, email: true } } } }),
  ]);

  const postIds = reports.filter((report) => report.targetType === "POST").map((report) => report.targetId);
  const userIds = reports.filter((report) => report.targetType === "USER").map((report) => report.targetId);
  const [reportedPosts, reportedUsers] = await Promise.all([
    postIds.length ? prisma.communityPost.findMany({ where: { id: { in: postIds } }, select: { id: true, plantName: true, removed: true, user: { select: { name: true } } } }) : [],
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, role: true } }) : [],
  ]);
  const postById = new Map(reportedPosts.map((post) => [post.id, post]));
  const userById = new Map(reportedUsers.map((user) => [user.id, user]));

  return NextResponse.json({
    stats: { userCount, adminCount, superAdminCount, institutionCount, reportCount, openReportCount, reportsByStatus, reportsByReason, topPost, topAccount },
    adminRole: admin.role,
    adminId: admin.id,
    users,
    reports: reports.map((report) => ({
      ...report,
      target: report.targetType === "POST" ? postById.get(report.targetId) ?? null : userById.get(report.targetId) ?? null,
    })),
  });
}

export const GET = withApiErrors(GETImpl);