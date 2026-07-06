import { prisma } from "../client.js";

export function createAuditLog(data: {
  action: string;
  actorUserId?: string | null;
  familyId?: string | null;
  targetUserId?: string | null;
  metadata?: string | null;
}) {
  return prisma.auditLog.create({ data });
}

export function listAuditLogs(familyId?: string) {
  return prisma.auditLog.findMany({
    where: familyId ? { familyId } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
