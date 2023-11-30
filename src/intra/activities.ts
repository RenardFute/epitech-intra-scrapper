import SourceUser, { openPageForPromo } from "../sql/objects/sourceUser"
import { ElementHandle, Page } from "puppeteer"
import {
  exportDateContentOrNA,
  exportTextContentOrNA
} from "./utils"
import Module from "../sql/objects/module"
import Activity from "../sql/objects/activity"

const parseActivity = async (activityElement: ElementHandle, module: Module): Promise<Activity> => {
  const clazz = await activityElement.evaluate((el) => el.className)
  const name = await exportTextContentOrNA(activityElement, ".acti-title")
  const start = await exportDateContentOrNA(activityElement, ".main .date span:not(.icon)", "DD/MM/YYYY, HH[h]mm")
  const end = await exportDateContentOrNA(activityElement, ".main div:nth-of-type(2):is(.date) span:not(.icon)", "DD/MM/YYYY, HH[h]mm")
  const location = await exportTextContentOrNA(activityElement, ".main .location .label")
  let description = (await exportTextContentOrNA(activityElement, ".main .description")).trim()
  const url: string = await activityElement.$(".links .view a").then((el) => el?.evaluate((el) => el.href))
  const mandatory = await activityElement.$(".main .mandatory").then((el) => el?.evaluate((el) => el.className))

  description = description.replace("Description de l'activité", "").trim()
  description = description.replaceAll("\t", "").trim()
  description = description.replace(/\n+/gm, "\n").trim()

  // Computed values
  const now = new Date()
  const isOngoing = now >= start && now < end

  return new Activity().fromJson({
    description,
    end,
    hasMeeting: clazz.indexOf('is-rdv') > -1 || clazz.indexOf('has-rdv') > -1,
    id: Activity.computeId(name, module, url),
    isGraded: clazz.indexOf('is-note') > -1,
    isMandatory: mandatory.indexOf('required') > 0,
    isOngoing,
    isProject: clazz.indexOf('is-proj') > -1 || clazz.indexOf('has-proj') > -1,
    location,
    moduleId: module.id,
    name,
    start,
    url
  })
}

export const fetchActivitiesForModule = async (module: Module): Promise<Activity[]> => {
  const binding: { page: Page, user: SourceUser } = await openPageForPromo(module.promo, module.url)
  const activitiesElements = await binding.page.$$(".activite")
  const temp = activitiesElements.map(async (activityElement) => {
    return await parseActivity(activityElement, module)
  })
  const activities : Activity[] = (await Promise.all(temp)).filter((m) => m !== null) as Activity[]
  await binding.page.close()
  return activities
}
