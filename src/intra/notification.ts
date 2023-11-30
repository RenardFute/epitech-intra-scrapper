import SourceUser from "../sql/objects/sourceUser"
import { ElementHandle, NodeFor, Page } from "puppeteer"
import Notification from "../sql/objects/notifications/notification"
import { exportTextContentOrNA } from "./utils"
import MarkNotification from "../sql/objects/notifications/markNotification"
import dayjs from "dayjs"
import Activity from "../sql/objects/activity"
import assert from "assert"
import { email } from "../utils/types"

const parseDate = (date: string[]): Date => {
  let final = dayjs()
  const dayRegex = /(\d+) jours?/
  const hourRegex = /(\d+) heures?/
  const minuteRegex = /(\d+) minutes?/
  for (const d of date) {
    if (hourRegex.test(d)) {
      const hour = parseInt(d.match(hourRegex)![1])
      final = final.subtract(hour, "hours")
    } else if (minuteRegex.test(d)) {
      const minute = parseInt(d.match(minuteRegex)![1])
      final = final.subtract(minute, "minutes")
    } else if (dayRegex.test(d)) {
      const day = parseInt(d.match(dayRegex)![1])
      final = final.subtract(day, "days")
    }
  }
  return final.toDate()
}

type markDTO = {
  title: string,
  login: email,
  user_title: string,
  picture: string,
  all_members: string,
  status: "present" | "missing",
  note: number | null,
  comment: string | null,
  editable: boolean,
  type: "Group",
  grader: email,
  date: string,
  members: unknown[],
  group_title: string,
  group_master: string,
  member_status: "confirmed"
}

async function parseNotification(notificationElement: ElementHandle<NodeFor<".notices .item">>, user: SourceUser): Promise<Notification | null> {
  const clazz = await notificationElement.$eval(".first", (el) => el.className)
  const id = await notificationElement.$eval(".first", (el) => el.dataset.id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const title = await exportTextContentOrNA(notificationElement, ".first .title")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const description = await exportTextContentOrNA(notificationElement, ".first .content")
  const date = parseDate((await notificationElement.$eval(".first .links .date", (el) => el.textContent)).replace("Il y a ", "").trim().split(" et "))
  if (!id) {
    return null
  }
  let notification: Notification | null = null
  if (clazz.indexOf("note") > -1) {
    notification = new MarkNotification()
    assert(notification instanceof MarkNotification)
    const name = await exportTextContentOrNA(notificationElement, ".first .title a")
    const url = await notificationElement.$eval(".first .title a", (el) => el.href)
    const activity: Activity | null = await user.getActivityFromName(name)
    if (!activity) {
      return null
    }
    notification.title = "Nouvelle note !"
    notification.message = "Vous avez une nouvelle note sur " + activity.name + " !"
    notification.jsonData.activityId = activity.id

    const page = await user.openPage(url)
    // Get all javascript blocks
    const block = await page.$x('//script[contains(., "module.activite.note")]')
    if (block.length === 0) {
      return null
    }
    const content = await page.evaluate((el) => el.textContent, block[0])
    // Get the one that contains the mark
    const items = content.split("items: ")[1].split(",\n")[0]
    const json = JSON.parse(items) as markDTO[]
    const mark = json.find((m) => m.note !== null)
    if (!mark) {
      return null
    }
    mark.comment = mark.comment!.trim()
    notification.jsonData.mark = mark.note!
    notification.jsonData.grader = mark.grader!
    if (mark.comment.startsWith("Progress")) {
      const progressRegex = /Progress \((\d+) \/ 100\) :/
      const progress = mark.comment.match(progressRegex)
      if (progress) {
        notification.jsonData.progress = parseInt(progress[1])
      }
      mark.comment = mark.comment.replace(progressRegex, "").trim()
    }
    notification.jsonData.comment = mark.comment
    notification.createdAt = dayjs(mark.date, "YYYY-MM-DD HH:mm:ss").toDate()
    await page.close()
  }

  if (notification) {
    notification.id = parseInt(id)
    if (notification.createdAt.getFullYear() === 1970)
      notification.createdAt = date
    notification.userId = user.discordUserId
  }
  return Promise.resolve(notification)
}

export const fetchNotificationForUser = async (user: SourceUser): Promise<Notification[]> => {
  const page: Page = await user.openPage("https://intra.epitech.eu")
  const activitiesElements = await page.$$(".notices .item")
  const temp = activitiesElements.map(async (activityElement) => {
    return await parseNotification(activityElement, user)
  })
  const notifications : Notification[] = (await Promise.all(temp)).filter((n) => n !== null) as Notification[]
  await page.close()
  return notifications
}
