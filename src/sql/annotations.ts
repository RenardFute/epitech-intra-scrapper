import 'reflect-metadata'
import { Case, convertCase } from "../utils/strings"
import { SqlTypes } from "./types"
import SqlType from "./sqlType"
import connector from "./connector"
import SqlFilter from "./sqlFilter"

export function Table(tableName: string) {
  return function (constructor: Function) {
    Reflect.defineMetadata('table', tableName, constructor)
  }
}

export interface ColumnInfos {
  name: string,
  type: SqlTypes,
  canBeNull?: boolean
}

export function Column(name?: string, type?: SqlTypes, canBeNull?: boolean) {
  return function (target: any, propertyKey: string) {
    const columnName = name ?? convertCase(propertyKey, {from: Case.CAMEL_CASE, to: Case.SNAKE_CASE})
    const columnType: SqlTypes = type ?? Reflect.getMetadata('design:type', target, propertyKey).name.toLowerCase()
    const infos: ColumnInfos = {name: columnName, type: columnType, canBeNull: canBeNull}
    Reflect.defineMetadata('column', infos, target, propertyKey)
  }
}

export enum RelationType {
  MANY_TO_MANY = 'ManyToMany',
  MANY_TO_ONE = 'ManyToOne',
  ONE_TO_MANY = 'OneToMany',
  ONE_TO_ONE = 'OneToOne'
}

export interface Relation<Target extends typeof SqlType> {
  targetEntity: Target,
  inverseProperty: string,
  relationType: RelationType,
  joinTableName?: string
}

export function ManyToOne<Target extends typeof SqlType>(targetEntity: Target,) {
  return function (target: any, propertyKey: string) {
    const relation: Relation<Target> = { targetEntity: targetEntity, inverseProperty: '', relationType: RelationType.MANY_TO_ONE }
    Reflect.defineMetadata('relation', relation, target, propertyKey)
  }
}

export function OneToMany<Target extends typeof SqlType>(targetEntity: Target, inverseProperty?: string) {
  return function (target: any, propertyKey: string) {
    const inverse = inverseProperty ?? target.getTableName() + '_' + 'id'
    const relation: Relation<Target> = { targetEntity: targetEntity, inverseProperty: inverse, relationType: RelationType.ONE_TO_MANY }
    Reflect.defineMetadata('relation', relation, target, propertyKey)
  }
}

export function ManyToMany<Target extends typeof SqlType>(targetEntity: Target, joinTable?: string) {
  return function (target: any, propertyKey: string) {
    const joinTableName = joinTable ?? target.getTableName() + '_' + targetEntity.getTableName()
    const relation: Relation<Target> = { targetEntity: targetEntity, inverseProperty: '', relationType: RelationType.MANY_TO_MANY, joinTableName }
    Reflect.defineMetadata('relation', relation, target, propertyKey)
  }
}

export function OneToOne<Target extends typeof SqlType>(targetEntity: Target, inverseProperty?: string) {
  return function (target: any, propertyKey: string) {
    const inverse = inverseProperty ?? target.getTableName() + '_' + 'id'
    const relation: Relation<Target> = { targetEntity: targetEntity, inverseProperty: inverse, relationType: RelationType.ONE_TO_ONE }
    Reflect.defineMetadata('relation', relation, target, propertyKey)
  }
}

export async function executeManyToMany<Target extends typeof SqlType, Source extends SqlType>(source: Source, relation: Relation<Target>) {
  const sourceIdInfo = Reflect.getMetadata('column', source, 'id')
  const ids = await connector.query(`SELECT ${relation.targetEntity.getTableName() + '_id'} FROM ${relation.joinTableName} WHERE ${source.getTableName() + '_id'} = ${SqlType.toSQLValue(source.id, sourceIdInfo)}`)
  const result = []
  for (const row of ids) {
    const targetEntity = relation.targetEntity
    const targetId = row[`${targetEntity.getTableName() + '_id'}`]
    // @ts-ignore
    const target = await connector.getOne(targetEntity, SqlFilter.from(targetEntity, {id: targetId}))
    result.push(target)
  }
  return result
}
