import { openPageForPromo, Promo } from "../sql/objects/sourceUser"
import { Page } from "puppeteer"

export const fetchModules = async (promo: Promo): Promise<any> => {
  const page: Page = await openPageForPromo(promo, "https://intra.epitech.eu/module/board/resume")
  const modulesElements = await page.$$("tbody tr")
  console.log(modulesElements)
}
