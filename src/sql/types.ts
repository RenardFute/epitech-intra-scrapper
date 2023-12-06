import { SqlType } from "./connector"

/**
 * A type to represent a boolean in the database (0 or 1 instead of true or false)
 * @category SQL
 * @since 1.0.0
 * @type {boolean | number}
 */
export type SqlBoolean = boolean | number
/**
 * A type to represent JSON in the database (stringified JSON instead of JSON)
 * @category SQL
 * @since 1.0.0
 * @type {unknown | string}
 */
export type SqlJson<K extends Object> = K | string
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
