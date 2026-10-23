import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AuditLogInput {
  actor: string;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: any;
}

export function logAudit(
  actorOrInput: string | AuditLogInput,
  action?: string,
  entity?: string,
  entityId?: string | null,
  diff?: any
): void {
  // Jalankan asinkron tanpa memblokir respon
  (async () => {
    try {
      let act: string;
      let actn: string;
      let ent: string;
      let eid: string | null = null;
      let df: any = null;

      if (typeof actorOrInput === "object" && actorOrInput !== null) {
        act = actorOrInput.actor;
        actn = actorOrInput.action;
        ent = actorOrInput.entity;
        eid = actorOrInput.entityId || null;
        df = actorOrInput.diff || null;
      } else {
        act = actorOrInput;
        actn = action || "UNKNOWN";
        ent = entity || "system";
        eid = entityId || null;
        df = diff || null;
      }

      await supabaseAdmin.from("audit_logs").insert({
        actor: act,
        action: actn,
        entity: ent,
        entity_id: eid,
        diff: df || null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Abaikan error logging audit agar alur utama tidak gagal
    }
  })();
}

export async function getAuditLogs(limit = 50): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
