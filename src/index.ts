import "./discord/index"
import { startSchedulers } from "./schedulers"

export const isDev = process.env.NODE_ENV === "development"

if (!isDev) {
  startSchedulers()
}
