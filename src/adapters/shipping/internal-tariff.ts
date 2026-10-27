import { ShippingProvider, ShippingQuoteInput, ShippingQuoteResult } from "./types";
import { getActiveRoutingProvider } from "../routing";
import { getShippingTariffByHub } from "@/modules/tariffs";

export class InternalTariffShippingProvider implements ShippingProvider {
  id = "internal-tariff";
  name = "Kurir Internal Workshop Cetak.inc";

  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult | null> {
    // 1. Ambil pengaturan tarif dinamis untuk Hub ini dari database/service
    const tariff = await getShippingTariffByHub(input.hubId);
    const baseFee = tariff?.baseFee ?? 8000;
    const perKm = tariff?.perKm ?? 2500;
    const minFee = tariff?.minFee ?? 8000;
    const maxKm = tariff?.maxKm ?? 25;
    const freeOver = tariff?.freeOver ?? 300000;

    // 2. Hitung jarak dan durasi rute (dengan fallback otomatis ke Haversine jika OSRM mati)
    const router = getActiveRoutingProvider();
    const route = await router.calculateRoute(input.from, input.to);

    // 3. Cek batas maksimal jangkauan pengantaran
    if (route.distanceKm > maxKm) {
      return null;
    }

    // 4. Periksa apakah memenuhi syarat gratis ongkir promo
    if (input.subtotal && freeOver && input.subtotal >= freeOver) {
      return {
        providerId: this.id,
        price: 0,
        etaMin: route.durationMin,
        label: `Kurir Internal (${route.distanceKm} km — Promo Gratis Ongkir)`,
        distanceKm: route.distanceKm,
        isFreeShipping: true,
      };
    }

    // 5. Hitung tarif: base fee (untuk 2 km pertama) + jarak tambahan × per_km
    const extraKm = Math.max(0, route.distanceKm - 2);
    const rawPrice = baseFee + extraKm * perKm;

    // Bulatkan ke atas ke kelipatan Rp 500 terdekat
    const roundedPrice = Math.max(minFee, Math.ceil(rawPrice / 500) * 500);

    return {
      providerId: this.id,
      price: roundedPrice,
      etaMin: route.durationMin,
      label: `Kurir Internal Percetakan (${route.distanceKm} km)`,
      distanceKm: route.distanceKm,
      isFreeShipping: false,
    };
  }
}
