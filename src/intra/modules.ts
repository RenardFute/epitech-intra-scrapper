import SourceUser, { openPageForPromo, Promo } from "../sql/objects/sourceUser"
import { ElementHandle, Page } from "puppeteer"
import {
  cityMapping,
  exportNumberContentOrNA,
  exportTextContentOrNA,
  getTextContentOrNA, parseDateOrNA
} from "./utils"
import Module from "../sql/objects/module"

const findIndexes = async (modulesPage: Page) => {
  const headers = await modulesPage.$$("thead th")
  const indexes: {[key: string]: number} = {
    city: -1,
    code: -1,
    credits: -1,
    end: -1,
    flags: -1,
    name: -1,
    registrationStatus: -1,
    semester: -1,
    start: -1,
    endRegistration: -1
  }

  for (const header of headers) {
    const text = await header.evaluate((el) => el.textContent)
    if (text === "Ville") {
      indexes.city = headers.indexOf(header)
    } else if (text === "Code") {
      indexes.code = headers.indexOf(header)
    } else if (text === "Crédits") {
      indexes.credits = headers.indexOf(header)
    } else if (text === "Fin") {
      indexes.end = headers.indexOf(header)
    } else if (text === "Flags") {
      indexes.flags = headers.indexOf(header)
    } else if (text === "module") {
      indexes.name = headers.indexOf(header)
    } else if (text === "Inscription") {
      indexes.registrationStatus = headers.indexOf(header)
    } else if (text === "Semestre") {
      indexes.semester = headers.indexOf(header)
    } else if (text === "Début") {
      indexes.start = headers.indexOf(header)
    } else if (text === "fin d'inscription") {
      indexes.endRegistration = headers.indexOf(header)
    }
  }
  for (const index of Object.keys(indexes)) {
    if (indexes[index] === -1) {
      console.error("Missing index for " + index)
    } else {
      indexes[index]++
    }
  }
  return indexes
}

const parseModule = async (moduleElement: ElementHandle, user: SourceUser, indexes: {
  [p: string]: number
}): Promise<Module> => {
  const clazz = await moduleElement.evaluate((el) => el.className)
  const nameFull = await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.name})`)
  const name = nameFull.substring(nameFull.indexOf("-") + 1).replace('Roadblock -', '').trim()
  const semester = await exportNumberContentOrNA(moduleElement, `:nth-child(${indexes.semester})`)
  const code = await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.code})`)
  const start = parseDateOrNA((await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.start})`)).substring(4), "D MMM YYYY", true)
  const endRegistration = parseDateOrNA((await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.endRegistration})`)).substring(4), "D MMM YYYY", true)
  const end = parseDateOrNA((await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.end})`)).substring(4), "D MMM YYYY", true)
  const city = await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.city})`)
  const credits = await exportNumberContentOrNA(moduleElement, `:nth-child(${indexes.credits})`)
  const flags = (await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.flags})`)).split(", ")
  const registrationStatus = await exportTextContentOrNA(moduleElement, `:nth-child(${indexes.registrationStatus})`)
  const year = Math.floor(user.year + ((Math.max(semester - 1, 0)) * 0.5))
  const url = "https://intra.epitech.eu/module/" + year + "/" + code + "/"+ cityMapping[city] +"-" + semester + "-1/#!/all"
  const id = Module.computeId(code, semester, year, start, city)

  if (isNaN(id)) {
    console.error("Invalid module id for " + nameFull)
    console.log(name, semester, code, start, city, year)
  }

  return new Module().fromJson({
    city,
    credits,
    end,
    endRegistration: endRegistration.toString() === "Invalid Date" ? null : endRegistration,
    id,
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
  })
}

export const fetchModulesForPromo = async (promo: Promo): Promise<Module[]> => {
  const page: { page: Page, user: SourceUser } = await openPageForPromo(promo, "https://intra.epitech.eu/module/board/resume")
  const modulesElements = await page.page.$$("tbody tr")
  const temp = modulesElements.map(async (moduleElement) => {
    // Skip the first element since it's the header
    if (await getTextContentOrNA(await moduleElement.$(":nth-child(9)")) === "N/A") {
      return null
    }
    return await parseModule(moduleElement, page.user, await findIndexes(page.page))
  })
  const modules : Module[] = (await Promise.all(temp)).filter((m) => m !== null) as Module[]
  await page.page.close()
  return modules
}
