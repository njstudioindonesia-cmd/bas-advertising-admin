import { ShippingProvider, ShippingQuoteInput, ShippingQuoteResult } from "./types";
import { getActiveRoutingProvider } from "../routing";

export class ManualQuoteShippingProvider implements ShippingProvider {
  id = "manual-quote";
  name = "Kurir Pihak Ketiga (GoSend / Maxim / Grab / J&T)";

  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult | null> {
    const router = getActiveRoutingProvider();
    const route = await router.calculateRoute(input.from, input.to);

    return {
      providerId: this.id,
      price: 0, // Dikonfirmasi manual oleh admin
      etaMin: route.durationMin + 15,
      label: "Kurir Eksternal (Estimasi — Total dikonfirmasi admin)",
      distanceKm: route.distanceKm,
    };
  }
}
