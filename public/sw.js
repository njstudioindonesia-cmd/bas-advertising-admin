const CACHE_NAME = "cetakinc-pwa-v4";
const STATIC_SHELL = [
  "/",
  "/produk",
  "/lacak",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.png",
  "/manifest.webmanifest"
];

// Whitelist: Hanya halaman publik umum yang diizinkan untuk mode offline PWA
const PUBLIC_OFFLINE_ROUTES = new Set(["/", "/produk", "/lacak"]);

// Install: Cache essential static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: Bersihkan semua cache versi terdahulu
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Hardened network & caching strategy (Zero Private Routes Leaked)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Abaikan semua request cross-origin (hanya kelola domain aplikasi sendiri)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. Khusus dokumen HTML navigasi: HANYA proses halaman yang ada di whitelist publik offline.
  // Semua halaman privat, form, dashboard, dan endpoint lain otomatis bypass langsung ke server (Direct Network).
  if (request.mode === "navigate") {
    if (!PUBLIC_OFFLINE_ROUTES.has(url.pathname)) {
      return; // Direct network request, no caching, tidak ada nama URL privat yang ditulis di kode
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallbackHome = await caches.match("/");
          if (fallbackHome) return fallbackHome;
          return new Response(
            `<!DOCTYPE html>
            <html lang="id">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Offline — Cetak.inc</title>
              <style>
                body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #F8F9FA; color: #1E1B4B; }
                .card { background: white; border-radius: 24px; padding: 32px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
                h1 { font-size: 20px; margin-bottom: 8px; }
                p { font-size: 14px; color: #64748B; margin-bottom: 24px; }
                button { background: #F97316; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <div style="font-size: 48px; margin-bottom: 16px;">📶</div>
                <h1>Anda Sedang Offline</h1>
                <p>Koneksi internet Anda terputus. Buka kembali halaman ini saat internet Anda sudah aktif kembali.</p>
                <button onclick="window.location.reload()">Coba Muat Ulang</button>
              </div>
            </body>
            </html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
    return;
  }

  // 3. Khusus Gambar, Font, Icon, dan CSS: Stale-while-revalidate
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// ==========================================
// PUSH NOTIFICATION ENGINE (ALA GOJEK / ASTRO)
// ==========================================
self.addEventListener("push", (event) => {
  let data = {
    title: "Cetak.inc Update Pesanan",
    body: "Ada pembaruan status pesanan cetak Anda.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    url: "/lacak",
    orderCode: "",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Sanitasi URL notifikasi untuk mencegah Open Redirect / Phishing
  let sanitizedUrl = data.url || (data.orderCode ? `/lacak?code=${data.orderCode}` : "/lacak");
  if (
    typeof sanitizedUrl !== "string" ||
    !sanitizedUrl.startsWith("/") ||
    sanitizedUrl.startsWith("//") ||
    sanitizedUrl.includes("://")
  ) {
    sanitizedUrl = "/lacak";
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.orderCode || "cetakinc-order-status",
    renotify: true,
    data: {
      url: sanitizedUrl,
    },
    actions: [
      { action: "track", title: "🗺️ Buka Peta Live" },
      { action: "close", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  let targetUrl = (event.notification.data && event.notification.data.url) || "/lacak";

  // Strict local path validation
  if (
    typeof targetUrl !== "string" ||
    !targetUrl.startsWith("/") ||
    targetUrl.startsWith("//") ||
    targetUrl.includes("://")
  ) {
    targetUrl = "/lacak";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/lacak") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
