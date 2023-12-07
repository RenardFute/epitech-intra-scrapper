import { IdOf } from "../../utils/types"
import Module from "./module"
import { ModuleFlags } from "../../intra/dto"
import SqlType from "../sqlType"
import { Column, Table } from "../annotations"
import { SqlTypes } from "../types"

@Table('module_flags')
export default class ModuleFlag extends SqlType {
  @Column('module_id', SqlTypes.NUMBER)
  public moduleId: IdOf<Module>
  @Column()
  public flag: ModuleFlags

  static getEmptyObject() {
    return new ModuleFlag()
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
