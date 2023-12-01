import "./discord/index"
import { activitiesScrap, startSchedulers } from "./schedulers"

// ------ DEV ------

(async () => {
  if (process.env.NODE_ENV === "development") {
    isDev = true
    activitiesScrap().then()
  } else {
    startSchedulers()
  }
})()

export let isDev = false

