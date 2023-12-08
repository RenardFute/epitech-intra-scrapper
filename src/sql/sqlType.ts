import { ColumnInfos, executeManyToMany, Relation, RelationType } from "./annotations"
import { SqlTypes } from "./types"
import assert from "assert"
import dayjs from "dayjs"
import connector from "./connector"
import SqlFilter, { EasySqlFilter } from "./sqlFilter"

/**
 * A class to represent a type in the database
 * @class
 * @property {string} databaseName The name of the table in the database
 * @property {() => SqlType} getEmptyObject A function that returns an empty object of the type
 * @abstract
 * @category SQL
 * @since 1.0.0
 */
export default abstract class SqlType {
  public id: any
  static getEmptyObject: () => SqlType

  /**
   * Check if two objects are equal
   * @param other - The object to compare to
   * @returns {boolean} True if the objects are equal, false otherwise
   * @category SQL
   * @since 1.0.0
   * @method
   * @public
   * @abstract
   * @author Axel ECKENBERG
   */
  abstract equals(other: SqlType): boolean

  /**
   * Convert an object to JSON
   * @param json - The JSON representation of the object
   * @returns {SqlType} The object
   * @category SQL
   * @since 1.0.0
   * @method
   * @public
   * @abstract
   * @author Axel ECKENBERG
   */
  abstract fromJson(json: any): SqlType

  public static getTableName() {
    return  Reflect.getMetadata('table', this)
  }

  public getTableName() {
    return  Reflect.getMetadata('table', this.constructor)
  }


  public toSQLReady(): string {
    // Get all class fields with a @Column() decorator
    const instanceKeys = Object.keys(this) as (keyof this)[]
    const columnDecoratedKeys = instanceKeys.filter(key => Reflect.hasMetadata('column', this, key.toString()))
    const columns = columnDecoratedKeys.map(key => {
      const columnInfos = Reflect.getMetadata('column', this, key.toString()) as ColumnInfos
      const columnValue = this[key]
      const sqlValue = SqlType.toSQLValue(columnValue, columnInfos)
      return `${columnInfos.name} = ${sqlValue}`
    })
    return columns.join(', ')
  }

  public static toSQLValue(value: any, infos: ColumnInfos): string {
    const type = infos.type

    if (value === null || value === undefined) {
      return 'NULL'
    }
    if (value instanceof SqlType) {
      value = value['id']
    }
    if (type === SqlTypes.NUMBER) {
      assert(typeof value === 'number')
      return value.toString()
    }
    if (type === SqlTypes.BOOLEAN) {
      assert(typeof value === 'boolean' || typeof value === "number")
      if (typeof value === 'number')
        return value > 0 ? 'TRUE' : 'FALSE'
      return value ? 'TRUE' : 'FALSE'
    }
    if (type === SqlTypes.STRING) {
      return `'${value}'`
    }
    if (type === SqlTypes.DATE) {
      assert(value instanceof Date)
      return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
    }
    return ""
  }

  public static fromSQLValue(value: any, infos: ColumnInfos): any {
    const type = infos.type

    if (infos.canBeNull && !value) {
      return null
    }
    if (type === SqlTypes.NUMBER) {
      return Number(value)
    }
    if (type === SqlTypes.BOOLEAN) {
      return value === 1
    }
    if (type === SqlTypes.STRING) {
      return `${value}`
    }
    if (type === SqlTypes.DATE) {
      return dayjs(value).toDate()
    }
    return ""
  }

  public static fromSQLResult<T extends typeof SqlType, K extends InstanceType<T>>(type: T, row: any): K {
    const instance = type.getEmptyObject() as K
    const columnsMap: Record<string, keyof K> = {}
    const instanceKeys = (Object.keys(instance) as (keyof K)[]).filter((key) => Reflect.hasMetadata('column', instance, key.toString()))
    for (const key of instanceKeys) {
      const columnInfos = Reflect.getMetadata('column', instance, key.toString()) as ColumnInfos

      columnsMap[columnInfos.name] = key
    }
    for (const column in row) {
      const trueName = columnsMap[column]
      if (trueName) {
        const columnInfos = Reflect.getMetadata('column', instance, trueName.toString()) as ColumnInfos
        instance[trueName] = SqlType.fromSQLValue(row[column], columnInfos)
      }
    }
    return instance
  }

  public async map(): Promise<void> {
    const instanceKeys = Object.keys(this) as (keyof this)[]
    const columnDecoratedKeys = instanceKeys.filter(key => Reflect.hasMetadata('relation', this, key.toString()))
    const promises = columnDecoratedKeys.map(async key => {
      const relation = Reflect.getMetadata('relation', this, key.toString())
      let value
      const filter: EasySqlFilter<any> = {}
      let tmp
      switch (relation.relationType) {
        case RelationType.MANY_TO_MANY:
          value = await executeManyToMany(this, relation)
          break
        case RelationType.MANY_TO_ONE:
          filter.id = this[key]
          value = await connector.getOne(relation.targetEntity, SqlFilter.from(relation.targetEntity, filter))
          break
        case RelationType.ONE_TO_MANY:
          tmp = SqlType.getKeyFromColumnName(relation.targetEntity, relation.inverseProperty)
          if (!tmp)
            break
          // @ts-ignore
          filter[tmp] = this.id
          value = await connector.getMany(relation.targetEntity, SqlFilter.from(relation.targetEntity, filter))
          break
        case RelationType.ONE_TO_ONE:
          break
      }
      this[key] = value ?? this[key]
    })
    await Promise.all(promises)
  }

