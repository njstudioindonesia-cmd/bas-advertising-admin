# BAS Advertising — Portal Manajemen & Operasional (Admin)

Proyek ini adalah portal operasional terpisah khusus untuk internal BAS Advertising (Admin, Staff, Driver, dan Vendor). 
Proyek ini **terhubung langsung ke database Supabase yang sama** dengan Web Toko Utama, sehingga seluruh perubahan produk, harga, status pesanan, dan verifikasi pembayaran otomatis tersinkronisasi secara real-time.

---

## 🚀 Fitur Portal Admin
1. **Manajemen Produk:** Tambah, edit, hapus, atur harga grosir/normal, upload foto, dan flag Best Seller.
2. **Manajemen Kategori & Banner Promosi:** Kelola kategori produk dan banner slider beranda.
3. **Manajemen Pesanan & Produksi:** Pantau seluruh order masuk, ubah status pengerjaan (Pending, Diproses, Selesai).
4. **Verifikasi Pembayaran:** Verifikasi bukti transfer bank pelanggan (Approve / Reject).
5. **Manajemen Hub Percetakan & Driver:** Atur cabang percetakan dan penugasan armada driver.
6. **Manajemen Tarif Ongkir:** Atur base fee, tarif per km, dan radius pengiriman.
7. **Portal Khusus Driver & Vendor:** Akses mandiri untuk driver dan rekanan vendor percetakan.
8. **Audit Log & Backup Database:** Log aktivitas staf dan fitur unduh backup.

---

## 🛠️ Cara Menjalankan Lokal

```bash
cd admin
npm install
npm run dev
```
Buka browser di: [http://localhost:3001](http://localhost:3001)

---

## ☁️ Panduan Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **Add New...** -> **Project**
3. Hubungkan repositori GitHub: **`bas-advertising-admin`**
4. Masukkan **Environment Variables** (Salin dari file `.env.local` Anda):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_STORE_URL`: URL Web Toko Utama Anda (contoh: `https://bas-advertising.vercel.app`)
5. Klik **Deploy**!
