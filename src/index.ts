import "./discord/index"
import { notificationScrap, startSchedulers } from "./schedulers"

// ------ DEV ------

if (process.env.NODE_ENV === "development") {
  notificationScrap().then()
} else {
  startSchedulers()
}
