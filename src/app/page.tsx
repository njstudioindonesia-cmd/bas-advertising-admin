"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Package, 
  TrendingUp, 
  Layers, 
  Check, 
  X, 
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
  ShoppingCart,
  Image as ImageIcon,
  Briefcase,
  Settings,
  Database,
  History,
  LogOut,
  Upload,
  Copy,
  Download,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  KeyRound,
  Bike,
  MapPin,
  Navigation,
  Sparkles,
  Building2,
  Truck,
  FileText
} from "lucide-react";

export default function UrangDalamAdminPortal() {
  // 1. Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "categories" | "banners" | "portfolio" | "settings" | "orders" | "hubs" | "tariffs" | "payments" | "backup" | "account"
  >("products");

  // Hubs Management (Fase 2 Blueprint V2)
  const [hubsList, setHubsList] = useState<any[]>([]);
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [hubModalMode, setHubModalMode] = useState<"add" | "edit">("add");
  const [editingHubId, setEditingHubId] = useState<string | null>(null);
  const [hubForm, setHubForm] = useState({
    name: "",
    slug: "",
    address: "",
    lat: -0.9025,
    lng: 100.3542,
    phone: "082283995544",
    whatsapp: "6282283995544",
    maxRadiusKm: 15,
    dailyCapacity: 50,
    isActive: true,
    isOpen: true,
    notes: "",
  });

  // Shipping Tariffs Management (Fase 3 Blueprint V2)
  const [tariffsList, setTariffsList] = useState<any[]>([]);
  const [editingTariffHubId, setEditingTariffHubId] = useState<string | null>(null);
  const [tariffForm, setTariffForm] = useState({
    baseFee: 8000,
    perKm: 2500,
    minFee: 8000,
    maxKm: 25,
    freeOver: 300000,
    isActive: true,
  });
  const [savingTariff, setSavingTariff] = useState(false);
  const [simKm, setSimKm] = useState(4.5);
  const [simSubtotal, setSimSubtotal] = useState(150000);

  // Payments Verification Management (Fase 4 Blueprint V2)
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Product filters
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("Semua");
  const [productStatusFilter, setProductStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [deleteConfirmProd, setDeleteConfirmProd] = useState<any | null>(null);

  // Helper untuk broadcast update katalog ke seluruh tab/halaman
  const notifyProductCatalogUpdated = () => {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bas_products_updated"));
        localStorage.setItem("bas_catalog_version", Date.now().toString());
        try {
          const bc = new BroadcastChannel("bas_catalog_sync");
          bc.postMessage({ type: "catalog_updated", timestamp: Date.now() });
          bc.close();
        } catch {
          // ignore
        }
      }
    } catch {
      // Abaikan jika di konteks terbatas
    }
  };

  // Product modal
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodModalMode, setProdModalMode] = useState<"add" | "edit">("add");
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    categoryId: "",
    price: 0,
    compareAtPrice: "",
    unit: "/ pcs",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
    description: "",
    isBestSeller: false,
    isActive: true,
    specsText: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<"add" | "edit">("add");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    icon: "Package",
    sortOrder: 0,
    isActive: true,
  });

  // Banner modal
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerModalMode, setBannerModalMode] = useState<"add" | "edit">("add");
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?q=80&w=1600&auto=format&fit=crop",
    ctaLabel: "Pesan Sekarang",
    ctaHref: "/produk",
    sortOrder: 1,
    isActive: true,
  });
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Portfolio modal
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioModalMode, setPortfolioModalMode] = useState<"add" | "edit">("add");
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    client: "",
    category: "Packaging",
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800",
    description: "",
    sortOrder: 1,
    isActive: true,
  });
  const [uploadingPortfolioImage, setUploadingPortfolioImage] = useState(false);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);

  // Order modal / detail
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("Semua");

  // Courier Dispatcher Modal (Live Map Sync)
  const [dispatchModalOrder, setDispatchModalOrder] = useState<any | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    name: "Budi Santoso",
    phone: "082283995544",
    plate: "Honda Vario (BA 4821 QA)",
    eta: "20 Menit",
    notes: "Kurir Toko Cetak.inc sedang meluncur membawa pesanan Anda",
  });
  const [dispatchingLoading, setDispatchingLoading] = useState(false);

  // Account modal
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // Reset confirmation
  const [resetConfirmInput, setResetConfirmInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Storage Stats
  const [storageStats, setStorageStats] = useState<any | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [cleaningStorage, setCleaningStorage] = useState(false);

  // Show Toast Helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    // Fallback token check jika ada legacy token
    const token = typeof window !== "undefined" ? localStorage.getItem("bas_admin_token") : null;
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
    if (res.status === 401 && url.includes("/api/auth/me")) {
      showToast("Sesi login telah berakhir. Silakan login kembali.", "error");
      if (typeof window !== "undefined") {
        localStorage.removeItem("bas_admin_token");
      }
      setIsAuthenticated(false);
    }
    return res;
  };

  // 1. Initial Session Check
  useEffect(() => {
    adminFetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthChecking(false));
  }, []);

  // 2. Fetch Data when Authenticated
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const safeFetch = async (url: string, fallback: any = { success: false, data: [] }) => {
        try {
          const res = await adminFetch(url, { cache: "no-store" });
          if (!res.ok) return fallback;
          return await res.json();
        } catch {
          return fallback;
        }
      };

      const [pRes, cRes, bRes, sRes, oRes, hRes, tarRes, payRes, portRes] = await Promise.all([
        safeFetch("/api/products?includeInactive=true"),
        safeFetch("/api/categories?includeInactive=true"),
        safeFetch("/api/banners?includeInactive=true"),
        safeFetch("/api/settings", { success: false, data: {} }),
        safeFetch("/api/orders"),
        safeFetch("/api/admin/hubs"),
        safeFetch("/api/admin/tariffs"),
        safeFetch("/api/admin/payments"),
        safeFetch("/api/portfolio?includeInactive=true"),
      ]);

      if (pRes.success) setProducts(pRes.data);
      if (cRes.success) {
        setCategories(cRes.data);
        if (!prodForm.categoryId && cRes.data.length > 0) {
          setProdForm((prev) => ({ ...prev, categoryId: cRes.data[0].id }));
        }
      }
      if (bRes.success) setBanners(bRes.data);
      if (portRes && portRes.success) setPortfolio(portRes.data);
      if (sRes.success) setSettings(sRes.data);
      if (oRes.success) setOrders(oRes.data);
      if (hRes && hRes.success) setHubsList(hRes.data);
      if (tarRes && tarRes.success) setTariffsList(tarRes.data);
      if (payRes && payRes.success) setPaymentsList(payRes.data);
    } catch (err: any) {
      showToast("Gagal memuat beberapa data dari server", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddHubModal = () => {
    setHubModalMode("add");
    setEditingHubId(null);
    setHubForm({
      name: "",
      slug: "",
      address: "",
      lat: -0.9025,
      lng: 100.3542,
      phone: "082283995544",
      whatsapp: "6282283995544",
      maxRadiusKm: 15,
      dailyCapacity: 50,
      isActive: true,
      isOpen: true,
      notes: "",
    });
    setIsHubModalOpen(true);
  };

  const openEditHubModal = (hub: any) => {
    setHubModalMode("edit");
    setEditingHubId(hub.id);
    setHubForm({
      name: hub.name,
      slug: hub.slug,
      address: hub.address || "",
      lat: hub.lat,
      lng: hub.lng,
      phone: hub.phone || "082283995544",
      whatsapp: hub.whatsapp || "6282283995544",
      maxRadiusKm: hub.maxRadiusKm || 15,
      dailyCapacity: hub.dailyCapacity || 50,
      isActive: hub.isActive ?? true,
      isOpen: hub.isOpen ?? true,
      notes: hub.notes || "",
    });
    setIsHubModalOpen(true);
  };

  const handleHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubForm.name.trim() || !hubForm.address.trim()) {
      showToast("Nama hub dan alamat workshop wajib diisi", "error");
      return;
    }

    try {
      const url = hubModalMode === "add" ? "/api/admin/hubs" : `/api/admin/hubs/${editingHubId}`;
      const method = hubModalMode === "add" ? "POST" : "PUT";
      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hubForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          hubModalMode === "add" ? "Workshop Hub berhasil ditambahkan!" : "Data Hub berhasil diperbarui!",
          "success"
        );
        setIsHubModalOpen(false);
        refreshAllData();
      } else {
        showToast(data.error || "Gagal menyimpan data hub", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const handleToggleHubOpen = async (hub: any) => {
    try {
      const res = await adminFetch(`/api/admin/hubs/${hub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !hub.isOpen }),
      });
      if (res.ok) {
        showToast(`Status ${hub.name} diubah menjadi ${!hub.isOpen ? "BUKA" : "TUTUP"}`, "success");
        refreshAllData();
      }
    } catch {
      showToast("Gagal mengubah status hub", "error");
    }
  };

  const handleAssignHubToOrder = async (orderId: string, hubId: string) => {
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/assign-hub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Hub pesanan berhasil diperbarui!", "success");
        refreshAllData();
      } else {
        showToast(data.error || "Gagal mengubah alokasi hub", "error");
      }
    } catch {
      showToast("Gagal menghubungi server", "error");
    }
  };

  // Tariff Actions (Fase 3 Blueprint V2)
  const handleStartEditTariff = (hubId: string, currentTariff?: any) => {
    setEditingTariffHubId(hubId);
    if (currentTariff) {
      setTariffForm({
        baseFee: currentTariff.baseFee ?? 8000,
        perKm: currentTariff.perKm ?? 2500,
        minFee: currentTariff.minFee ?? 8000,
        maxKm: currentTariff.maxKm ?? 25,
        freeOver: currentTariff.freeOver ?? 300000,
        isActive: currentTariff.isActive ?? true,
      });
    } else {
      setTariffForm({
        baseFee: 8000,
        perKm: 2500,
        minFee: 8000,
        maxKm: 25,
        freeOver: 300000,
        isActive: true,
      });
    }
  };

  const handleSaveTariff = async (hubId: string) => {
    setSavingTariff(true);
    try {
      const res = await adminFetch("/api/admin/tariffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubId,
          baseFee: Number(tariffForm.baseFee),
          perKm: Number(tariffForm.perKm),
          minFee: Number(tariffForm.minFee),
          maxKm: Number(tariffForm.maxKm),
          freeOver: tariffForm.freeOver ? Number(tariffForm.freeOver) : null,
          isActive: Boolean(tariffForm.isActive),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pengaturan tarif ongkir workshop berhasil disimpan!", "success");
        setEditingTariffHubId(null);
        refreshAllData();
      } else {
        showToast(data.error || "Gagal menyimpan tarif", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan saat menyimpan tarif", "error");
    } finally {
      setSavingTariff(false);
    }
  };

  // Payments Verification Actions (Fase 4 Blueprint V2)
  const handleVerifyPayment = async (payment: any) => {
    if (!confirm(`Konfirmasi verifikasi LUNAS untuk pesanan ${payment.orderCode || payment.orderId} (Rp ${payment.amount?.toLocaleString("id-ID")})?`)) {
      return;
    }
    setVerifyingPaymentId(payment.id);
    try {
      const res = await adminFetch(`/api/admin/payments/${payment.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: payment.orderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pembayaran diverifikasi LUNAS! Invoice & status pesanan diperbarui.", "success");
        refreshAllData();
      } else {
        showToast(data.error || "Gagal memverifikasi pembayaran", "error");
      }
    } catch {
      showToast("Gagal menghubungi server verifikasi pembayaran", "error");
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectingPayment) return;
    try {
      const res = await adminFetch(`/api/admin/payments/${rejectingPayment.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: rejectingPayment.orderId,
          reason: rejectReasonInput || "Bukti transfer tidak sesuai atau buram.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Bukti pembayaran ditolak. Status pesanan diperbarui.", "success");
        setRejectingPayment(null);
        setRejectReasonInput("");
        refreshAllData();
      } else {
        showToast(data.error || "Gagal menolak pembayaran", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan saat menolak pembayaran", "error");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();

      if (data.success) {
        if (typeof window !== "undefined" && data.token) {
          localStorage.setItem("bas_admin_token", data.token); // Simpan fallback token untuk Authorization Bearer
        }
        setIsAuthenticated(true);
        showToast("Selamat datang di Urang Dalam BAS ADV", "success");
      } else {
        setLoginError(data.error || "Login gagal");
      }
    } catch {
      setLoginError("Terjadi kesalahan koneksi server");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await adminFetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("bas_admin_token");
    }
    setIsAuthenticated(false);
    showToast("Anda telah keluar dari panel Urang Dalam", "success");
  };

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "products");

    try {
      const res = await adminFetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setProdForm((prev) => ({ ...prev, imageUrl: data.url }));
        showToast(
          data.savingsPercent
            ? `Foto produk dioptimasi & diunggah (Hemat ${data.savingsPercent}%)`
            : "Foto produk berhasil diunggah",
          "success"
        );
      } else {
        showToast(data.error || "Gagal upload gambar", "error");
      }
    } catch {
      showToast("Gagal upload gambar ke server", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // ==========================================
  // PRODUCT ACTIONS
  // ==========================================
  const openAddProductModal = () => {
    setProdModalMode("add");
    setEditingProdId(null);
    setProdForm({
      name: "",
      categoryId: categories[0]?.id || "cat-outlet",
      price: 25000,
      compareAtPrice: "",
      unit: "/ pcs",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
      description: "",
      isBestSeller: false,
      isActive: true,
      specsText: "Bahan Berkualitas Tinggi\nCetak Presisi & Anti Pudar\nGaransi Hasil Maksimal",
    });
    setIsProdModalOpen(true);
  };

  const openEditProductModal = (p: any) => {
    setProdModalMode("edit");
    setEditingProdId(p.id);

    const matchedCat = categories.find(
      (c) => c.id === p.categoryId || c.name === p.category || c.slug === p.category
    );
    const catId = matchedCat ? matchedCat.id : (categories[0]?.id || "cat-outlet");

    let priceVal = p.priceNumber;
    if (priceVal === undefined || priceVal === null) {
      priceVal = typeof p.price === "number" ? p.price : parseInt(String(p.price || "").replace(/[^0-9]/g, ""), 10) || 0;
    }

    let compareVal = p.compareAtPrice;
    if (compareVal === undefined || compareVal === null) {
      compareVal = p.normalPrice ? parseInt(String(p.normalPrice).replace(/[^0-9]/g, ""), 10) : "";
    }

    setProdForm({
      name: p.name || p.title || "",
      categoryId: catId,
      price: priceVal || 0,
      compareAtPrice: compareVal ? String(compareVal) : "",
      unit: p.unit || "/ pcs",
      imageUrl: p.imageUrl || p.img || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
      description: p.description || p.desc || "",
      isBestSeller: Boolean(p.isBestSeller),
      isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
      specsText: Array.isArray(p.specs) ? p.specs.join("\n") : (p.specs || ""),
    });
    setIsProdModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.categoryId || prodForm.price <= 0) {
      showToast("Nama, kategori, dan harga produk wajib diisi dengan benar", "error");
      return;
    }

    const payload = {
      name: prodForm.name.trim(),
      categoryId: prodForm.categoryId,
      price: Number(prodForm.price),
      compareAtPrice: prodForm.compareAtPrice ? Number(prodForm.compareAtPrice) : null,
      unit: prodForm.unit.trim() || "/ pcs",
      imageUrl: prodForm.imageUrl.trim() || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
      description: prodForm.description.trim(),
      isBestSeller: Boolean(prodForm.isBestSeller),
      isActive: Boolean(prodForm.isActive),
      specs: prodForm.specsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (prodModalMode === "add") {
        const res = await adminFetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Produk baru berhasil ditambahkan", "success");
          setIsProdModalOpen(false);
          if (data.data) {
            setProducts((prev) => [data.data, ...prev]);
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal menambah produk", "error");
        }
      } else {
        const res = await adminFetch(`/api/products/${editingProdId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Produk berhasil diperbarui", "success");
          setIsProdModalOpen(false);
          if (data.data) {
            setProducts((prev) => prev.map((p) => p.id === editingProdId ? data.data : p));
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal mengupdate produk", "error");
        }
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan produk", "error");
    }
  };

  const handleToggleProductStatus = async (p: any) => {
    const newStatus = !p.isActive;
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, isActive: newStatus } : item))
    );
    try {
      const res = await adminFetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Produk '${p.name || p.title}' ${newStatus ? "diaktifkan" : "dinonaktifkan"}`, "success");
        notifyProductCatalogUpdated();
        refreshAllData();
      } else {
        showToast(data.error || "Gagal mengubah status produk", "error");
        refreshAllData();
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
      refreshAllData();
    }
  };

  const handleExecuteDelete = async (id: string, name: string, permanent: boolean) => {
    // Optimistic UI update
    if (permanent) {
      setProducts((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
    } else {
      setProducts((prev) => prev.map((p) => (p.id === id || p.slug === id) ? { ...p, isActive: false } : p));
    }
    setDeleteConfirmProd(null);

    try {
      const res = await adminFetch(`/api/products/${id}${permanent ? "?permanent=true" : ""}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          permanent
            ? `Produk '${name}' berhasil dihapus permanen dari database`
            : `Produk '${name}' berhasil dinonaktifkan dari katalog publik`,
          "success"
        );
        notifyProductCatalogUpdated();
        refreshAllData();
      } else {
        showToast(data.error || "Gagal menghapus produk", "error");
        refreshAllData();
      }
    } catch {
      showToast("Gagal menghapus produk", "error");
      refreshAllData();
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    const target = products.find((p) => p.id === id || p.slug === id);
    if (target) {
      setDeleteConfirmProd(target);
    } else {
      setDeleteConfirmProd({ id, name, title: name });
    }
  };

  const handleDuplicateProduct = async (p: any) => {
    if (!confirm(`Duplikasi produk '${p.name || p.title}'?`)) return;
    const payload = {
      name: `${p.name || p.title} (Salinan)`,
      categoryId: p.categoryId,
      price: p.priceNumber || 0,
      compareAtPrice: p.compareAtPrice,
      unit: p.unit || "/ pcs",
      imageUrl: p.imageUrl || p.img,
      description: p.description || p.desc || "",
      isBestSeller: false,
      isActive: true,
      specs: p.specs || [],
    };
    try {
      const res = await adminFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Produk berhasil diduplikasi", "success");
        refreshAllData();
      }
    } catch {
      showToast("Gagal menduplikasi produk", "error");
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`Jalankan aksi ${action} pada ${selectedProductIds.length} produk terpilih?`)) return;

    try {
      const res = await adminFetch("/api/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: selectedProductIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setSelectedProductIds([]);
        refreshAllData();
      } else {
        showToast(data.error, "error");
      }
    } catch {
      showToast("Gagal memproses aksi massal", "error");
    }
  };

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const openAddCategoryModal = () => {
    setCatModalMode("add");
    setEditingCatId(null);
    setCatForm({
      name: "",
      slug: "",
      icon: "Package",
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (c: any) => {
    setCatModalMode("edit");
    setEditingCatId(c.id);
    setCatForm({
      name: c.name,
      slug: c.slug,
      icon: c.icon || "Package",
      sortOrder: c.sortOrder || 0,
      isActive: c.isActive,
    });
    setIsCatModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    try {
      if (catModalMode === "add") {
        const res = await adminFetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Kategori baru berhasil ditambahkan", "success");
          setIsCatModalOpen(false);
          if (data.data) {
            setCategories((prev) => [...prev, data.data]);
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal menambahkan kategori", "error");
        }
      } else {
        const res = await adminFetch(`/api/categories/${editingCatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Kategori berhasil diperbarui", "success");
          setIsCatModalOpen(false);
          if (data.data) {
            setCategories((prev) => prev.map((c) => c.id === editingCatId ? data.data : c));
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal memperbarui kategori", "error");
        }
      }
    } catch {
      showToast("Gagal menyimpan kategori", "error");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori '${name}'?`)) return;
    try {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      const res = await adminFetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Kategori '${name}' berhasil dihapus`, "success");
        notifyProductCatalogUpdated();
        refreshAllData();
      } else {
        showToast(data.error || "Gagal menghapus kategori", "error");
        refreshAllData();
      }
    } catch {
      showToast("Gagal menghapus kategori", "error");
      refreshAllData();
    }
  };

  // ==========================================
  // BANNER PROMO ACTIONS
  // ==========================================
  const openAddBannerModal = () => {
    setBannerModalMode("add");
    setEditingBannerId(null);
    setBannerForm({
      title: "",
      subtitle: "",
      imageUrl: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?q=80&w=1600&auto=format&fit=crop",
      ctaLabel: "Pesan Sekarang",
      ctaHref: "/produk",
      sortOrder: banners.length + 1,
      isActive: true,
    });
    setIsBannerModalOpen(true);
  };

  const openEditBannerModal = (b: any) => {
    setBannerModalMode("edit");
    setEditingBannerId(b.id);
    setBannerForm({
      title: b.title || "",
      subtitle: b.subtitle || "",
      imageUrl: b.imageUrl || b.image_url || "",
      ctaLabel: b.ctaLabel || b.cta_label || "Pesan Sekarang",
      ctaHref: b.ctaHref || b.cta_href || "/produk",
      sortOrder: b.sortOrder || b.sort_order || 1,
      isActive: b.isActive !== undefined ? b.isActive : Boolean(b.is_active),
    });
    setIsBannerModalOpen(true);
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBannerImage(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "banners");

    try {
      const res = await adminFetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setBannerForm((prev) => ({ ...prev, imageUrl: data.url }));
        showToast(
          data.savingsPercent
            ? `Banner dioptimasi & diunggah (Hemat ${data.savingsPercent}%)`
            : "Gambar banner berhasil diunggah",
          "success"
        );
      } else {
        showToast(data.error || "Gagal upload gambar banner", "error");
      }
    } catch {
      showToast("Gagal upload gambar banner ke server", "error");
    } finally {
      setUploadingBannerImage(false);
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      showToast("Judul banner wajib diisi", "error");
      return;
    }
    if (!bannerForm.imageUrl.trim()) {
      showToast("URL / Gambar banner wajib diisi", "error");
      return;
    }

    const payload = {
      title: bannerForm.title.trim(),
      subtitle: bannerForm.subtitle.trim() || null,
      imageUrl: bannerForm.imageUrl.trim(),
      ctaLabel: bannerForm.ctaLabel.trim() || null,
      ctaHref: bannerForm.ctaHref.trim() || null,
      sortOrder: Number(bannerForm.sortOrder) || 0,
      isActive: Boolean(bannerForm.isActive),
    };

    try {
      if (bannerModalMode === "add") {
        const res = await adminFetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Banner promo baru berhasil ditambahkan", "success");
          setIsBannerModalOpen(false);
          if (data.data) {
            setBanners((prev) => [...prev, data.data]);
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal menambah banner", "error");
        }
      } else {
        const res = await adminFetch(`/api/banners/${editingBannerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Banner promo berhasil diperbarui", "success");
          setIsBannerModalOpen(false);
          if (data.data) {
            setBanners((prev) => prev.map((b) => b.id === editingBannerId ? data.data : b));
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal mengupdate banner", "error");
        }
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan banner promo", "error");
    }
  };

  const handleToggleBannerStatus = async (b: any) => {
    const currentStatus = b.isActive !== undefined ? b.isActive : Boolean(b.is_active);
    const newStatus = !currentStatus;
    setBanners((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, isActive: newStatus, is_active: newStatus ? 1 : 0 } : item))
    );
    try {
      const res = await adminFetch(`/api/banners/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Banner '${b.title}' ${newStatus ? "diaktifkan" : "dinonaktifkan"}`, "success");
        notifyProductCatalogUpdated();
        refreshAllData();
      } else {
        showToast(data.error || "Gagal mengubah status banner", "error");
        refreshAllData();
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
      refreshAllData();
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(`Hapus banner promo '${title}'?`)) return;
    try {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      const res = await adminFetch(`/api/banners/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Banner '${title}' berhasil dihapus`, "success");
        notifyProductCatalogUpdated();
        refreshAllData();
      } else {
        showToast(data.error || "Gagal menghapus banner", "error");
        refreshAllData();
      }
    } catch {
      showToast("Gagal menghapus banner", "error");
      refreshAllData();
    }
  };

  // ==========================================
  // PORTFOLIO / INSPIRASI HASIL CETAK ACTIONS
  // ==========================================
  const openAddPortfolioModal = () => {
    setPortfolioModalMode("add");
    setEditingPortfolioId(null);
    setPortfolioForm({
      title: "",
      client: "",
      category: "Packaging",
      imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800",
      description: "",
      sortOrder: portfolio.length + 1,
      isActive: true,
    });
    setIsPortfolioModalOpen(true);
  };

  const openEditPortfolioModal = (item: any) => {
    setPortfolioModalMode("edit");
    setEditingPortfolioId(item.id);
    setPortfolioForm({
      title: item.title || "",
      client: item.client || "",
      category: item.category || "Packaging",
      imageUrl: item.imageUrl || item.image_url || "",
      description: item.description || "",
      sortOrder: item.sortOrder || item.sort_order || 1,
      isActive: item.isActive !== undefined ? item.isActive : Boolean(item.is_active),
    });
    setIsPortfolioModalOpen(true);
  };

  const handlePortfolioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPortfolioImage(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "portfolio");

    try {
      const res = await adminFetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setPortfolioForm((prev) => ({ ...prev, imageUrl: data.url }));
        showToast(
          data.savingsPercent
            ? `Foto inspirasi dioptimasi & diunggah (Hemat ${data.savingsPercent}%)`
            : "Foto inspirasi berhasil diunggah",
          "success"
        );
      } else {
        showToast(data.error || "Gagal upload gambar portofolio", "error");
      }
    } catch {
      showToast("Gagal upload gambar portofolio ke server", "error");
    } finally {
      setUploadingPortfolioImage(false);
    }
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioForm.title.trim()) {
      showToast("Judul inspirasi cetak wajib diisi", "error");
      return;
    }
    if (!portfolioForm.imageUrl.trim()) {
      showToast("Foto / Gambar inspirasi cetak wajib diisi", "error");
      return;
    }

    const payload = {
      title: portfolioForm.title.trim(),
      client: portfolioForm.client.trim() || null,
      category: portfolioForm.category.trim() || "All Work",
      imageUrl: portfolioForm.imageUrl.trim(),
      description: portfolioForm.description.trim() || null,
      sortOrder: Number(portfolioForm.sortOrder) || 0,
      isActive: Boolean(portfolioForm.isActive),
    };

    try {
      if (portfolioModalMode === "add") {
        const res = await adminFetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Inspirasi hasil cetak berhasil ditambahkan", "success");
          setIsPortfolioModalOpen(false);
          if (data.data) {
            setPortfolio((prev) => [...prev, data.data]);
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal menambah inspirasi cetak", "error");
        }
      } else {
        const res = await adminFetch(`/api/portfolio/${editingPortfolioId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Inspirasi hasil cetak berhasil diperbarui", "success");
          setIsPortfolioModalOpen(false);
          if (data.data) {
            setPortfolio((prev) => prev.map((p) => p.id === editingPortfolioId ? data.data : p));
          }
          notifyProductCatalogUpdated();
          refreshAllData();
        } else {
          showToast(data.error || "Gagal mengupdate inspirasi cetak", "error");
        }
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan inspirasi cetak", "error");
    }
  };

  const handleTogglePortfolioStatus = async (item: any) => {
    const currentStatus = item.isActive !== undefined ? item.isActive : Boolean(item.is_active);
    const newStatus = !currentStatus;
    setPortfolio((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, isActive: newStatus, is_active: newStatus ? 1 : 0 } : p))
    );
    try {
      const res = await adminFetch(`/api/portfolio/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Inspirasi '${item.title}' ${newStatus ? "diaktifkan" : "dinonaktifkan"}`, "success");
        notifyProductCatalogUpdated();
        refreshAllData();
      } else {
        showToast(data.error || "Gagal mengubah status inspirasi", "error");
        refreshAllData();
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
      refreshAllData();
    }
  };

  const handleDeletePortfolio = async (id: string, title: string) => {
    if (!confirm(`Hapus inspirasi hasil cetak '${title}'?`)) return;
    try {
      setPortfolio((prev) => prev.filter((p) => p.id !== id));
      const res = await adminFetch(`/api/portfolio/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Inspirasi '${title}' berhasil dihapus`, "success");
        notifyProductCatalogUpdated();
        refreshAllData();
      } else {
        showToast(data.error || "Gagal menghapus inspirasi", "error");
        refreshAllData();
      }
    } catch {
      showToast("Gagal menghapus inspirasi cetak", "error");
      refreshAllData();
    }
  };

  // ==========================================
  // SETTINGS ACTIONS
  // ==========================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pengaturan sistem berhasil disimpan & disinkronkan ke seluruh web", "success");
      } else {
        showToast(data.error || "Gagal menyimpan pengaturan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan pengaturan", "error");
    }
  };

  // ==========================================
  // ORDER ACTIONS & DISPATCHER
  // ==========================================
  const handleUpdateOrderStatus = async (id: string, newStatus: string, customCourier?: any) => {
    // Jika admin memilih status DIKIRIM dan belum mengisi data kurir, buka modal dispatcher
    if ((newStatus === "DIKIRIM" || newStatus === "SHIPPED") && !customCourier) {
      const ord = orders.find((o) => o.id === id);
      if (ord) {
        setDispatchModalOrder(ord);
        if (ord.courier) {
          setDispatchForm({
            name: ord.courier.name || "Budi Santoso",
            phone: ord.courier.phone || "082283995544",
            plate: ord.courier.plate || "Honda Vario (BA 4821 QA)",
            eta: ord.courier.eta || "20 Menit",
            notes: ord.courier.notes || "Kurir Toko Cetak.inc sedang meluncur membawa pesanan Anda",
          });
        }
      }
      return;
    }

    try {
      const res = await adminFetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          courier: customCourier || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder((prev: any) => ({
            ...prev,
            status: newStatus,
            courier: customCourier || prev.courier,
          }));
        }
        refreshAllData();
      } else {
        showToast(data.error || "Gagal mengubah status", "error");
      }
    } catch {
      showToast("Gagal menghubungi server pesanan", "error");
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalOrder) return;
    setDispatchingLoading(true);
    await handleUpdateOrderStatus(dispatchModalOrder.id, "DIKIRIM", dispatchForm);
    setDispatchingLoading(false);
    setDispatchModalOrder(null);
  };

  const exportOrdersToCsv = () => {
    if (orders.length === 0) {
      showToast("Belum ada data pesanan untuk diekspor", "error");
      return;
    }
    const headers = ["Kode Pesanan", "Tanggal", "Nama Pelanggan", "WhatsApp", "Metode Kirim", "Alamat", "Pembayaran", "Subtotal", "Status"];
    const rows = orders.map((o) => [
      `"${o.code}"`,
      `"${new Date(o.createdAt).toLocaleString("id-ID")}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.deliveryMethod}"`,
      `"${(o.address || "").replace(/"/g, '""')}"`,
      `"${o.paymentMethod}"`,
      o.subtotal,
      `"${o.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pesanan-bas-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("File CSV pesanan berhasil diunduh", "success");
  };

  // ==========================================
  // BACKUP & RESET
  // ==========================================
  const handleDownloadBackup = () => {
    window.open("/api/admin/backup", "_blank");
    showToast("Salinan backup database JSON berhasil diunduh", "success");
  };

  const handleResetDatabase = async () => {
    if (resetConfirmInput !== "RESET") {
      showToast("Ketik 'RESET' dengan huruf kapital untuk konfirmasi reset database", "error");
      return;
    }

    setIsResetting(true);
    try {
      const res = await adminFetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", confirmText: "RESET" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setResetConfirmInput("");
        refreshAllData();
      } else {
        showToast(data.error || "Gagal mereset database", "error");
      }
    } catch {
      showToast("Terjadi kesalahan proses reset", "error");
    } finally {
      setIsResetting(false);
    }
  };

  // Storage Health Check & Cleanup
  const fetchStorageStats = async () => {
    setLoadingStorage(true);
    try {
      const res = await adminFetch("/api/admin/storage");
      const data = await res.json();
      if (data.success && data.stats) {
        setStorageStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleCleanupStorage = async () => {
    setCleaningStorage(true);
    try {
      const res = await adminFetch("/api/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup_orphans" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchStorageStats();
      } else {
        showToast(data.error || "Gagal membersihkan storage", "error");
      }
    } catch {
      showToast("Gagal menghubungi server storage", "error");
    } finally {
      setCleaningStorage(false);
    }
  };

  useEffect(() => {
    if (activeTab === "backup" && isAuthenticated) {
      fetchStorageStats();
    }
  }, [activeTab, isAuthenticated]);

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      showToast("Konfirmasi password baru tidak cocok", "error");
      return;
    }
    try {
      const res = await adminFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: passForm.oldPassword, newPassword: passForm.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password admin berhasil diperbarui", "success");
        setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast(data.error || "Gagal mengubah password", "error");
      }
    } catch {
      showToast("Gagal menghubungi server", "error");
    }
  };

  // ------------------------------------------
  // LOGIN SCREEN (If not authenticated)
  // ------------------------------------------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0B1E36] flex items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-gray-300">
            Memeriksa Kredensial Urang Dalam...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1E36] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#1E1B4B] to-[#0B1E36] rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
              <ShieldCheck size={32} className="text-[#F97316]" />
            </div>
            <h1 className="font-display text-2xl text-[#0B1E36] tracking-tight">
              Urang Dalam BAS ADV
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Portal Manajemen Percetakan & Konten Terintegrasi
            </p>
          </div>

          {loginError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#F97316] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#F97316] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#F97316] hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {loginLoading ? "Memverifikasi..." : "Masuk ke Panel Urang Dalam"}
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <a href={process.env.NEXT_PUBLIC_STORE_URL || "https://cetakinc.vercel.app"} className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 font-medium">
              <ArrowLeft size={13} /> Kembali ke Web Toko Utama
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filtered products calculation
  const filteredProducts = products.filter((p) => {
    if (productStatusFilter === "active" && !p.isActive) return false;
    if (productStatusFilter === "inactive" && p.isActive) return false;
    const matchCat = productCatFilter === "Semua" || p.category === productCatFilter || p.categoryId === productCatFilter;
    const q = productSearch.toLowerCase();
    const title = (p.name || p.title || "").toLowerCase();
    const desc = (p.description || p.desc || "").toLowerCase();
    return matchCat && (title.includes(q) || desc.includes(q));
  });

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "Semua") return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-gray-800 flex flex-col">
      {/* Toast popup */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold text-white transition-all transform animate-bounce ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP ADMIN HEADER */}
      <header className="bg-white/95 text-slate-800 sticky top-0 z-40 border-b border-gray-200/70 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 p-1.5 shadow-sm flex items-center justify-center shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Cetak.inc"
              width={22}
              height={22}
              className="object-contain brightness-0 invert"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base tracking-tight text-slate-900 flex items-center gap-0.5">
                <span>Cetak<span className="text-[#F97316]">.</span>inc</span>
                <span className="text-slate-400 font-semibold text-xs ml-1 hidden sm:inline">Admin</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-medium">
              Panel Manajemen Percetakan & Kontrol Katalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={refreshAllData}
            title="Refresh Data dari Database Supabase"
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200/80 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-500" : ""} />
          </button>
          <a
            href={process.env.NEXT_PUBLIC_STORE_URL || "https://cetakinc.vercel.app"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Buka Toko Web Utama"
          >
            <ExternalLink size={12} /> <span className="hidden sm:inline">Lihat Web</span>
          </a>
          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 border border-red-200/60 transition-all cursor-pointer active:scale-95"
            title="Keluar dari Panel Admin"
          >
            <LogOut size={13} /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* DESKTOP / TABLET NAVIGATION TABS RAIL (Hidden on mobile because mobile uses bottom navigation bar) */}
      <nav className="hidden md:flex bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-3 sm:px-8 py-2 overflow-x-auto no-scrollbar items-center gap-1.5 sticky top-[53px] z-30 shadow-2xs">
        {[
          { id: "products", label: "Katalog Produk", badge: products.length, icon: Package },
          { id: "categories", label: "Kategori", badge: categories.length, icon: Layers },
          { id: "portfolio", label: "Inspirasi Cetak", badge: portfolio.length, icon: Sparkles },
          { id: "banners", label: "Banner Promo", badge: banners.length, icon: ImageIcon },
          { id: "settings", label: "Pengaturan & WA", icon: Settings },
          { id: "dashboard", label: "Ringkasan Toko", icon: LayoutDashboard },
          { id: "backup", label: "Backup & Data", icon: Database },
          { id: "account", label: "Keamanan Akun", icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-gray-100/70 hover:bg-gray-200/80 text-gray-600"
              }`}
            >
              <Icon size={14} className={isActive ? "text-orange-400" : "text-gray-400"} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* MOBILE BOTTOM NAVIGATION BAR (Sticky for Phones) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 py-2 pb-safe flex items-center justify-around md:hidden">
        {[
          { id: "products", label: "Produk", icon: Package },
          { id: "categories", label: "Kategori", icon: Layers },
          { id: "portfolio", label: "Inspirasi", icon: Sparkles },
          { id: "banners", label: "Banner", icon: ImageIcon },
          { id: "settings", label: "Pengaturan", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer relative ${
                isActive ? "text-orange-600 font-extrabold" : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? "bg-orange-50 text-orange-600 scale-110" : ""
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${
                isActive ? "font-extrabold text-orange-600" : "font-semibold text-slate-500"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* MAIN ADMIN CONTENT CONTAINER */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5 pb-24 md:pb-12">
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD RINGKASAN */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Produk</span>
                  <Package size={20} className="text-blue-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#0B1E36]">
                  {products.length}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Katalog Terdaftar di Database
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Produk Aktif</span>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {products.filter((p) => p.isActive).length}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Tampil & Siap Dipesan Publik
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Kategori</span>
                  <Layers size={20} className="text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#0B1E36]">
                  {categories.length}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Kelompok Branding & Merchandise
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Banner Promo</span>
                  <ImageIcon size={20} className="text-[#F97316]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#F97316]">
                  {banners.length}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Slider Promo di Beranda
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Catalog Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
                <h2 className="font-extrabold text-sm text-[#0B1E36]">Aksi Cepat</h2>
                <div className="space-y-2">
                  <button
                    onClick={openAddProductModal}
                    className="w-full p-3 bg-orange-50 hover:bg-orange-100 text-[#F97316] font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> Tambah Produk Baru
                  </button>
                  <button
                    onClick={() => setActiveTab("banners")}
                    className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ImageIcon size={16} /> Atur Banner Promo Beranda
                  </button>
                  <button
                    onClick={() => setActiveTab("portfolio")}
                    className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles size={16} /> Atur Inspirasi Hasil Cetak ({portfolio.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone size={16} /> Ganti Nomor WhatsApp Pemesanan
                  </button>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download size={16} /> Download Backup Database
                  </button>
                </div>
              </div>

              {/* Recent Products Added */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold text-sm text-[#0B1E36]">Produk Terbaru di Katalog</h2>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="text-xs text-[#F97316] font-bold hover:underline cursor-pointer"
                  >
                    Lihat Semua ({products.length})
                  </button>
                </div>

                {products.length === 0 ? (
                  <p className="text-xs text-gray-400 py-8 text-center">Belum ada produk di katalog.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {products.slice(0, 5).map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {p.images && p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-bold text-xs text-gray-900 truncate">{p.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {categories.find((c) => c.id === p.categoryId)?.name || "Kategori"} • {p.isActive ? "Aktif" : "Nonaktif"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#F97316]">
                            Rp {Number(p.basePrice || 0).toLocaleString("id-ID")}
                          </span>
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="block text-[10px] text-blue-600 font-bold hover:underline mt-0.5 cursor-pointer"
                          >
                            Edit Produk
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PRODUK CRUD */}
        {/* ========================================================= */}
        {activeTab === "products" && (
          <div className="space-y-3.5">
            {/* Clean Section Header (Prominent Tambah Produk Button, never covered!) */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Katalog Produk</h2>
                <p className="text-[11px] text-slate-500 font-medium">{filteredProducts.length} produk terdaftar</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Isi atau sinkronkan katalog dengan master produk percetakan standar?")) return;
                    try {
                      const res = await adminFetch("/api/admin/seed-printing", { method: "POST" });
                      const d = await res.json();
                      if (d.success) {
                        showToast(d.message, "success");
                        notifyProductCatalogUpdated();
                        refreshAllData();
                      } else {
                        showToast(d.error || "Gagal mengisi katalog", "error");
                      }
                    } catch {
                      showToast("Gagal menghubungi server", "error");
                    }
                  }}
                  className="hidden sm:inline-flex px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs items-center gap-1.5 transition-all cursor-pointer"
                  title="Sinkronkan master produk standar percetakan"
                >
                  <RefreshCw size={13} /> <span>Master Cetak</span>
                </button>

                <button
                  onClick={openAddProductModal}
                  className="px-4 py-2 bg-[#F97316] hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm shadow-orange-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Tambah Produk</span>
                </button>
              </div>
            </div>

            {/* Clean Search Input (No bulky card wrapper) */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk, kategori, atau harga..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-slate-900 transition-colors shadow-2xs placeholder:text-slate-400"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Combined Minimalist Filter Chips (Status + Categories in 1 clean swipe line) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setProductStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  productStatusFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                Semua ({products.length})
              </button>
              <button
                onClick={() => setProductStatusFilter("active")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1 ${
                  productStatusFilter === "active"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Aktif ({products.filter((p) => p.isActive).length})
              </button>
              <button
                onClick={() => setProductStatusFilter("inactive")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1 ${
                  productStatusFilter === "inactive"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Nonaktif ({products.filter((p) => !p.isActive).length})
              </button>

              <span className="text-slate-300 font-light">|</span>

              <button
                onClick={() => setProductCatFilter("Semua")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  productCatFilter === "Semua"
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setProductCatFilter(c.name)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    productCatFilter === c.name
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Bulk Actions when selected */}
            {selectedProductIds.length > 0 && (
              <div className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">{selectedProductIds.length} produk terpilih</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleBulkAction("activate")}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold"
                  >
                    Aktifkan
                  </button>
                  <button
                    onClick={() => handleBulkAction("deactivate")}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold"
                  >
                    Nonaktifkan
                  </button>
                  <button
                    onClick={() => setSelectedProductIds([])}
                    className="px-2 py-1 text-slate-400 hover:text-white font-bold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* DESKTOP PRODUCT TABLE (Hidden on Mobile) */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-200/70 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          className="rounded text-orange-600 focus:ring-orange-500"
                          checked={selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProductIds(filteredProducts.map((p) => p.id));
                            else setSelectedProductIds([]);
                          }}
                        />
                      </th>
                      <th className="p-3.5">Produk</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Harga</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right sticky right-0 bg-gray-50/80">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-400">
                          <Package size={32} className="mx-auto mb-2 text-gray-300" />
                          Tidak ada produk yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                className="rounded text-orange-600 focus:ring-orange-500"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                                  else setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                                }}
                              />
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200/80 shadow-2xs">
                                  <Image
                                    src={p.imageUrl || p.img || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"}
                                    alt={p.name || p.title}
                                    fill
                                    sizes="48px"
                                    unoptimized={Boolean((p.imageUrl || p.img)?.startsWith("data:"))}
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <div className="font-bold text-gray-900 truncate text-xs sm:text-sm">{p.name || p.title}</div>
                                  <div className="text-[11px] text-gray-400 truncate mt-0.5">{p.description || p.desc || "-"}</div>
                                  {p.isBestSeller && (
                                    <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.2 rounded-md inline-block mt-0.5 border border-amber-200/60">
                                      Terlaris 🔥
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-full text-[10px] inline-block">
                                {p.category}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-slate-900">
                              <span className="text-orange-600">{p.price}</span>{" "}
                              <span className="text-[10px] text-gray-400 font-normal">{p.unit}</span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleToggleProductStatus(p)}
                                title={p.isActive ? "Klik untuk Nonaktifkan dari katalog" : "Klik untuk Aktifkan ke katalog"}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                                  p.isActive
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                {p.isActive ? "Aktif" : "Nonaktif"}
                              </button>
                            </td>
                            <td className="p-3.5 text-right sticky right-0 bg-white">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleDuplicateProduct(p)}
                                  title="Duplikasi Produk"
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  title="Edit Produk"
                                  className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name || p.title)}
                                  title="Hapus / Nonaktifkan Produk"
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE PRODUCT LIST (Clean, modern, non-AI layout) */}
            <div className="block md:hidden space-y-2.5">
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-slate-200/70 shadow-2xs">
                  <Package size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">Tidak ada produk yang sesuai dengan filter.</p>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div
                        onClick={() => openEditProductModal(p)}
                        className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 cursor-pointer"
                      >
                        <Image
                          src={p.imageUrl || p.img || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"}
                          alt={p.name || p.title}
                          fill
                          sizes="64px"
                          unoptimized={Boolean((p.imageUrl || p.img)?.startsWith("data:"))}
                          className="object-cover"
                        />
                        {p.isBestSeller && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-black px-1 rounded shadow-xs">
                            🔥
                          </div>
                        )}
                      </div>

                      {/* Info & Typography */}
                      <div
                        onClick={() => openEditProductModal(p)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span className="truncate max-w-[120px]">{p.category}</span>
                          <span>•</span>
                          <span className={p.isActive ? "text-emerald-600 font-bold" : "text-slate-400"}>
                            {p.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>

                        <h3 className="font-semibold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                          {p.name || p.title}
                        </h3>

                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-sm font-black text-orange-600">{p.price}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                        </div>
                      </div>

                      {/* Compact Tactile Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleProductStatus(p)}
                          className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                          }`}
                          title={p.isActive ? "Klik untuk Nonaktifkan" : "Klik untuk Aktifkan"}
                        >
                          <span className={`block w-2 h-2 rounded-full ${p.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        </button>

                        <button
                          onClick={() => openEditProductModal(p)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                          title="Edit Produk"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name || p.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer active:scale-95"
                          title="Hapus Produk"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: KATEGORI CRUD */}
        {/* ========================================================= */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">Kategori Produk</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kelola kategori untuk mengelompokkan produk di web utama ({categories.length} Kategori aktif).
                </p>
              </div>
              <button
                onClick={openAddCategoryModal}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Plus size={15} /> Tambah Kategori
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/70 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded-md font-bold">
                        #{c.sortOrder || 1}
                      </span>
                      <span className="bg-orange-50 text-orange-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-orange-200/60">
                        {c.productCount || 0} Produk
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-2">{c.name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">/{c.slug}</p>
                  </div>

                  <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditCategoryModal(c)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* ========================================================= */}
        {/* TAB: BANNER PROMO */}
        {/* ========================================================= */}
        {activeTab === "banners" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/70 shadow-xs">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">Banner Promo & Slider Beranda</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kelola banner promosi dan penawaran kilat yang tampil di carousel otomatis halaman beranda web utama.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddBannerModal}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Plus size={15} /> Tambah Banner Baru
              </button>
            </div>

            {banners.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-12 text-center border border-gray-200/70 shadow-xs">
                <ImageIcon size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-sm text-gray-700">Belum Ada Banner Promo</h3>
                <p className="text-xs text-gray-400 mt-1">Tambahkan banner promosi pertama Anda untuk memikat calon pembeli.</p>
                <button
                  type="button"
                  onClick={openAddBannerModal}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Buat Banner Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map((b) => {
                  const isActive = b.isActive !== undefined ? b.isActive : Boolean(b.is_active);
                  const imgUrl = b.imageUrl || b.image_url;
                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-gray-200/70 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Preview */}
                        <div className="relative aspect-16/9 bg-gray-100 overflow-hidden">
                          {imgUrl ? (
                            <Image
                              src={imgUrl}
                              alt={b.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized={Boolean(imgUrl.startsWith("data:"))}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon size={32} />
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold">
                              #{b.sortOrder || b.sort_order || 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs inline-flex items-center gap-1 ${
                                isActive
                                  ? "bg-emerald-600/90 text-white"
                                  : "bg-slate-800/80 text-gray-300"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-300 animate-pulse" : "bg-gray-400"}`} />
                              {isActive ? "Aktif Publik" : "Nonaktif"}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">{b.title}</h3>
                          {b.subtitle && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{b.subtitle}</p>
                          )}
                          <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100">
                            <span>Tombol: <strong className="text-gray-700">{b.ctaLabel || b.cta_label || "Buka"}</strong></span>
                            <span className="truncate max-w-[150px] font-mono text-[10px] text-gray-500">{b.ctaHref || b.cta_href || "/produk"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-gray-50 mt-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBannerStatus(b)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60"
                          }`}
                        >
                          {isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBannerModal(b)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer border border-gray-200/60"
                            title="Edit Banner"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(b.id, b.title)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer border border-red-200/60"
                            title="Hapus Banner"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: INSPIRASI HASIL CETAK (PORTFOLIO LOOKBOOK) */}
        {/* ========================================================= */}
        {activeTab === "portfolio" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/70 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900">Inspirasi Hasil Cetak</h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    {portfolio.length} Item
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kelola galeri lookbook visual hasil cetak yang tampil di carousel halaman utama toko.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddPortfolioModal}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Plus size={15} /> Tambah Inspirasi Baru
              </button>
            </div>

            {portfolio.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-12 text-center border border-gray-200/70 shadow-xs">
                <Sparkles size={40} className="mx-auto text-amber-400 mb-3" />
                <h3 className="font-bold text-sm text-gray-700">Belum Ada Inspirasi Hasil Cetak</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Tambahkan foto portofolio cetak pertama Anda untuk menginspirasi calon pelanggan di beranda.
                </p>
                <button
                  type="button"
                  onClick={openAddPortfolioModal}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Buat Inspirasi Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.map((item) => {
                  const isActive = item.isActive !== undefined ? item.isActive : Boolean(item.is_active);
                  const imgUrl = item.imageUrl || item.image_url;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-gray-200/70 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Preview */}
                        <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                          {imgUrl ? (
                            <Image
                              src={imgUrl}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized={Boolean(imgUrl.startsWith("data:"))}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon size={32} />
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold">
                              #{item.sortOrder || item.sort_order || 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs inline-flex items-center gap-1 ${
                                isActive
                                  ? "bg-emerald-600/90 text-white"
                                  : "bg-slate-800/80 text-gray-300"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-300 animate-pulse" : "bg-gray-400"}`} />
                              {isActive ? "Aktif Publik" : "Nonaktif"}
                            </span>
                          </div>
                          {item.category && (
                            <div className="absolute bottom-2.5 left-2.5">
                              <span className="bg-black/60 backdrop-blur-xs text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                {item.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-1.5">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">{item.title}</h3>
                          {item.client && (
                            <p className="text-xs font-semibold text-orange-600 line-clamp-1 flex items-center gap-1">
                              <span>Klien:</span> {item.client}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-gray-50 mt-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePortfolioStatus(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60"
                          }`}
                        >
                          {isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditPortfolioModal(item)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer border border-gray-200/60"
                            title="Edit Inspirasi"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePortfolio(item.id, item.title)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer border border-red-200/60"
                            title="Hapus Inspirasi"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PENGATURAN & WA TEMPLATE */}
        {/* ========================================================= */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* WhatsApp & Kontak Panel */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/70 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                    Kontak WhatsApp & Pemesanan
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pengaturan nomor penerima pesanan pelanggan yang terhubung langsung ke web utama.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200/80 w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terhubung ke cetakinc.vercel.app
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nomor WhatsApp Admin (Penerima Pesanan) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 6282172725267"
                    value={settings["contact.whatsapp"] || ""}
                    onChange={(e) => setSettings({ ...settings, "contact.whatsapp": e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Semua pesanan produk dan tombol chat konsultasi di web utama otomatis mengirim pesan WhatsApp ke nomor ini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    placeholder="hello@basadvertising.com"
                    value={settings["contact.email"] || ""}
                    onChange={(e) => setSettings({ ...settings, "contact.email": e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Alamat Workshop Percetakan
                  </label>
                  <input
                    type="text"
                    placeholder="Jl. Percetakan Modern No.88, Kota Padang, Sumatera Barat"
                    value={settings["contact.address"] || ""}
                    onChange={(e) => setSettings({ ...settings, "contact.address": e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Jam Operasional
                  </label>
                  <input
                    type="text"
                    placeholder="Senin - Sabtu: 08:30 - 21:00 WIB"
                    value={settings["contact.hours"] || ""}
                    onChange={(e) => setSettings({ ...settings, "contact.hours": e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Template Pesan WA Panel */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/70 shadow-xs space-y-3">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 pb-2 border-b border-gray-100">
                Template Format Pesanan WhatsApp
              </h2>
              <p className="text-xs text-gray-500">
                Klik tag berikut untuk menyisipkannya ke template:
              </p>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {["{code}", "{nama}", "{phone}", "{metode}", "{alamat}", "{pembayaran}", "{catatan}", "{items}", "{total}"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const cur = settings["checkout.waTemplate"] || "";
                      setSettings({ ...settings, "checkout.waTemplate": cur + (cur ? " " : "") + tag });
                    }}
                    className="px-2 py-1 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <textarea
                rows={8}
                value={settings["checkout.waTemplate"] || ""}
                onChange={(e) => setSettings({ ...settings, "checkout.waTemplate": e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                Simpan & Terapkan Pengaturan
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 6: BACKUP & STORAGE OPTIMIZATION */}
        {/* ========================================================= */}
        {activeTab === "backup" && (
          <div className="space-y-6">
            
            {/* KESEHATAN & EFISIENSI STORAGE SUPABASE */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    ⚡ Sharp WebP Compression Engine Aktif
                  </span>
                  <h2 className="font-extrabold text-base text-[#0B1E36] mt-2">Kesehatan & Efisiensi Storage Supabase</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Setiap upload gambar otomatis dikompresi ke format WebP (hemat hingga 96% kapasitas) dan dicache 1 tahun di CDN.
                  </p>
                </div>
                <button
                  onClick={fetchStorageStats}
                  disabled={loadingStorage}
                  className="self-start sm:self-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors shrink-0"
                >
                  {loadingStorage ? "Memuat..." : "Refresh Status"}
                </button>
              </div>

              {storageStats ? (
                <div className="space-y-4 pt-2">
                  {/* Progress Bar Storage */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-700">Kapasitas Terpakai</span>
                      <span className="text-emerald-700">
                        {storageStats.totalFormatted} / {storageStats.freeTierLimit} ({storageStats.percentUsed}% terpakai)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#F97316] rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(1, Math.min(100, storageStats.percentUsed * 10))}%` }}
                      />
                    </div>
                  </div>

                  {/* Grid Detail Statistik */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Total File</span>
                      <span className="text-lg font-black text-gray-900">{storageStats.totalFiles}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Ukuran</span>
                      <span className="text-lg font-black text-emerald-600">{storageStats.totalFormatted}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Rata-rata Hemat</span>
                      <span className="text-lg font-black text-[#F97316]">~96%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">File Sampah/Yatim</span>
                      <span className={`text-lg font-black ${storageStats.orphanCount > 0 ? "text-amber-600" : "text-gray-400"}`}>
                        {storageStats.orphanCount} file
                      </span>
                    </div>
                  </div>

                  {/* Tombol Bersihkan Sampah */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                    <div className="text-xs text-emerald-900">
                      <strong>Pembersihan Otomatis:</strong> File gambar produk/banner yang dihapus atau diganti otomatis dihapus dari Supabase Storage.
                    </div>
                    {storageStats.orphanCount > 0 ? (
                      <button
                        onClick={handleCleanupStorage}
                        disabled={cleaningStorage}
                        className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
                      >
                        {cleaningStorage ? "Membersihkan..." : `Bersihkan ${storageStats.orphanCount} File Sampah`}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 shrink-0 flex items-center gap-1">
                        ✓ Storage 100% Bersih & Rapi
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">
                  Klik "Refresh Status" untuk melihat ringkasan kapasitas storage Supabase.
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="font-extrabold text-base text-[#0B1E36]">Ekspor & Backup Database</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Unduh salinan cadangan lengkap seluruh katalog produk, kategori, banner, pengaturan, dan portofolio dalam bentuk file JSON terenkripsi.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="px-5 py-2.5 bg-[#0B1E36] hover:bg-black text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <Download size={15} /> Download Full Database JSON
              </button>
            </div>

            {/* Reset Area with Typing Confirmation */}
            <div className="bg-red-50/70 p-6 rounded-3xl border border-red-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <h2 className="font-extrabold text-base">Reset Database ke Default</h2>
              </div>
              <p className="text-xs text-red-600 leading-relaxed">
                Aksi ini akan mengembalikan seluruh produk (89 produk) dan 8 kategori ke seed awal. Sistem akan <strong>secara otomatis membuat file backup cadangan</strong> di folder server sebelum reset dijalankan, sehingga tidak ada data yang hilang permanen.
              </p>

              <div className="max-w-md space-y-3">
                <label className="block text-xs font-bold text-red-800">
                  Ketik "RESET" untuk mengonfirmasi:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik RESET"
                    value={resetConfirmInput}
                    onChange={(e) => setResetConfirmInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-red-300 rounded-xl text-xs font-bold text-red-700 focus:outline-none"
                  />
                  <button
                    onClick={handleResetDatabase}
                    disabled={resetConfirmInput !== "RESET" || isResetting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    {isResetting ? "Mereset..." : "Jalankan Reset"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: GANTI PASSWORD ADMIN */}
        {/* ========================================================= */}
        {activeTab === "account" && (
          <div className="max-w-lg bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
            <h2 className="font-extrabold text-base text-[#0B1E36] pb-2 border-b border-gray-100">
              Ubah Password Urang Dalam
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password Lama *</label>
                <input
                  type="password"
                  required
                  value={passForm.oldPassword}
                  onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password Baru (Min. 6 karakter) *</label>
                <input
                  type="password"
                  required
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  required
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0B1E36] hover:bg-black text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Perbarui Password
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: MANAJEMEN TITIK WORKSHOP (MULTI-HUB) */}
        {/* ========================================================= */}
        {activeTab === "hubs" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs">
              <div>
                <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Building2 className="text-[#F97316]" size={18} /> Titik Workshop Percetakan (Multi-Hub)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Daftar cabang percetakan mitra & pusat di Kota Padang untuk alokasi otomatis pesanan terdekat.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddHubModal}
                className="px-4 py-2.5 bg-[#F97316] hover:bg-orange-600 text-white rounded-2xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus size={15} /> Tambah Workshop Hub
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(hubsList.length > 0 ? hubsList : [
                {
                  id: "00000000-0000-0000-0000-000000000001",
                  name: "Hub Pusat BAS Advertising Padang",
                  slug: "hub-padang-pusat",
                  address: "Jl. Belanti Baru No. 17, Lolong Belanti, Kec. Padang Utara, Kota Padang",
                  lat: -0.9025,
                  lng: 100.3542,
                  phone: "082283995544",
                  whatsapp: "6282283995544",
                  maxRadiusKm: 25,
                  dailyCapacity: 150,
                  isActive: true,
                  isOpen: true,
                  notes: "Workshop Pusat - Fasilitas Cetak Lengkap",
                },
                {
                  id: "00000000-0000-0000-0000-000000000002",
                  name: "Hub Lubuk Buaya (Workshop Cabang)",
                  slug: "hub-lubuk-buaya",
                  address: "Jl. Adinegoro No. 88, Lubuk Buaya, Kec. Koto Tangah, Kota Padang",
                  lat: -0.8354,
                  lng: 100.315,
                  phone: "082283995544",
                  whatsapp: "6282283995544",
                  maxRadiusKm: 20,
                  dailyCapacity: 100,
                  isActive: true,
                  isOpen: true,
                  notes: "Workshop Cabang Utara - Prioritas Area Lubuk Buaya & Koto Tangah",
                },
              ]).map((hub) => (
                <div
                  key={hub.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900">{hub.name}</h3>
                          <span className="font-mono text-[11px] text-gray-400">slug: {hub.slug}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            hub.isOpen
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}
                        >
                          {hub.isOpen ? "BUKA" : "TUTUP"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            hub.isActive
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {hub.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-3 text-xs space-y-1.5 text-gray-600">
                      <p className="flex items-start gap-1.5">
                        <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <span>{hub.address}</span>
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-1 text-gray-500">
                        <span>Koordinat: <strong className="text-gray-800">{Number(hub.lat).toFixed(4)}, {Number(hub.lng).toFixed(4)}</strong></span>
                        <span>Radius: <strong className="text-gray-800">{hub.maxRadiusKm || 15} km</strong></span>
                        <span>Kapasitas: <strong className="text-gray-800">{hub.dailyCapacity || 50} order/hari</strong></span>
                        <span>WA: <strong className="text-gray-800">{hub.whatsapp || hub.phone}</strong></span>
                      </div>
                    </div>

                    {hub.notes && (
                      <p className="text-[11px] text-gray-500 italic">
                        Catatan: {hub.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => openEditHubModal(hub)}
                      className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors"
                    >
                      Edit Hub
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleHubOpen(hub)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                        hub.isOpen
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {hub.isOpen ? "Tutup Cabang" : "Buka Cabang"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: MANAJEMEN TARIF ONGKIR WORKSHOP (FASE 3 BLUEPRINT V2) */}
        {/* ========================================================= */}
        {activeTab === "tariffs" && (
          <div className="space-y-5">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs">
              <div>
                <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Truck className="text-[#F97316]" size={18} /> Tarif Pengiriman & Ongkos Kirim Workshop
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Atur struktur ongkir internal per titik workshop percetakan Kota Padang. Berlaku kalkulasi otomatis jarak jalan (OSRM / Haversine fallback) dengan pembulatan kelipatan Rp 500 ala Gojek/Astro.
                </p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0">
                <CheckCircle2 size={14} /> Engine Routing Aktif
              </div>
            </div>

            {/* Live Ongkir Simulator Widget */}
            <div className="bg-gradient-to-br from-[#0B1E36] to-[#122b4c] text-white p-5 rounded-3xl shadow-md border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F97316]/20 text-[#F97316] flex items-center justify-center font-bold">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Simulator Kalkulasi Ongkir Cepat</h3>
                    <p className="text-[11px] text-gray-300">Uji coba perhitungan ongkir pelanggan secara langsung berdasarkan jarak & nilai belanja</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono bg-white/10 px-2.5 py-1 rounded-lg text-orange-300">
                  Formula: Base + (Jarak × PerKm)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-[11px] text-gray-300 block mb-1">Simulasi Jarak Antar (km):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="40"
                    value={simKm}
                    onChange={(e) => setSimKm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-300 block mb-1">Nilai Belanja Cetak (Rp):</label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={simSubtotal}
                    onChange={(e) => setSimSubtotal(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                {/* Hasil Kalkulasi Hub Pusat */}
                {(() => {
                  const tPusat = tariffsList.find(t => t.hubId === "00000000-0000-0000-0000-000000000001") || {
                    baseFee: 8000, perKm: 2500, minFee: 8000, maxKm: 25, freeOver: 300000, isActive: true
                  };
                  const isFree = tPusat.freeOver && simSubtotal >= tPusat.freeOver;
                  let raw = tPusat.baseFee + (simKm * tPusat.perKm);
                  let rounded = Math.ceil(raw / 500) * 500;
                  let finalFee = isFree ? 0 : Math.max(tPusat.minFee, rounded);

                  return (
                    <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                      <div className="text-[10px] text-gray-300 uppercase font-bold tracking-wider">Hub Padang Pusat</div>
                      <div className="text-lg font-extrabold text-[#F97316] mt-0.5">
                        {simKm > tPusat.maxKm ? (
                          <span className="text-red-400 text-xs">Di luar radius ({tPusat.maxKm}km)</span>
                        ) : isFree ? (
                          <span>GRATIS <span className="line-through text-gray-400 text-xs">Rp {rounded.toLocaleString("id-ID")}</span></span>
                        ) : (
                          `Rp ${finalFee.toLocaleString("id-ID")}`
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {isFree ? "Promo free shipping terpenuhi" : `Rp ${tPusat.baseFee} + (${simKm}km × ${tPusat.perKm})`}
                      </div>
                    </div>
                  );
                })()}

                {/* Hasil Kalkulasi Hub Lubuk Buaya */}
                {(() => {
                  const tLb = tariffsList.find(t => t.hubId === "00000000-0000-0000-0000-000000000002") || {
                    baseFee: 8000, perKm: 2500, minFee: 8000, maxKm: 20, freeOver: 300000, isActive: true
                  };
                  const isFree = tLb.freeOver && simSubtotal >= tLb.freeOver;
                  let raw = tLb.baseFee + (simKm * tLb.perKm);
                  let rounded = Math.ceil(raw / 500) * 500;
                  let finalFee = isFree ? 0 : Math.max(tLb.minFee, rounded);

                  return (
                    <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                      <div className="text-[10px] text-gray-300 uppercase font-bold tracking-wider">Hub Lubuk Buaya</div>
                      <div className="text-lg font-extrabold text-[#F97316] mt-0.5">
                        {simKm > tLb.maxKm ? (
                          <span className="text-red-400 text-xs">Di luar radius ({tLb.maxKm}km)</span>
                        ) : isFree ? (
                          <span>GRATIS <span className="line-through text-gray-400 text-xs">Rp {rounded.toLocaleString("id-ID")}</span></span>
                        ) : (
                          `Rp ${finalFee.toLocaleString("id-ID")}`
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {isFree ? "Promo free shipping terpenuhi" : `Rp ${tLb.baseFee} + (${simKm}km × ${tLb.perKm})`}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* List of Hub Tariffs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(hubsList.length > 0 ? hubsList : [
                {
                  id: "00000000-0000-0000-0000-000000000001",
                  name: "Hub Pusat BAS Advertising Padang",
                  slug: "hub-padang-pusat",
                  address: "Jl. Belanti Baru No. 17, Lolong Belanti, Padang Utara",
                },
                {
                  id: "00000000-0000-0000-0000-000000000002",
                  name: "Hub Lubuk Buaya (Workshop Cabang)",
                  slug: "hub-lubuk-buaya",
                  address: "Jl. Adinegoro No. 88, Lubuk Buaya, Koto Tangah",
                },
              ]).map((hub) => {
                const tariff = tariffsList.find((t) => t.hubId === hub.id) || {
                  hubId: hub.id,
                  baseFee: 8000,
                  perKm: 2500,
                  minFee: 8000,
                  maxKm: hub.slug?.includes("lubuk") ? 20 : 25,
                  freeOver: 300000,
                  isActive: true,
                };
                const isEditing = editingTariffHubId === hub.id;

                return (
                  <div
                    key={hub.id}
                    className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold">
                            <Truck size={20} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-gray-900">{hub.name}</h3>
                            <p className="text-[11px] text-gray-400">{hub.address}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            tariff.isActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {tariff.isActive ? "TARIF AKTIF" : "NONAKTIF"}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="pt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                Tarif Dasar (Base Fee):
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-xs text-gray-400">Rp</span>
                                <input
                                  type="number"
                                  value={tariffForm.baseFee}
                                  onChange={(e) => setTariffForm({ ...tariffForm, baseFee: parseInt(e.target.value) || 0 })}
                                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F97316]"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                Biaya Tambahan Per Km:
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-xs text-gray-400">Rp</span>
                                <input
                                  type="number"
                                  value={tariffForm.perKm}
                                  onChange={(e) => setTariffForm({ ...tariffForm, perKm: parseInt(e.target.value) || 0 })}
                                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F97316]"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                Tarif Minimum (Min Fee):
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-xs text-gray-400">Rp</span>
                                <input
                                  type="number"
                                  value={tariffForm.minFee}
                                  onChange={(e) => setTariffForm({ ...tariffForm, minFee: parseInt(e.target.value) || 0 })}
                                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F97316]"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                Radius Maksimal (km):
                              </label>
                              <input
                                type="number"
                                value={tariffForm.maxKm}
                                onChange={(e) => setTariffForm({ ...tariffForm, maxKm: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F97316]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">
                              Minimal Belanja Gratis Ongkir (Rp):
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs text-gray-400">Rp</span>
                              <input
                                type="number"
                                value={tariffForm.freeOver ?? 0}
                                onChange={(e) => setTariffForm({ ...tariffForm, freeOver: parseInt(e.target.value) || 0 })}
                                placeholder="Kosongkan jika tidak ada promo"
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F97316]"
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 mt-0.5 block">
                              Pesanan di atas nilai ini mendapat ongkir Rp 0.
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id={`active-${hub.id}`}
                              checked={tariffForm.isActive}
                              onChange={(e) => setTariffForm({ ...tariffForm, isActive: e.target.checked })}
                              className="rounded text-[#F97316] focus:ring-[#F97316]"
                            />
                            <label htmlFor={`active-${hub.id}`} className="text-xs text-gray-700 font-medium">
                              Aktifkan tarif pengiriman untuk workshop ini
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 block font-semibold">TARIF DASAR</span>
                              <span className="font-extrabold text-gray-900 text-sm">
                                Rp {tariff.baseFee.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 block font-semibold">PER KILOMETER</span>
                              <span className="font-extrabold text-[#F97316] text-sm">
                                Rp {tariff.perKm.toLocaleString("id-ID")}/km
                              </span>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 block font-semibold">TARIF MINIMUM</span>
                              <span className="font-extrabold text-gray-900 text-sm">
                                Rp {tariff.minFee.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 block font-semibold">MAX RADIUS</span>
                              <span className="font-extrabold text-gray-900 text-sm">
                                {tariff.maxKm} km
                              </span>
                            </div>
                          </div>

                          <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] text-orange-600 font-bold block uppercase tracking-wider">
                                Promo Gratis Ongkir
                              </span>
                              <span className="font-extrabold text-gray-900">
                                {tariff.freeOver
                                  ? `Belanja ≥ Rp ${Number(tariff.freeOver).toLocaleString("id-ID")}`
                                  : "Tidak Ada Promo"}
                              </span>
                            </div>
                            <Sparkles size={16} className="text-[#F97316]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveTariff(hub.id)}
                            disabled={savingTariff}
                            className="flex-1 py-2 px-3 bg-[#F97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
                          >
                            {savingTariff ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Simpan Perubahan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTariffHubId(null)}
                            disabled={savingTariff}
                            className="py-2 px-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEditTariff(hub.id, tariff)}
                          className="w-full py-2 px-3 border border-gray-200 hover:border-[#F97316] text-gray-700 hover:text-[#F97316] rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <SlidersHorizontal size={13} /> Ubah Pengaturan Tarif
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: VERIFIKASI PEMBAYARAN MANUAL (FASE 4 BLUEPRINT V2) */}
        {/* ========================================================= */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs">
              <div>
                <h2 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-[#F97316]" size={18} /> Verifikasi Pembayaran Manual & Mutasi
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Periksa bukti transfer rekening bank (Bank Nagari, BCA, Mandiri, BRI) dan scan QRIS dari pelanggan.
                  Setelah diverifikasi LUNAS, status pesanan otomatis berganti menjadi DIBAYAR dan dialokasikan ke antrean produksi workshop.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
                  <Clock size={13} /> {paymentsList.filter((p) => p.status === "PENDING").length} Menunggu
                </span>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> {paymentsList.filter((p) => p.status === "VERIFIED").length} Lunas
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: "ALL", label: `Semua (${paymentsList.length})` },
                { id: "PENDING", label: `Perlu Dicek (${paymentsList.filter((p) => p.status === "PENDING").length})` },
                { id: "VERIFIED", label: `Terverifikasi Lunas (${paymentsList.filter((p) => p.status === "VERIFIED").length})` },
                { id: "REJECTED", label: `Ditolak (${paymentsList.filter((p) => p.status === "REJECTED").length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPaymentFilterStatus(f.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    paymentFilterStatus === f.id
                      ? "bg-[#0B1E36] text-white shadow-xs"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List of Payments */}
            {(() => {
              const filtered = paymentsList.filter((p) => {
                if (paymentFilterStatus === "ALL") return true;
                return p.status === paymentFilterStatus;
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-2xs space-y-3">
                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="font-extrabold text-sm text-gray-800">Tidak ada data verifikasi pembayaran</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      {paymentFilterStatus === "PENDING"
                        ? "Bagus! Seluruh bukti transfer pelanggan telah selesai diverifikasi."
                        : "Belum ada bukti pembayaran yang sesuai dengan filter yang dipilih."}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-gray-400 block uppercase">
                              Pesanan #{item.orderCode || item.orderId}
                            </span>
                            <h3 className="font-extrabold text-sm text-gray-900 mt-0.5">
                              {item.customerName || "Pelanggan Cetak.inc"}
                            </h3>
                            {item.customerPhone && (
                              <p className="text-[11px] text-gray-500 font-mono">{item.customerPhone}</p>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              item.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.status === "REJECTED"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {item.status === "VERIFIED"
                              ? "LUNAS / TERVERIFIKASI"
                              : item.status === "REJECTED"
                              ? "DITOLAK"
                              : "MENUNGGU VERIFIKASI"}
                          </span>
                        </div>

                        <div className="flex items-start gap-4">
                          {item.proofUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProofUrl(item.proofUrl)}
                              className="relative group shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 hover:ring-2 hover:ring-[#F97316] transition-all"
                              title="Klik untuk melihat bukti transfer ukuran penuh"
                            >
                              <img
                                src={item.proofUrl}
                                alt="Bukti Transfer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye size={16} />
                              </div>
                            </button>
                          ) : (
                            <div className="w-24 h-24 rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 text-center p-2 shrink-0">
                              Tanpa Bukti Foto
                            </div>
                          )}

                          <div className="space-y-1.5 text-xs flex-1">
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Nominal Transfer:</span>
                              <span className="text-base font-black text-[#0B1E36]">
                                Rp {item.amount?.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-600">
                              <p><strong>Bank:</strong> {item.senderBank || "Transfer Bank / QRIS"}</p>
                              {item.senderName && <p><strong>Pengirim:</strong> {item.senderName}</p>}
                              {item.notes && <p className="italic text-gray-500">"{item.notes}"</p>}
                            </div>
                            <p className="text-[10px] text-gray-400">
                              Dikirim: {new Date(item.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          </div>
                        </div>

                        {item.status === "REJECTED" && item.rejectReason && (
                          <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-[11px] text-red-700">
                            <strong>Alasan Penolakan:</strong> {item.rejectReason}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                        <a
                          href={`/invoice/${item.orderCode || item.orderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <FileText size={13} /> Buka Invoice
                        </a>

                        {item.customerPhone && (
                          <a
                            href={`https://wa.me/${String(item.customerPhone).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Halo Kak ${item.customerName}, mengenai pembayaran pesanan Cetak.inc #${item.orderCode || item.orderId}...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Phone size={13} /> Chat WA
                          </a>
                        )}

                        {item.status === "PENDING" && (
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingPayment(item);
                                setRejectReasonInput("");
                              }}
                              className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(item)}
                              disabled={verifyingPaymentId === item.id}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs"
                            >
                              {verifyingPaymentId === item.id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}
                              Verifikasi Lunas
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {/* ========================================================= */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col my-auto">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto sm:hidden mt-2.5 shrink-0" />

            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {prodModalMode === "add" ? "Tambah Produk Baru" : "Edit Detail Produk"}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Perubahan langsung terhubung dan tersimpan ke database live Supabase.
                </p>
              </div>
              <button
                onClick={() => setIsProdModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-4 sm:p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk Cetak *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Spanduk Flexi Korea 440g (Higres Tebal)"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Satuan Harga</label>
                  <input
                    type="text"
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    placeholder="/ pcs, / box, / rim, / meter..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga Jual (Angka Rupiah) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodForm.price || ""}
                    onChange={(e) => setProdForm({ ...prodForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-orange-600 focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga Coret / Normal (Opsional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Kosongkan jika tidak ada diskon"
                    value={prodForm.compareAtPrice}
                    onChange={(e) => setProdForm({ ...prodForm, compareAtPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-500 focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Upload Gambar */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Foto / URL Gambar Produk *</label>
                <div className="flex gap-2 items-center">
                  {prodForm.imageUrl ? (
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs">
                      <Image
                        src={prodForm.imageUrl}
                        alt="Preview"
                        fill
                        unoptimized={prodForm.imageUrl.startsWith("data:")}
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <input
                    type="text"
                    required
                    value={prodForm.imageUrl}
                    onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                    placeholder="Masukkan URL foto atau klik tombol upload..."
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer border border-gray-200"
                  >
                    <Upload size={14} /> {uploadingImage ? "Mengunggah..." : "Upload Foto"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Ringkasan spesifikasi atau kegunaan produk..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Spesifikasi & Keunggulan (Pisahkan dengan Enter)
                </label>
                <textarea
                  rows={3}
                  value={prodForm.specsText}
                  onChange={(e) => setProdForm({ ...prodForm, specsText: e.target.value })}
                  placeholder="Bahan Kraft Food Grade&#10;Tahan Panas & Bocor&#10;Bisa Custom Sablon Full Color"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Toggles for Best Seller and Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setProdForm({ ...prodForm, isBestSeller: !prodForm.isBestSeller })}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-200/60 cursor-pointer transition-colors"
                >
                  <span className="text-xs font-bold text-gray-800">Tandai sebagai Best Seller 🔥</span>
                  <div
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      prodForm.isBestSeller ? "bg-amber-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        prodForm.isBestSeller ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>

                <div
                  onClick={() => setProdForm({ ...prodForm, isActive: !prodForm.isActive })}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-200/60 cursor-pointer transition-colors"
                >
                  <span className="text-xs font-bold text-gray-800">Produk Aktif Tayang di Web</span>
                  <div
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      prodForm.isActive ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        prodForm.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur-sm py-2">
                <button
                  type="button"
                  onClick={() => setIsProdModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                >
                  {prodModalMode === "add" ? "Tambahkan ke Katalog" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL PESANAN */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-400 font-mono">No. Pesanan:</span>
                <h3 className="font-extrabold text-base text-gray-900">{selectedOrder.code}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl text-xs space-y-1.5">
              <div><strong>Nama:</strong> {selectedOrder.customerName}</div>
              <div><strong>WhatsApp:</strong> {selectedOrder.customerPhone}</div>
              <div><strong>Metode:</strong> {selectedOrder.deliveryMethod === "kirim" ? "Kirim ke Alamat" : "Ambil di Toko"}</div>
              {selectedOrder.address && <div><strong>Alamat:</strong> {selectedOrder.address}</div>}
              <div><strong>Pembayaran:</strong> {selectedOrder.paymentMethod}</div>
              {selectedOrder.note && <div><strong>Catatan:</strong> {selectedOrder.note}</div>}
            </div>

            {selectedOrder.courier && (
              <div className="bg-violet-50 border border-violet-200 p-3.5 rounded-2xl text-xs space-y-1">
                <div className="font-extrabold text-violet-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Bike size={15} /> Kurir Pengantaran Aktif:
                  </span>
                  <span className="text-[10px] bg-violet-200/70 text-violet-800 px-2 py-0.5 rounded-full font-black">
                    {selectedOrder.courier.eta || "OTW"}
                  </span>
                </div>
                <div><strong>Driver:</strong> {selectedOrder.courier.name} ({selectedOrder.courier.plate})</div>
                <div><strong>Kontak Driver:</strong> {selectedOrder.courier.phone}</div>
                {selectedOrder.courier.notes && <div><strong>Catatan:</strong> {selectedOrder.courier.notes}</div>}
              </div>
            )}

            <div>
              <h4 className="font-bold text-xs text-gray-700 mb-2">Daftar Item:</h4>
              <div className="space-y-2">
                {selectedOrder.items?.map((it: any) => (
                  <div key={it.id} className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">{it.nameSnapshot}</div>
                      <div className="text-[10px] text-gray-400">
                        {it.qty} {it.unitSnapshot || "pcs"} x Rp {it.priceSnapshot?.toLocaleString("id-ID")}
                      </div>
                      {it.designNote && <div className="text-[10px] text-gray-500 italic">Catatan: {it.designNote}</div>}
                    </div>
                    <div className="font-black text-[#F97316]">
                      Rp {Number(it.total).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-500">Total:</span>
              <span className="text-xl font-black text-[#F97316]">
                Rp {Number(selectedOrder.subtotal).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`/lacak?code=${selectedOrder.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 text-[#F97316] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-orange-200 transition-colors"
                title="Buka Live Tracking Peta Customer"
              >
                <MapPin size={14} /> Peta
              </a>
              <a
                href={`https://wa.me/${String(selectedOrder.customerPhone).replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone size={14} /> WhatsApp
              </a>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DISPATCHER KURIR PENGANTARAN (LIVE MAP SYNC)        */}
      {/* ========================================================= */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Bike size={22} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-violet-600 block">
                    Alokasi Dispatcher Kurir
                  </span>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Kirim Pesanan #{dispatchModalOrder.code}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl text-xs space-y-1">
              <div><strong>Penerima:</strong> {dispatchModalOrder.customerName} ({dispatchModalOrder.customerPhone})</div>
              <div><strong>Alamat Tujuan:</strong> {dispatchModalOrder.address || "Diantar ke alamat pemesan (Kota Padang)"}</div>
              <div><strong>Metode:</strong> {dispatchModalOrder.deliveryMethod === "kirim" ? "Pengiriman Kurir" : "Ambil Sendiri"}</div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Pilih Preset Kurir Cepat:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setDispatchForm({
                      name: "Budi Santoso",
                      phone: "082283995544",
                      plate: "Honda Vario (BA 4821 QA)",
                      eta: "20 Menit",
                      notes: "Kurir Toko Cetak.inc sedang meluncur membawa pesanan Anda",
                    })
                  }
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-violet-500 hover:bg-violet-50/50 text-left transition-all group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-violet-700">🛵 Kurir Toko: Budi</div>
                  <div className="text-[10px] text-gray-400">BA 4821 QA • 20 Menit</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDispatchForm({
                      name: "Rian Pratama",
                      phone: "081266778899",
                      plate: "Yamaha NMAX (BA 3912 PK)",
                      eta: "30 Menit",
                      notes: "Kurir Toko Cetak.inc membawa pesanan dengan box pelindung",
                    })
                  }
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-violet-500 hover:bg-violet-50/50 text-left transition-all group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-violet-700">🛵 Kurir Toko: Rian</div>
                  <div className="text-[10px] text-gray-400">BA 3912 PK • 30 Menit</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDispatchForm({
                      name: "Driver Maxim / GoSend",
                      phone: "081399887766",
                      plate: "Motor Ojol (BA Instant)",
                      eta: "25 Menit",
                      notes: "Pesanan dikirimkan via kurir instan online",
                    })
                  }
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-violet-500 hover:bg-violet-50/50 text-left transition-all group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-violet-700">⚡ Maxim / GoSend</div>
                  <div className="text-[10px] text-gray-400">Kurir Online Instan</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDispatchForm({
                      name: "Ekspedisi J&T / Indah Cargo",
                      phone: "082155443322",
                      plate: "Resi Ekspedisi",
                      eta: "1 - 2 Hari",
                      notes: "Paket telah diserahkan ke counter ekspedisi",
                    })
                  }
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-violet-500 hover:bg-violet-50/50 text-left transition-all group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-violet-700">🚚 Ekspedisi Luar Kota</div>
                  <div className="text-[10px] text-gray-400">J&T / Indah Cargo</div>
                </button>
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Nama Kurir / Driver:
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.name}
                    onChange={(e) => setDispatchForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    No. WhatsApp / HP Kurir:
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.phone}
                    onChange={(e) => setDispatchForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Contoh: 082283995544"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Plat Kendaraan / Resi:
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.plate}
                    onChange={(e) => setDispatchForm((prev) => ({ ...prev, plate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Contoh: BA 4821 QA"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Estimasi Tiba (ETA):
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.eta}
                    onChange={(e) => setDispatchForm((prev) => ({ ...prev, eta: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Contoh: 20 Menit / 15-25 Menit"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Catatan Pengantaran untuk Pelanggan:
                </label>
                <textarea
                  value={dispatchForm.notes}
                  onChange={(e) => setDispatchForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  placeholder="Contoh: Kurir membawa paket spanduk yang sudah digulung rapi"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={dispatchingLoading}
                onClick={handleConfirmDispatch}
                className="flex-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-violet-200 transition-all disabled:opacity-50"
              >
                {dispatchingLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Bike size={15} /> Luncurkan Kurir & Update Peta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREVIEW BUKTI TRANSFER FULL-SCREEN */}
      {/* ========================================================= */}
      {previewProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewProofUrl(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900">Bukti Transfer Pelanggan</h3>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-gray-900 overflow-auto flex items-center justify-center max-h-[70dvh]">
              <img
                src={previewProofUrl}
                alt="Bukti Transfer Penuh"
                className="max-w-full max-h-[65dvh] object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Periksa tanggal, nama rekening, dan nominal transfer.</span>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="px-4 py-2 bg-[#0B1E36] text-white rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TOLAK BUKTI PEMBAYARAN */}
      {/* ========================================================= */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                <AlertCircle className="text-red-500" size={18} /> Tolak Bukti Pembayaran
              </h3>
              <button onClick={() => setRejectingPayment(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-2">
              <p>
                Pesanan <strong>#{rejectingPayment.orderCode || rejectingPayment.orderId}</strong> ({rejectingPayment.customerName})
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Alasan Penolakan (akan ditampilkan ke pelanggan):
                </label>
                <textarea
                  rows={3}
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="Contoh: Nominal transfer kurang dari total tagihan / Struk bukti buram"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-red-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectPayment}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Tolak Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT KATEGORI */}
      {/* ========================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                {catModalMode === "add" ? "Tambah Kategori Baru" : "Edit Kategori"}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Contoh: Outdoor & Signage"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Urutan Tampil (Angka)</label>
                <input
                  type="number"
                  value={catForm.sortOrder}
                  onChange={(e) => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-xs font-bold"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI HAPUS / NONAKTIFKAN PRODUK */}
      {/* ========================================================= */}
      {deleteConfirmProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 pb-2 border-b border-gray-100">
              <div className="p-2.5 bg-red-50 rounded-2xl">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Kelola Produk</h3>
                <p className="text-xs text-gray-400">Pilih tindakan untuk produk ini</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                <Image
                  src={deleteConfirmProd.imageUrl || deleteConfirmProd.img || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"}
                  alt={deleteConfirmProd.name || deleteConfirmProd.title}
                  fill
                  sizes="48px"
                  unoptimized={Boolean((deleteConfirmProd.imageUrl || deleteConfirmProd.img)?.startsWith("data:"))}
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-gray-900 truncate">
                  {deleteConfirmProd.name || deleteConfirmProd.title}
                </div>
                <div className="text-[10px] text-gray-400">
                  {deleteConfirmProd.category} • {deleteConfirmProd.price}
                </div>
                <span
                  className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-bold mt-1 ${
                    deleteConfirmProd.isActive
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {deleteConfirmProd.isActive ? "Sedang Aktif Publik" : "Sedang Nonaktif"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleExecuteDelete(deleteConfirmProd.id, deleteConfirmProd.name || deleteConfirmProd.title, true)}
                className="w-full p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-left flex items-start gap-3 transition-all cursor-pointer shadow-md hover:shadow-lg"
              >
                <div className="p-1.5 bg-white/20 text-white rounded-xl mt-0.5 shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <div className="font-extrabold text-xs sm:text-sm text-white">Hapus Permanen dari Database</div>
                  <div className="text-[10px] sm:text-[11px] text-red-100 leading-tight mt-0.5">
                    Hapus produk sepenuhnya dari sistem database Supabase. Produk langsung hilang dari admin dan web utama.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteDelete(deleteConfirmProd.id, deleteConfirmProd.name || deleteConfirmProd.title, false)}
                className="w-full p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left flex items-start gap-3 transition-all cursor-pointer"
              >
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-xl mt-0.5 shrink-0">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-900">Sembunyikan Saja (Nonaktifkan)</div>
                  <div className="text-[10px] text-amber-700 leading-tight mt-0.5">
                    Produk disembunyikan dari web utama pembeli, tetapi data tetap tersimpan di tabel admin.
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmProd(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT BANNER PROMO */}
      {/* ========================================================= */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                {bannerModalMode === "add" ? "Tambah Banner Promo Baru" : "Edit Banner Promo"}
              </h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBannerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Banner *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Contoh: Diskon Kilat Spesial Cafe 25%"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle / Deskripsi Singkat</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="Contoh: Paket lengkap cup, kemasan dan apron barista"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Upload Gambar Banner */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Gambar Banner Promo *</label>
                <div className="space-y-2">
                  {bannerForm.imageUrl && (
                    <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-2xs">
                      <Image
                        src={bannerForm.imageUrl}
                        alt="Preview Banner"
                        fill
                        unoptimized={bannerForm.imageUrl.startsWith("data:")}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={bannerForm.imageUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                      placeholder="Masukkan URL gambar atau klik Upload..."
                      className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                    <input
                      type="file"
                      ref={bannerFileInputRef}
                      onChange={handleBannerFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      disabled={uploadingBannerImage}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Upload size={14} /> {uploadingBannerImage ? "Mengunggah..." : "Upload Foto"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Label Tombol CTA</label>
                  <input
                    type="text"
                    value={bannerForm.ctaLabel}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLabel: e.target.value })}
                    placeholder="Contoh: Pesan Sekarang"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Link Tujuan CTA</label>
                  <input
                    type="text"
                    value={bannerForm.ctaHref}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaHref: e.target.value })}
                    placeholder="Contoh: /produk?category=Packaging"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Urutan Tampil (Angka)</label>
                  <input
                    type="number"
                    value={bannerForm.sortOrder}
                    onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#F97316] rounded-md border-gray-300 focus:ring-[#F97316]"
                    />
                    <span className="text-xs font-bold text-gray-700">Aktifkan di Beranda</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  Simpan Banner Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT INSPIRASI HASIL CETAK */}
      {/* ========================================================= */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#F97316]" />
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  {portfolioModalMode === "add" ? "Tambah Inspirasi Cetak Baru" : "Edit Inspirasi Hasil Cetak"}
                </h3>
              </div>
              <button onClick={() => setIsPortfolioModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePortfolioSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Inspirasi / Hasil Cetak *</label>
                <input
                  type="text"
                  required
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="Contoh: Coffee & Cafe Packaging Collection"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategori / Tag Layanan *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Packaging", "Signage", "Stationery", "Event & Banner", "Apparel & Merch", "Stiker & Label"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPortfolioForm({ ...portfolioForm, category: cat })}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        portfolioForm.category === cat
                          ? "bg-orange-50 border-orange-300 text-orange-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={portfolioForm.category}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })}
                  placeholder="Pilih atau ketik kategori baru..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Klien / Nama Brand (Opsional)</label>
                  <input
                    type="text"
                    value={portfolioForm.client}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, client: e.target.value })}
                    placeholder="Contoh: Kopi Janji Padang"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat (Opsional)</label>
                  <input
                    type="text"
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                    placeholder="Contoh: Standing pouch ziplock & cup hot/cold"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Upload Foto Inspirasi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Foto Portofolio Cetak *</label>
                <div className="space-y-2">
                  {portfolioForm.imageUrl && (
                    <div className="relative aspect-4/3 max-h-[180px] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-2xs">
                      <Image
                        src={portfolioForm.imageUrl}
                        alt="Preview Foto Inspirasi"
                        fill
                        unoptimized={portfolioForm.imageUrl.startsWith("data:")}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={portfolioForm.imageUrl}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, imageUrl: e.target.value })}
                      placeholder="Masukkan URL foto atau klik Upload..."
                      className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                    <input
                      type="file"
                      ref={portfolioFileInputRef}
                      onChange={handlePortfolioFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => portfolioFileInputRef.current?.click()}
                      disabled={uploadingPortfolioImage}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Upload size={14} /> {uploadingPortfolioImage ? "Mengunggah..." : "Upload Foto"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Urutan Tampil (Angka)</label>
                  <input
                    type="number"
                    value={portfolioForm.sortOrder}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={portfolioForm.isActive}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#F97316] rounded-md border-gray-300 focus:ring-[#F97316]"
                    />
                    <span className="text-xs font-bold text-gray-700">Tampilkan di Beranda</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  {portfolioModalMode === "add" ? "Tambahkan Inspirasi" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT WORKSHOP HUB (Fase 2 Blueprint V2) */}
      {/* ========================================================= */}
      {isHubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col my-auto">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                <Building2 className="text-[#F97316]" size={18} />
                {hubModalMode === "add" ? "Tambah Workshop Hub Baru" : "Edit Data Workshop Hub"}
              </h2>
              <button onClick={() => setIsHubModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHubSubmit} className="p-4 sm:p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Workshop / Cabang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hub Lubuk Buaya (Workshop Cabang)"
                  value={hubForm.name}
                  onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Lengkap Workshop *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. Adinegoro No. 88, Lubuk Buaya..."
                  value={hubForm.address}
                  onChange={(e) => setHubForm({ ...hubForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={hubForm.lat}
                    onChange={(e) => setHubForm({ ...hubForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={hubForm.lng}
                    onChange={(e) => setHubForm({ ...hubForm, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Radius Layanan (km)</label>
                  <input
                    type="number"
                    value={hubForm.maxRadiusKm}
                    onChange={(e) => setHubForm({ ...hubForm, maxRadiusKm: parseInt(e.target.value) || 15 })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kapasitas Harian (order)</label>
                  <input
                    type="number"
                    value={hubForm.dailyCapacity}
                    onChange={(e) => setHubForm({ ...hubForm, dailyCapacity: parseInt(e.target.value) || 50 })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={hubForm.whatsapp}
                    onChange={(e) => setHubForm({ ...hubForm, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={hubForm.phone}
                    onChange={(e) => setHubForm({ ...hubForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan / Spesialisasi Workshop</label>
                <input
                  type="text"
                  placeholder="Contoh: Fokus Spanduk Outdoor & Stiker A3+"
                  value={hubForm.notes}
                  onChange={(e) => setHubForm({ ...hubForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hubForm.isOpen}
                    onChange={(e) => setHubForm({ ...hubForm, isOpen: e.target.checked })}
                    className="w-4 h-4 text-[#F97316] rounded-md border-gray-300 focus:ring-[#F97316]"
                  />
                  <span className="text-xs font-bold text-gray-700">Workshop Buka Sekarang</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hubForm.isActive}
                    onChange={(e) => setHubForm({ ...hubForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#F97316] rounded-md border-gray-300 focus:ring-[#F97316]"
                  />
                  <span className="text-xs font-bold text-gray-700">Aktifkan Hub</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsHubModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  Simpan Data Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
