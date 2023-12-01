import "./discord/index"
import { startSchedulers } from "./schedulers"

export const isDev = process.env.NODE_ENV === "development";

(async () => {
  if (!isDev) {
    startSchedulers()
  }
})()

