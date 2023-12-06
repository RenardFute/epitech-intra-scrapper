import "./discord/index"
import { startSchedulers } from "./schedulers"

/**
 * Is the current environment a development environment
 * @type {boolean}
 * @constant
 * @default false
 * @category Environment
 *
 * @since 1.0.0
 * @author Axel ECKENBERG
 */
export const isDev: boolean = process.env.NODE_ENV === "development" ?? false

if (!isDev) {
  startSchedulers().then()
}
