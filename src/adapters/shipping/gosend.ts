import { ShippingProvider, ShippingQuoteInput, ShippingQuoteResult } from "./types";

export class GoSendShippingProvider implements ShippingProvider {
  id = "gosend";
  name = "GoSend Instant (API Resmi - Siap Pakai)";

  async quote(_input: ShippingQuoteInput): Promise<ShippingQuoteResult | null> {
    // Adapter ini dinonaktifkan secara default sesuai Bagian 0 Blueprint V2
    // Dapat dihubungkan kapan saja saat kredensial mitra bisnis Gojek tersedia
    return null;
  }
}
