import { detailedModuleCodec, detailedModuleDTO, moduleCodec, moduleDTO } from "./dto"
import SourceUser from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import { isRight } from "fp-ts/Either"
import * as t from 'io-ts'

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
