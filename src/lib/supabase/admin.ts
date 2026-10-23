import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-offline.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-service-key";

/**
 * Circuit Breaker State
 * Mencegah proses / API route menggantung puluhan detik saat koneksi Supabase offline/unreachable
 */
let isCircuitOpen = false;
let circuitOpenedAt = 0;
const CIRCUIT_RESET_MS = 30000; // 30 detik

/**
 * Custom Fetch dengan timeout 600ms dan Circuit Breaker otomatis.
 * PENTING: Jika Supabase offline atau timeout, fungsi ini mengembalikan Response HTTP 400
 * alih-alih melempar error / TypeError. Hal ini mencegah library @supabase/postgrest-js
 * melakukan retry backoff otomatis yang dapat membekukan thread selama 7+ detik!
 */
const fetchWithCircuitBreaker = async (url: any, options: any = {}) => {
  const now = Date.now();
  if (isCircuitOpen) {
    if (now - circuitOpenedAt > CIRCUIT_RESET_MS) {
      isCircuitOpen = false; // Coba kembali (half-open probe)
    } else {
      // Kembalikan Response HTTP 400 instan (0ms) agar Postgrest langsung terminate tanpa retry
      return new Response(
        JSON.stringify({
          message: "Supabase Circuit Breaker OPEN (remote host unreachable)",
          code: "PGRST_OFFLINE",
          details: "Circuit breaker is active to prevent blocking",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // PENTING: Untuk kunci modern Supabase (sb_secret_ / sb_publishable_),
  // PostgREST menolak Authorization: Bearer <sb_...> dengan error 'Expected 3 parts in JWT'.
  // Hapus Authorization Bearer non-JWT agar PostgREST menggunakan header apikey langsung.
  const headers = new Headers(options.headers || {});
  const auth = headers.get("authorization");
  if (auth && (auth.includes("Bearer sb_secret_") || auth.includes("Bearer sb_publishable_"))) {
    headers.delete("authorization");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    if (res.status < 500) {
      isCircuitOpen = false;
    }
    return res;
  } catch (err: any) {
    isCircuitOpen = true;
    circuitOpenedAt = Date.now();
    return new Response(
      JSON.stringify({
        message: "Supabase connection failed / timed out",
        code: "PGRST_OFFLINE",
        details: err?.message || "Host unreachable",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Supabase Admin Client dengan Service Role Key & Circuit Breaker.
 * Digunakan secara eksklusif di server-side (Next.js Route Handlers / Server Actions)
 * untuk melakukan operasi CRUD penuh dan bypass Row Level Security (RLS).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetchWithCircuitBreaker,
  },
});
