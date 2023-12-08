import { IdOf } from "../../utils/types"
import Module from "./module"
import { ModuleFlags } from "../../intra/dto"
import SqlType from "../sqlType"
import { Column, Id, Table } from "../annotations"
import { SqlTypes } from "../types"
import { hashString } from "../../utils/strings"

@Table('module_flags')
export default class ModuleFlag extends SqlType {
  @Id()
  @Column()
  public id: number
  @Column('module_id', SqlTypes.NUMBER)
  public moduleId: IdOf<Module>
  @Column()
  public flag: ModuleFlags

  static getEmptyObject() {
    return new ModuleFlag()
  }

  constructor() {
    super()
    this.id = 0
    this.moduleId = 0
    this.flag = ModuleFlags.NONE
  }

  public static computeId(moduleId: number, flag: ModuleFlags): number {
    return Math.abs(moduleId * 31 + hashString(flag))
  }

  equals(other: ModuleFlag): boolean {
    return this.moduleId === other.moduleId &&
      this.flag === other.flag &&
      this.id === other.id
  }

  public fromJson(json: any): ModuleFlag {
    this.id = json.id
    this.moduleId = json.moduleId
    this.flag = json.flag
    return this
  }
}
