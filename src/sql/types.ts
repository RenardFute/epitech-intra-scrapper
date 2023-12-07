import SqlType from "./sqlType"

/**
 * A type to represent the result of an insertOrUpdate operation
 * @category SQL
 * @since 1.0.0
 * @type {{ isDiff: boolean, oldObject: K, newObject: K } | void}
 * @template T The type of the object to insert or update (has to extend SqlType)
 * @template K The instance type of the object to insert or update
 * @see SqlType
 * @author Axel ECKENBERG
 */
export type SqlUpdate<T extends typeof SqlType, K extends InstanceType<T>> = { isDiff: boolean, oldObject: K, newObject: K } | void

export enum SqlTypes {
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  STRING = 'string'
}
