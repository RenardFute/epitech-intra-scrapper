import { fetchModules } from "./intra/modules"
import { Promo } from "./sql/objects/sourceUser"

(async () => {
  await fetchModules(Promo.TEK_2)
})();
