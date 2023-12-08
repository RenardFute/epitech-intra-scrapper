import { Case, convertCase } from "../utils/strings"
import SqlType from "./sqlType"
import { ColumnInfos } from "./annotations"

export type EasySqlFilter<T extends typeof SqlType> = {
  [P in keyof InstanceType<T>]?: InstanceType<T>[P];
}

export class SqlFilterField<T extends typeof SqlType> {
  public field: keyof T
  public value: any
  public infos: ColumnInfos

  constructor(field: keyof T, value: any, infos: ColumnInfos) {
    this.field = field
    this.value = value
    this.infos = infos
  }
}

export enum SqlFilterOperator {
  OR = 'OR',
  AND = 'AND'
}

export default class SqlFilter<T extends typeof SqlType> {
  public left: SqlFilter<T> | SqlFilterField<T>
  public operator: SqlFilterOperator
  public right: SqlFilter<T> | SqlFilterField<T> | true

  public constructor(left: SqlFilter<T> | SqlFilterField<T>, operator?: SqlFilterOperator, right?: SqlFilter<T> | SqlFilterField<T>) {
    this.left = left
    this.operator = operator ?? SqlFilterOperator.AND
    this.right = right ?? true
  }

  public toString(): string {
    let r = ""
    if (this.left instanceof SqlFilter) {
      r += `(${this.left.toString()})`
    } else {
      r += `${convertCase(this.left.field.toString(), {from: Case.CAMEL_CASE, to: Case.SNAKE_CASE})} = ${SqlType.toSQLValue(this.left.value, this.left.infos)}`
    }
    r += ` ${this.operator.toString()} `
    if (this.right instanceof SqlFilter) {
      r += `(${this.right.toString()})`
    } else if (this.right instanceof SqlFilterField) {
      r += `${convertCase(this.right.field.toString(), {from: Case.CAMEL_CASE, to: Case.SNAKE_CASE})} = ${SqlType.toSQLValue(this.right.value, this.right.infos)}`
    } else {
      r += `TRUE`
    }
    return r
  }

  public static from<T extends typeof SqlType>(type: T, filter: EasySqlFilter<T>): SqlFilter<T> {
    const columnsMap = {} as Record<keyof T, ColumnInfos>
    const empty = type.getEmptyObject()
    const instanceKeys = (Object.keys(empty) as (keyof T)[]).filter((key) => Reflect.hasMetadata('column', empty, key.toString()))
    for (const key of instanceKeys) {
      columnsMap[key] = Reflect.getMetadata('column', empty, key.toString()) as ColumnInfos
    }

    const filters: SqlFilterField<T>[] = []
    for (const key in filter) {
      const field = key as keyof T
      const value = filter[field as keyof EasySqlFilter<T>]
      const infos = columnsMap[field]
      const filterField = new SqlFilterField<T>(field, value, infos)
      filters.push(filterField)
    }
    const filterPairs = []
    for (let i = 0; i < filters.length; i += 2) {
      const left = filters[i]
      const right = filters[i + 1] ?? true
      const filter = new SqlFilter<T>(left, SqlFilterOperator.AND, right)
      filterPairs.push(filter)
    }
    return filterPairs.reduce((prev, curr) => new SqlFilter<T>(prev, SqlFilterOperator.AND, curr))
  }
}
