import SourceUser from "../sql/objects/sourceUser"
import Module from "../sql/objects/module"
import Activity from "../sql/objects/activity"
import connector from "../sql/connector"
import { fetchProjectForUser } from "./scrappers"
import { detailedProjectDTO } from "./dto"
import dayjs from "dayjs"
import Project from "../sql/objects/project"
import { isDev } from "../index"

const parseProject = async (dto: detailedProjectDTO, activity: Activity, _module: Module): Promise<Project> => {
  const name = dto.title
  const begin = dayjs(dto.begin, "YYYY-MM-DD HH:mm:ss").toDate()
  const end = dayjs(dto.end, "YYYY-MM-DD HH:mm:ss").toDate()
  const endRegister = dto.end_register ? dayjs(dto.end_register, "YYYY-MM-DD HH:mm:ss").toDate() : null
  const deadline = dto.deadline ? dayjs(dto.deadline, "YYYY-MM-DD HH:mm:ss").toDate() : null
  const maxGroupSize = dto.nb_max
  const minGroupSize = dto.nb_min


  return new Project().fromJson({
    activity: activity.id,
    name,
    begin,
    end,
    endRegister,
    deadline,
    maxGroupSize,
    minGroupSize
  })
}

export const scrapProjectForActivity = async (activity: Activity): Promise<Project | null> => {
  const module = activity.module instanceof Module ? activity.module : await connector.getOne(Module, { id: activity.module })
  if (!module) {
    if (isDev)
      console.error("No module found for activity", activity.id)
    return null
  }
  const user = await connector.getOne(SourceUser, { promo: module.promo, disabled: false })
  if (!user) {
    if (isDev)
      console.error("No user found for module", module.id)
    return null
  }
  const dto = await fetchProjectForUser(user, activity)
  return await parseProject(dto, activity, module)
}
