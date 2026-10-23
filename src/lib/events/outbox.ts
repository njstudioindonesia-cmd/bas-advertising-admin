import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppEvent, EventHandler, EventType } from "./types";

// In-memory registry for event listeners in the current process
const listeners = new Map<EventType, Set<EventHandler>>();

export function subscribeEvent<T = any>(type: EventType, handler: EventHandler<T>): () => void {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  const set = listeners.get(type)!;
  set.add(handler as EventHandler);

  return () => {
    set.delete(handler as EventHandler);
  };
}

/**
 * Menerbitkan event ke DB outbox (tabel `events`) dan langsung
 * menyiarkan ke in-memory listeners secara asinkron tanpa memblokir request utama.
 */
export async function publishEvent<T extends Record<string, any>>(
  type: EventType,
  payload: T
): Promise<{ success: boolean; eventId?: number | string; error?: string }> {
  const now = new Date().toISOString();
  let dbEventId: number | string | undefined;

  try {
    // 1. Tulis ke tabel events di Supabase (Outbox Pattern)
    const { data, error } = await supabaseAdmin
      .from("events")
      .insert({
        type,
        payload,
        status: "PENDING",
        attempts: 0,
        created_at: now,
      })
      .select("id")
      .maybeSingle();

    if (!error && data) {
      dbEventId = data.id;
    }
  } catch (err: any) {
    // Graceful fallback: jangan crash jika tabel belum dibuat atau koneksi offline
    console.warn(`[EVENT OUTBOX] Gagal menulis ke DB events (${type}):`, err?.message || err);
  }

  // 2. Dispatch asinkron ke in-process listeners
  const appEvent: AppEvent<T> = {
    id: dbEventId || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    status: "PROCESSING",
    attempts: 1,
    createdAt: now,
  };

  const handlers = listeners.get(type);
  if (handlers && handlers.size > 0) {
    // Jalankan secara background (setImmediate / Promise)
    Promise.resolve().then(async () => {
      for (const handler of Array.from(handlers)) {
        try {
          await handler(appEvent);
        } catch (handlerErr) {
          console.error(`[EVENT HANDLER ERROR] [${type}]:`, handlerErr);
        }
      }
    });
  }

  return { success: true, eventId: appEvent.id };
}
