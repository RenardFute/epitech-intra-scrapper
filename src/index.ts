import "./discord/index"
import { notificationScrap, startSchedulers } from "./schedulers"

// ------ DEV ------

export let isDev = false

if (process.env.NODE_ENV === "development") {
  isDev = true
  notificationScrap().then()
} else {
  startSchedulers()
}
