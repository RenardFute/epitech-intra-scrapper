import { SqlBoolean, SqlJson, SqlType } from "../../connector"
import { IdOf } from "../../../utils/types"
import SourceUser from "../sourceUser"
import MarkNotification from "./markNotification"

export enum NotificationType {
  GROUP_VALIDATED = "GROUP_VALIDATED",
  NEW_MARK = "NEW_MARK",
  INSCRIPTION_OPEN = "INSCRIPTION_OPEN",
  CUSTOM = "CUSTOM"
}

export const getNotificationTypeFromEnum = (type: NotificationType): typeof Notification => {
  switch (type) {
    case NotificationType.NEW_MARK:
      return MarkNotification
    default:
      return Notification
  }
}

export default abstract class Notification extends SqlType {
  id: number
  userId: IdOf<SourceUser>
  title: string
  message: string
  notified: SqlBoolean
  createdAt: Date
  jsonData?: SqlJson
  notificationType: NotificationType


  static databaseName = "notifications"

  protected constructor() {
    super()
    this.id = 0
    this.userId = ""
    this.title = ""
    this.message = ""
    this.notified = false
    this.createdAt = new Date("1970-01-01")
    this.jsonData = undefined
    this.notificationType = NotificationType.CUSTOM
  }

  public equals(other: Notification): boolean {
    let tmp = this.id === other.id &&
      this.userId === other.userId &&
      this.title === other.title &&
      this.message === other.message &&
      this.createdAt.getTime() === other.createdAt.getTime() &&
      this.notificationType === other.notificationType
    if (this.jsonData && other.jsonData) {
      if (typeof this.jsonData === "string" && typeof other.jsonData === "string") {
        tmp = tmp && this.jsonData === other.jsonData
      } else if (typeof this.jsonData === "object" && typeof other.jsonData === "object") {
        tmp = tmp && JSON.stringify(this.jsonData) === JSON.stringify(other.jsonData)
      } else if (typeof this.jsonData === "string" && typeof other.jsonData === "object") {
        tmp = tmp && this.jsonData === JSON.stringify(other.jsonData)
      } else if (typeof this.jsonData === "object" && typeof other.jsonData === "string") {
        tmp = tmp && JSON.stringify(this.jsonData) === other.jsonData
      } else {
        tmp = false
      }
    }
    return tmp
  }

  public fromJson(json: any): Notification {
    this.id = json.id
    this.userId = json.userId
    this.title = json.title
    this.message = json.message
    this.notified = json.notified
    this.createdAt = new Date(json.createdAt)
    this.notificationType = json.notificationType
    this.jsonData = json.jsonData
    return this
  }
}
