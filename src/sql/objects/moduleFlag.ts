import { IdOf } from "../../utils/types"
import Module from "./module"
import { ModuleFlags } from "../../intra/dto"
import { SqlType } from "../connector"

export default class ModuleFlag extends SqlType {
  moduleId: IdOf<Module>
  flag: ModuleFlags

  static databaseName = "module_flags"

  static getEmptyObject() {
    return new Module()
  }

  constructor() {
    super()
    this.moduleId = 0
    this.flag = ModuleFlags.NONE
  }

  equals(other: ModuleFlag): boolean {
    return this.moduleId === other.moduleId &&
      this.flag === other.flag
  }

  public fromJson(json: any): ModuleFlag {
    this.moduleId = json.moduleId
    this.flag = json.flag
    return this
  }
}
