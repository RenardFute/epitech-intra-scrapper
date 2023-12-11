import {
  activityCodec,
  activityDTO,
  detailedModuleCodec,
  detailedModuleDTO,
  detailedProjectCodec,
  detailedProjectDTO,
  LocationCodec,
  LocationDTO,
  moduleCodec,
  moduleDTO
} from "./dto"
import SourceUser, { Promo } from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import { isRight } from "fp-ts/Either"
import * as t from 'io-ts'
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import Activity from "../sql/objects/activity"
import connector from "../sql/connector"
import SqlFilter, { SqlFieldOperator, SqlFilterField, SqlFilterOperator } from "../sql/sqlFilter"

dayjs.extend(timezone)
dayjs.extend(utc)

export const getUserForPromo = async (promo: Promo): Promise<SourceUser | null> => {
  if (promo === Promo.TEKS) {
    const filter = new SqlFilter(SqlFilterField.from(SourceUser, "promo", "TEK%", SqlFieldOperator.LIKE), SqlFilterOperator.AND, new SqlFilter(SqlFilterField.from(SourceUser, "disabled", false)))
    return await connector.getOne(SourceUser, filter)
  }
  return await connector.getOne(SourceUser, SqlFilter.from(SourceUser,{ promo, disabled: false }))
}

export const fetchModulesForUser = async (user: SourceUser): Promise<moduleDTO[]> => {
  const r = await fetch("https://intra.epitech.eu/course/filter?format=json", {
    headers: {
      "Cookie": "user="+user.cookie,
    }
  })
  const json = await r.json()
  const result = t.array(moduleCodec).decode(json)

  if (isRight(result)) {
    return result.right
  } else {
    console.error("Validation failed", result.left.map((e) => e.context))
    throw new Error("Invalid API response")
  }
}

export const fetchModuleForUser = async (user: SourceUser, module: Module): Promise<detailedModuleDTO> => {
  const r = await fetch(module.url + "?format=json", {
    headers: {
      "Cookie": "user="+user.cookie,
    }
  })
  const json = await r.json()
  const result = detailedModuleCodec.decode(json)
  if (isRight(result)) {
    return result.right
  } else {
    console.error("Validation failed", result.left.map((e) => e.context))
    throw new Error("Invalid API response")
  }
}

export const fetchProjectForUser = async (user: SourceUser, activity: Activity): Promise<detailedProjectDTO> => {
  const r = await fetch(activity.url + "/project?format=json", {
    headers: {
      "Cookie": "user="+user.cookie,
    }
  })
  const json = await r.json()
  const result = detailedProjectCodec.decode(json)
  if (isRight(result)) {
    return result.right
  } else {
    console.error("Validation failed", result.left.map((e) => e.context))
    throw new Error("Invalid API response")
  }
}

export const fetchActivity = async (activity: Activity): Promise<activityDTO | null> => {
  const module = activity.module instanceof Module ? activity.module : await connector.getOne(Module, SqlFilter.from(Module,{ id: activity.module }))
  if (!module) {
    console.error("No module found for activity", activity.id)
    return null
  }
  const user = await getUserForPromo(module.promo)
  if (!user) {
    console.error("No user found for module", module.id)
    return null
  }
  const r = await fetch(activity.url + "?format=json", {
    headers: {
      "Cookie": "user="+user.cookie,
    }
  })
  const json = await r.json()
  const result = activityCodec.decode(json)
  if (isRight(result)) {
    return result.right
  } else {
    console.error("Validation failed", result.left.map((e) => e.context))
    throw new Error("Invalid API response")
  }
}

export const fetchLocations = async (): Promise<Record<string, LocationDTO> | null> => {
  const user = await connector.getOne(SourceUser, SqlFilter.from(SourceUser,{ disabled: false }))
  if (!user) {
    console.error("No user available")
    return null
  }
  const r = await fetch("https://intra.epitech.eu/location.js", {
    headers: {
      "Cookie": "user="+user.cookie,
    }
  })

  const text = await r.text()
  const regex = /window\.locations = (.*);/
  const match = regex.exec(text)
  if (!match) {
    throw new Error("Invalid API response")
  }
  const json = JSON.parse(match[1])
  const result = t.record(t.string, LocationCodec).decode(json)
  if (isRight(result)) {
    return result.right
  } else {
    console.error("Validation failed", result.left.map((e) => e.context))
    throw new Error("Invalid API response")
  }
}
