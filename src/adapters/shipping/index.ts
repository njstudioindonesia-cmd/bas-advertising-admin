import { ShippingProvider } from "./types";
import { InternalTariffShippingProvider } from "./internal-tariff";
import { ManualQuoteShippingProvider } from "./manual-quote";
import { GoSendShippingProvider } from "./gosend";

export * from "./types";
export * from "./internal-tariff";
export * from "./manual-quote";
export * from "./gosend";

const providers: Record<string, ShippingProvider> = {
  "internal-tariff": new InternalTariffShippingProvider(),
  "manual-quote": new ManualQuoteShippingProvider(),
  gosend: new GoSendShippingProvider(),
};

export function getShippingProvider(id = "internal-tariff"): ShippingProvider {
  return providers[id] || providers["internal-tariff"];
}
