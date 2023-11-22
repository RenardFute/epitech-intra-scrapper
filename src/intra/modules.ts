import SourceUser, { openPageForPromo, Promo } from "../sql/objects/sourceUser"
import { ElementHandle, Page } from "puppeteer"
import {
  cityMapping,
  exportNumberContentOrNA,
  exportTextContentOrNA,
  getTextContentOrNA, parseDateOrNA
} from "./utils"
import Module from "../sql/objects/module"

const parseModule = async (moduleElement: ElementHandle, user: SourceUser): Promise<Module> => {
  const clazz = await moduleElement.evaluate((el) => el.className)
  const nameFull = await exportTextContentOrNA(moduleElement, ":nth-child(9)")
  const name = nameFull.substring(nameFull.indexOf("-") + 1).trim()
  const semester = await exportNumberContentOrNA(moduleElement, ":nth-child(2)")
  const code = await exportTextContentOrNA(moduleElement, ":nth-child(10)")
  const start = parseDateOrNA((await exportTextContentOrNA(moduleElement, ":nth-child(4)")).substring(4), "D MMM YYYY", true)
  const endRegistration = parseDateOrNA((await exportTextContentOrNA(moduleElement, ":nth-child(5)")).substring(4), "D MMM YYYY", true)
  const end = parseDateOrNA((await exportTextContentOrNA(moduleElement, ":nth-child(6)")).substring(4), "D MMM YYYY", true)
  const city = await exportTextContentOrNA(moduleElement, ":nth-child(11)")
  const credits = await exportNumberContentOrNA(moduleElement, ":nth-child(8)")
  const flags = (await exportTextContentOrNA(moduleElement, ":nth-child(7)")).split(", ")
  const registrationStatus = await exportTextContentOrNA(moduleElement, ":nth-child(3)")
  const year = Math.floor(user.year + ((Math.max(semester - 1, 0)) * 0.5))
  const url = "https://intra.epitech.eu/module/" + year + "/" + code + "/"+ cityMapping[city] +"-" + semester + "-1/#!/all"

  return {
    city,
    credits,
    end,
    endRegistration: endRegistration.toString() === "Invalid Date" ? null : endRegistration,
    id: Module.computeId(code, semester, year, start, city),
    isOngoing: clazz.indexOf('ongoing') > -1,
    isRegistrationOpen: registrationStatus !== "Closed",
    isRoadblock: flags.indexOf("barrage sur l'année") > -1,
    isMandatory: flags.indexOf("inscription requise") > -1,
    promo: user.promo,
    start,
    year,
    code,
    nameFull,
    name,
    semester,
    url
  }
}

export const fetchModulesForPromo = async (promo: Promo): Promise<Module[]> => {
  const page: { page: Page, user: SourceUser } = await openPageForPromo(promo, "https://intra.epitech.eu/module/board/resume")
  const modulesElements = await page.page.$$("tbody tr")
  const temp = modulesElements.map(async (moduleElement) => {
    // Skip the first element since it's the header
    if (await getTextContentOrNA(await moduleElement.$(":nth-child(9)")) === "N/A") {
      return null
    }
    return await parseModule(moduleElement, page.user)
  })
  const modules : Module[] = (await Promise.all(temp)).filter((m) => m !== null) as Module[]
  await page.page.close()
  return modules
}
