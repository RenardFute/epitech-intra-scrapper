import { Case, convertCase } from "../utils/strings"
import SqlType from "./sqlType"
import { ColumnInfos } from "./annotations"

export type EasySqlFilter<T extends typeof SqlType> = {
  [P in keyof InstanceType<T>]?: InstanceType<T>[P];
}

export enum SqlFieldOperator {
  EQUAL = '=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  LIKE = 'LIKE',
}

export class SqlFilterField<T extends typeof SqlType, K extends InstanceType<T>> {
  public field: keyof K
  public value: any
  public infos: ColumnInfos
  public operator: SqlFieldOperator = SqlFieldOperator.EQUAL
  public not: boolean = false

  constructor(field: keyof K, value: any, infos: ColumnInfos, operator?: SqlFieldOperator, not?: boolean) {
    this.field = field
    this.value = value
    this.infos = infos
    this.operator = operator ?? SqlFieldOperator.EQUAL
    this.not = not ?? false
  }

  static from<T extends typeof SqlType, K extends InstanceType<T>>(type: T, field: keyof K, value: any, operator?: SqlFieldOperator, not?: boolean): SqlFilterField<T, K> {
    const columnsMap = {} as Record<keyof K, ColumnInfos>
    const empty = type.getEmptyObject()
    const instanceKeys = (Object.keys(empty) as (keyof K)[]).filter((key) => Reflect.hasMetadata('column', empty, key.toString()))
    for (const key of instanceKeys) {
      columnsMap[key] = Reflect.getMetadata('column', empty, key.toString()) as ColumnInfos
    }
    return new SqlFilterField<T, K>(field, value, columnsMap[field], operator, not)
  }

  public toString(): string {
    let r = ""
    r += convertCase(this.infos.name.toString(), {from: Case.CAMEL_CASE, to: Case.SNAKE_CASE})
    r += ` ${this.operator.toString()} `
    r += SqlType.toSQLValue(this.value, this.infos)
    return r
  }
}

export enum SqlFilterOperator {
  OR = 'OR',
  AND = 'AND'
}

export default class SqlFilter<T extends typeof SqlType> {
  public left: SqlFilter<T> | SqlFilterField<T, InstanceType<T>>
  public operator: SqlFilterOperator
  public right: SqlFilter<T> | SqlFilterField<T, InstanceType<T>> | boolean

  public constructor(left: SqlFilter<T> | SqlFilterField<T, InstanceType<T>>, operator?: SqlFilterOperator, right?: SqlFilter<T> | SqlFilterField<T, InstanceType<T>> | boolean) {
    this.left = left
    this.operator = operator ?? SqlFilterOperator.AND
    this.right = right ?? true
  }

  public toString(): string {
    let r = ""
    if (this.left instanceof SqlFilter) {
      r += `(${this.left.toString()})`
    } else {
      r += this.left.toString()
    }
    r += ` ${this.operator.toString()} `
    if (this.right instanceof SqlFilter) {
      r += `(${this.right.toString()})`
    } else if (this.right instanceof SqlFilterField) {
      r += this.right.toString()
    } else {
      r += this.right ? `TRUE` : `FALSE`
    }
    return r
  }

  public static from<T extends typeof SqlType>(type: T, filter: EasySqlFilter<T>): SqlFilter<T> {
    const columnsMap = {} as Record<keyof InstanceType<T>, ColumnInfos>
    const empty = type.getEmptyObject()
    const instanceKeys = (Object.keys(empty) as (keyof InstanceType<T>)[]).filter((key) => Reflect.hasMetadata('column', empty, key.toString()))
    for (const key of instanceKeys) {
      columnsMap[key] = Reflect.getMetadata('column', empty, key.toString()) as ColumnInfos
    }

    const filters: SqlFilterField<T, InstanceType<T>>[] = []
    for (const key in filter) {
      const field = key as keyof InstanceType<T>
      const value = filter[field as keyof EasySqlFilter<T>]
      const infos = columnsMap[field]
      const filterField = new SqlFilterField<T, InstanceType<T>>(field, value, infos)
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
