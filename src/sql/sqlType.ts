import { ColumnInfos, executeManyToMany, RelationType } from "./annotations"
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

    if (infos.canBeNull && !value) {
      return 'NULL'
    }
    if (type === SqlTypes.NUMBER) {
      assert(typeof value === 'number')
      return value.toString()
    }
    if (type === SqlTypes.BOOLEAN) {
      assert(typeof value === 'boolean')
      return value ? 'TRUE' : 'FALSE'
    }
    if (type === SqlTypes.STRING) {
      return `'${value}'`
    }
    if (type === SqlTypes.DATE) {
      assert(value instanceof Date)
      return `'${value.toISOString()}'`
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
      switch (relation.relationType) {
        case RelationType.MANY_TO_MANY:
          value = await executeManyToMany(this, relation)
          break
        case RelationType.MANY_TO_ONE:
          filter.id = this[key]
          value = await connector.getOne(relation.targetEntity, SqlFilter.from(relation.targetEntity, filter))
          break
        case RelationType.ONE_TO_MANY:
          filter[relation.inverseProperty] = this.id
          value = await connector.getMany(relation.targetEntity, SqlFilter.from(relation.targetEntity, filter))
          break
        case RelationType.ONE_TO_ONE:
          break
      }
      this[key] = value ?? this[key]
    })
    await Promise.all(promises)
  }
}
