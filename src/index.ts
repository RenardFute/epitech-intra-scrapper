import "./discord/index"
import { startSchedulers } from "./schedulers"

// ------ DEV ------

(async () => {
  if (process.env.NODE_ENV === "development") {
    isDev = true
  } else {
    startSchedulers()
  }
})()

export let isDev = false

