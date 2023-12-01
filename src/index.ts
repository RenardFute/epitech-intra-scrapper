import "./discord/index"
import { modulesScrap, startSchedulers } from "./schedulers"

// ------ DEV ------

export let isDev = false

if (process.env.NODE_ENV === "development") {
  isDev = true
  modulesScrap().then()
} else {
  startSchedulers()
}
