import {
  detailedModuleCodec,
  detailedModuleDTO, detailedProjectCodec,
  detailedProjectDTO,
  moduleCodec,
  moduleDTO,
  RoomCodec,
  RoomDTO
} from "./dto"
import SourceUser from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import { isRight } from "fp-ts/Either"
import * as t from 'io-ts'
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import Activity from "../sql/objects/activity"
dayjs.extend(timezone)
dayjs.extend(utc)

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

export const fetchRoomsForDay = async (date: Date): Promise<RoomDTO[]> => {
  const dateFormatted = dayjs(date).tz("Europe/Paris").format("YYYY-MM-DD")
  const url ="https://api.oros.dahobul.com/rooms-activities?from=" + dateFormatted + "&to=" + dateFormatted
  const r = await fetch(url)

  const json = await r.json()
  const result = t.array(RoomCodec).decode(json)
  if (isRight(result)) {
    return result.right
  } else {
    console.error("Validation failed", result.left.map((e) => e.context))
    throw new Error("Invalid API response")
  }
}