  public static getKeyFromColumnName<T extends typeof SqlType, K extends InstanceType<T>>(type: T, columnName: string): keyof K | undefined {
    const empty = type.getEmptyObject() as K
    const instanceKeys = Object.keys(empty) as (keyof K)[]
    const columnDecoratedKeys = instanceKeys.filter(key => Reflect.hasMetadata('column', empty, key.toString()))
    return columnDecoratedKeys.find(key => {
      const columnInfos = Reflect.getMetadata('column', empty, key.toString()) as ColumnInfos
      return columnInfos.name === columnName
    })
  }

  public async recursiveMap(): Promise<void> {
    await this.map()
    const instanceKeys = Object.keys(this) as (keyof this)[]
    const columnDecoratedKeys = instanceKeys.filter(key => Reflect.hasMetadata('relation', this, key.toString()))
    const promises = columnDecoratedKeys.map(async key => {
      if (this[key] instanceof SqlType) {
        await (<SqlType>this[key]).map()
      }
    })
    await Promise.all(promises)
  }

  public async save(): Promise<boolean> {
    const instanceKeys = Object.keys(this) as (keyof this)[]
    const relationKeys = instanceKeys.filter(key => Reflect.hasMetadata('relation', this, key.toString()))
    const old: SqlType | null = await connector.getOne(this.constructor.prototype, SqlFilter.from(this.constructor.prototype, {id: this.id}))
    const isNew = old === null
    if (old === null) {
      await connector.insert(this)
    } else {
      await connector.update(this.constructor.prototype, this, SqlFilter.from(this.constructor.prototype, {id: this.id}))
      await old.map()
    }
    for (const relKey of relationKeys) {
      const relation: Relation<any> = Reflect.getMetadata('relation', this, relKey.toString())
      const v: unknown | SqlType | SqlType[] = this[relKey]
      if (v instanceof SqlType && !Array.isArray(v)) { // Single SqlType
        const oldRel: SqlType | null = await connector.getOne(relation.targetEntity, SqlFilter.from(relation.targetEntity, {id: v.id}))
        if (oldRel === null) {
          await connector.insert(v)
        } else {
          await connector.update(relation.targetEntity, v, SqlFilter.from(relation.targetEntity, {id: v.id}))
        }
      } else if (v instanceof SqlType && Array.isArray(v)) { // Multiple SqlTypes
        if (relation.relationType === RelationType.ONE_TO_MANY) {
          const relationFilter: EasySqlFilter<any> = {}
          // @ts-ignore
          relationFilter[SqlType.getKeyFromColumnName(relation.targetEntity, relation.inverseProperty)] = this.id
          const oldRels = await connector.getMany(relation.targetEntity, SqlFilter.from(relation.targetEntity, relationFilter))
          const oldRelsIds = oldRels.map(rel => rel.id)
          const newRelsIds = v.map(rel => rel.id)
          const relsToDelete = oldRelsIds.filter(id => !newRelsIds.includes(id))
          const relsToInsert = v.filter(rel => !oldRelsIds.includes(rel.id))
          const relsToUpdate = v.filter(rel => oldRelsIds.includes(rel.id))
          await Promise.all([
            ...relsToDelete.map(relId => connector.delete(relation.targetEntity, SqlFilter.from(relation.targetEntity, { id: relId }))),
            ...relsToInsert.map(rel => connector.insert(rel)),
            ...relsToUpdate.map(rel => rel.save())
          ])
        } else if (relation.relationType === RelationType.MANY_TO_MANY) {
          const sourceIdInfo = Reflect.getMetadata('column', relation.targetEntity.getEmptyObject(), 'id')
          const thisIdInfo = Reflect.getMetadata('column', this, 'id')
          const oldRels = await executeManyToMany(this, relation)
          const oldRelsIds = oldRels.map(rel => rel.id)
          const newRelsIds = v.map(rel => rel.id)
          const relsToDelete = oldRelsIds.filter(id => !newRelsIds.includes(id))
          const relsToLink = v.filter(rel => !oldRelsIds.includes(rel.id) && ol
          const relsToCreate
          await Promise.all([
            ...relsToDelete.map(relId => connector.query(`DELETE FROM ${relation.joinTableName} WHERE ${relation.targetEntity.getTableName() + '_id'} = ${SqlType.toSQLValue(relId, sourceIdInfo)}`)),
            ...relsToLink.map(rel => connector.query(`INSERT INTO ${relation.joinTableName} SET ${relation.targetEntity.getTableName() + '_id'} = ${SqlType.toSQLValue(rel.id, sourceIdInfo)}, ${this.getTableName() + '_id'} = ${SqlType.toSQLValue(this.id, thisIdInfo)}`))
          ])
        }
      }
    }
    return isNew
  }

  public toJson(): string {
    return JSON.stringify(this, null, 2)
  }
}
