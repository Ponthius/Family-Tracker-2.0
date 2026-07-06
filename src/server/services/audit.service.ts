import { createAuditLog, listAuditLogs } from "../database/queries/audit.queries.js";

export async function logAction(data: {
  action: string;
  actorUserId?: string | null;
  familyId?: string | null;
  targetUserId?: string | null;
  metadata?: unknown;
}) {
  return createAuditLog({
    action: data.action,
    actorUserId: data.actorUserId ?? null,
    familyId: data.familyId ?? null,
    targetUserId: data.targetUserId ?? null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
}

export async function getAuditTrail(familyId?: string) {
  return listAuditLogs(familyId);
}
