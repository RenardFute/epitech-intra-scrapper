import Notification, { NotificationType } from "./notification"
import { email, IdOf } from "../../../utils/types"
import Activity from "../activity"

export default class MarkNotification extends Notification {
  notificationType = NotificationType.NEW_MARK
  jsonData: {
    mark: number
    comment: string
    activityId: IdOf<Activity>
    grader: email
    progress?: number
  }

  static getEmptyObject() {
    return new MarkNotification()
  }

  constructor() {
    super()
    this.jsonData = {
      mark: 0,
      comment: "",
      activityId: 0,
      grader: "",
      progress: 0
    }
  }
}
