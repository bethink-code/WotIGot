import { Request } from "express";
import { db } from "./db";
import { auditLogs } from "../shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

interface AuditOptions {
  action: string;
  resourceType?: string;
  resourceId?: string | number;
  outcome?: "success" | "denied" | "error";
  detail?: string;
}

/**
 * Fire-and-forget audit logger. Never throws.
 */
export function audit(req: Request, opts: AuditOptions) {
  const userId = req.user?.id ?? null;
  const userEmail = (req.user as any)?.user_name ?? null;
  const ip = req.ip || req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || null;

  db.insert(auditLogs)
    .values({
      user_id: userId,
      user_email: userEmail,
      action: opts.action,
      resource_type: opts.resourceType ?? null,
      resource_id: opts.resourceId != null ? String(opts.resourceId) : null,
      outcome: opts.outcome ?? "success",
      detail: opts.detail ?? null,
      ip_address: ip,
    })
    .catch(() => {});
}

/**
 * Log an audit event without a request (e.g. login blocking before auth).
 */
export function auditDirect(opts: AuditOptions & { userEmail?: string; ip?: string }) {
  db.insert(auditLogs)
    .values({
      user_id: null,
      user_email: opts.userEmail ?? null,
      action: opts.action,
      resource_type: opts.resourceType ?? null,
      resource_id: opts.resourceId != null ? String(opts.resourceId) : null,
      outcome: opts.outcome ?? "success",
      detail: opts.detail ?? null,
      ip_address: opts.ip ?? null,
    })
    .catch(() => {});
}

/**
 * Query audit logs with optional filters, paginated.
 */
export async function queryAuditLogs(filters: {
  action?: string;
  outcome?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.outcome) conditions.push(eq(auditLogs.outcome, filters.outcome));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.created_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(where),
  ]);

  return { rows, total: Number(countResult[0]?.count ?? 0) };
}

/**
 * Get a 24-hour activity summary for the security overview.
 */
export async function getActivitySummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [breakdown] = await Promise.all([
    db
      .select({
        action: auditLogs.action,
        outcome: auditLogs.outcome,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(gte(auditLogs.created_at, since))
      .groupBy(auditLogs.action, auditLogs.outcome),
  ]);

  return { since: since.toISOString(), breakdown };
}
