import mysql from "mysql"
import 'dotenv/config'

/**
 * A class to connect to a MySQL database
 * @class
 * @property {mysql.Connection} connection The connection to the database (if connected)
 *
 * @example
 * const connector = new SqlConnect()
 * connector.query("SELECT * FROM users WHERE id = ?", 1).then(console.log) // [{ id: 1, name: "Axel" }]
 *
 * @since 1.0.0
 * @category SQL
 * @author Axel ECKENBERG
 */
export class SqlConnect {
  /**
   * The connection to the database (if connected)
   * @type {mysql.Connection}
   * @private
   *
   * @category SQL
   * @since 1.0.0
   * @author Axel ECKENBERG
   */
  connection: mysql.Connection
  /**
   * Is the connector currently connecting to the database
   * @type {boolean}
   * @private
   *
   * @category SQL
   * @since 1.0.0
   * @author Axel ECKENBERG
   */
  private isConnecting: boolean = false

  /**
   * Create a new connector
   * @param connection - The connection to use (optional)
   *
   * @category SQL
   * @since 1.0.0
   * @constructor
   * @author Axel ECKENBERG
   */
  constructor(connection?: mysql.Connection) {
    if (connection) {
      this.connection = connection
    } else {
      this.connection = mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? "3306"),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      })
    }

    this.connect().then(() => {})
  }

  /**
   * Connect to the database
   * If the connector is already connecting, wait for the connection to be established
   * If the connector is already connected, do nothing
   *
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @returns {Promise<void>} A promise that resolves when the connection is established
   * @throws {Error} If the connection fails
   * @author Axel ECKENBERG
   */
  public async connect(): Promise<void> {
    if (this.isConnecting) return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.isConnecting) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
    })
    if (this.isConnected()) {
      return
    }
    this.isConnecting = true
    return new Promise<void>((resolve, reject) => {
      this.connection.connect((err) => {
        if (err) reject(err)
        this.isConnecting = false
        resolve()
      })
    })
  }

  /**
   * Is the connector currently connected to the database (or authenticated)
   * @returns {boolean} True if the connector is connected, false otherwise
   * @category SQL
   * @since 1.0.0
   * @method
   * @public
   * @author Axel ECKENBERG
   */
  public isConnected(): boolean {
    return !this.isConnecting && (this.connection.state === "connected" || this.connection.state === "authenticated")
  }

  /**
   * Execute a query on the database
   * If not connected, connect first
   * Transform the columns names from camelCase to snake_case
   * Replace commas by AND in WHERE clauses
   * If SHOW_SQL_QUERIES is true, log the query
   * @param query - The query to execute
   * @param values - The values to use in the query
   * @returns {Promise<any>} A promise that resolves with the result of the query
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @public
   * @throws {Error} If the query fails
   * @example
   * const connector = new SqlConnect()
   * connector.query("SELECT * FROM users WHERE id = ?", 1).then(console.log) // [{ id: 1, name: "Axel" }]
   * @author Axel ECKENBERG
   */
  public async query(query: string, ...values: any): Promise<any> {
    if (!this.isConnected()) await this.connect()
    query = mysql.format(query, values)
    query = query.replaceAll(/([a-z])([A-Z])(?=[^=']*=[^=]*)/g, (_, p1, p2) => {
      return `${p1}_${p2.toLowerCase()}`
    })
    query = query.replaceAll(/(?<=WHERE.*)(`[a-z_]+` = (\d+|'([^']|\\')*'))(,)/gm, '$1 AND')
    if (process.env.SHOW_SQL_QUERIES === "true")
      console.log(query)
    return new Promise((resolve, reject) => {
      this.connection.query(query, (err, result) => {
        if (err) reject(err)
        resolve(result)
      })
    })
  }

  /**
   * Get many objects from the database
   * Will revert snake_case to camelCase
   * Will convert is* and has* to boolean
   * Will convert json* to JSON
   * @param type - The type of the objects to get
   * @param filter - The filter to use (optional)
   * @returns {Promise<K[]>} A promise that resolves with the objects
   * @template T The type of the objects to get (has to extend SqlType)
   * @template K The instance type of the objects to get
   *
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @public
   * @throws {Error} If the query fails
   * @example
   * const connector = new SqlConnect()
   * connector.getMany(User).then(console.log) // [{ id: 1, name: "Axel" }, { id: 2, name: "John" }]
   * connector.getMany(User, { name: "Axel" }).then(console.log) // [{ id: 1, name: "Axel" }]
   * @see SqlFilter
   * @see SqlType
   */
  public async getMany<T extends typeof SqlType, K extends InstanceType<T>>(type: T, filter?: SqlFilter<T>): Promise<K[]> {
    const query = filter ? `SELECT * FROM ${type.databaseName} WHERE ?` : `SELECT * FROM ${type.databaseName}`
    const values: SqlFilter<T> = filter ?? {}

    const result = await this.query(query, values)
    const objects = [] as K[]
    for (const row of result) {
      const object = type.getEmptyObject() as K
      for (const key in row) {
        // Revert snake_case
        const trueKey = key.replaceAll(/_([a-z])/gm, (_, p1) => {
          return p1.toUpperCase()
        })
        if (trueKey.startsWith('is') || trueKey.startsWith('has')) {
          object[<keyof K>trueKey] = (row[key] === 1) as SqlBoolean as K[keyof K]
        } else if (trueKey.startsWith('json')) {
          object[<keyof K>trueKey] = JSON.parse(row[key]) as SqlJson as K[keyof K]
        } else {
          object[<keyof K>trueKey] = row[key]
        }
      }
      objects.push(object)
    }
    return objects
  }

  /**
   * Get the first object from getMany
   * @param type - The type of the object to get
   * @param filter - The filter to use (optional)
   *
   * @returns {Promise<K | null>} A promise that resolves with the object or null if none was found
   * @template T The type of the object to get (has to extend SqlType)
   * @template K The instance type of the object to get
   *
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @public
   * @throws {Error} If the query fails
   * @example
   * const connector = new SqlConnect()
   * connector.getOne(User).then(console.log) // { id: 1, name: "Axel" }
   * connector.getOne(User, { name: "Axel" }).then(console.log) // { id: 1, name: "Axel" }
   * connector.getOne(User, { name: "John" }).then(console.log) // { id: 2, name: "John" }
   * connector.getOne(User, { name: "John", id: 1 }).then(console.log) // null
   *
   * @see getMany
   * @see SqlFilter
   * @see SqlType
   * @author Axel ECKENBERG
   */
  public async getOne<T extends typeof SqlType, K extends InstanceType<T>>(type: T, filter?: SqlFilter<T>): Promise<K | null> {
    const results = await this.getMany(type, filter) as K[]

    if (results.length === 0) return null

    return results[0]
  }

  /**
   * Insert an object into the database
   * @param type - The type of the object to insert (has to extend SqlType)
   * @param object - The object to insert
   *
   * @returns {Promise<void>} A promise that resolves when the object is inserted
   * @template T The type of the object to insert (has to extend SqlType)
   * @template K The instance type of the object to insert
   *
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @public
   * @throws {Error} If the query fails
   * @example
   * const connector = new SqlConnect()
   * connector.insert(User, { name: "Axel" })
   * connector.insert(User, { name: "John" })
   * connector.getMany(User).then(console.log) // [{ id: 1, name: "Axel" }, { id: 2, name: "John" }]
   *
   * @see SqlType
   * @see getMany
   * @see query
   * @see SqlFilter
   * @see prepareObject
   * @author Axel ECKENBERG
   */
  public async insert<T extends typeof SqlType, K extends InstanceType<T>>(type: T, object: K): Promise<void> {
    const query = `INSERT INTO ${type.databaseName} SET ?`

    object = this.prepareObject(object)
    await this.query(query, object)
  }

  /**
   * Update an object in the database
   * @param type - The type of the object to update (has to extend SqlType)
   * @param object - The object to update
   * @param filter - The filter to use (optional)
   *
   * @returns {Promise<boolean>} A promise that resolves with true if the object was updated, false otherwise
   * @template T The type of the object to update (has to extend SqlType)
   * @template K The instance type of the object to update
   *
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @public
   * @throws {Error} If the query fails
   * @example
   * const connector = new SqlConnect()
   * connector.update(User, { id: 1, name: "Axel" })
   * connector.update(User, { id: 2, name: "John" })
   * connector.getMany(User).then(console.log) // [{ id: 1, name: "Axel" }, { id: 2, name: "John" }]
   * connector.update(User, { id: 1, name: "John" }, { id: 1 })
   * connector.getMany(User).then(console.log) // [{ id: 1, name: "John" }, { id: 2, name: "John" }]
   *
   * @see SqlType
   * @see query
   * @see SqlFilter
   * @see prepareObject
   * @see getOne
   * @author Axel ECKENBERG
   */
  public async update<T extends typeof SqlType, K extends InstanceType<T>>(type: T, object: K, filter?: SqlFilter<T>): Promise<boolean> {
    const query = `UPDATE ${type.databaseName} SET ? WHERE ?`
    const old = await this.getOne(type, filter) as K
    if (!old) return false

    object = this.prepareObject(object)
    const result = await this.query(query, object, filter ?? {})
    return result.changedRows > 0
  }

  /**
   * Prepare an object to be inserted or updated
   * Convert is* and has* to 0 or 1
   * Convert json* to stringified JSON
   * @param object - The object to prepare
   *
   * @returns {K} The prepared object
   * @template K The type of the object to prepare
   * @category SQL
   *
   * @example
   * const connector = new SqlConnect()
   * connector.prepareObject({ id: 1, name: "Axel", isStudent: true, hasDiscord: false, json: { test: true } }) // { id: 1, name: "Axel", isStudent: 1, hasDiscord: 0, json: '{"test":true}' }
   *
   * @since 1.0.0
   * @method
   * @private
   * @see insert
   * @see update
   * @see SqlType
   * @see SqlBoolean
   * @see SqlJson
   *
   * @author Axel ECKENBERG
   */
  private prepareObject<K>(object: K): K {
    const duplicate = { ...object }
    for (const key in duplicate) {
      if (key.toLowerCase().startsWith('is') || key.toLowerCase().startsWith('has')) {
        duplicate[<keyof K>key] = (object[<keyof K>key] ? 1 : 0) as K[keyof K]
      } else if (key.toLowerCase().startsWith('json')) {
        duplicate[<keyof K>key] = JSON.stringify(object[<keyof K>key]) as K[keyof K]
      } else if (duplicate[<keyof K>key] === undefined) {
        delete duplicate[<keyof K>key]
      }
    }
    return duplicate
  }

  /**
   * Insert or update an object in the database
   * If the object exists, update it and return the old and new object
   * If the object doesn't exist, insert it and return nothing
   * @param type - The type of the object to insert or update (has to extend SqlType)
   * @param object - The object to insert or update
   * @param match - The filter to use to check if the object exists
   *
   * @returns {Promise<SqlUpdate<T, K>>} A promise that resolves with the result of the operation
   * @template T The type of the object to insert or update (has to extend SqlType)
   * @template K The instance type of the object to insert or update
   *
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @public
   * @throws {Error} If the query fails
   * @example
   * const connector = new SqlConnect()
   * connector.insertOrUpdate(User, { id: 1, name: "Axel" }, { id: 1 }).then(console.log) // null
   * connector.insertOrUpdate(User, { id: 2, name: "John" }, { id: 2 }).then(console.log) // null
   * connector.insertOrUpdate(User, { id: 1, name: "John" }, { id: 1 }).then(console.log) // { isDiff: true, oldObject: { id: 1, name: "Axel" }, newObject: { id: 1, name: "John" } }
   *
   * @see SqlType
   * @see SqlFilter
   * @see insert
   * @see update
   * @see getMany
   * @see SqlUpdate
   *
   * @author Axel ECKENBERG
   */
  public async insertOrUpdate<T extends typeof SqlType, K extends InstanceType<T>>(type: T, object: K, match: SqlFilter<T>): Promise<SqlUpdate<T, K>> {
    // First we want to check if the object exists
    const results = await this.getMany(type, match) as K[]

    // If it does, we update it and return the updated object and the old one
    if (results.length > 0) {
      const oldObject = results[0]
      if (object.equals(oldObject)) return { isDiff: false, oldObject, newObject: object}
      const diff = await this.update(type, object, match)
      return { isDiff: diff, oldObject, newObject: object }
    }

    // Otherwise we insert it and return nothing
    await this.insert(type, object)
    return
  }

  /**
   * Close the connection to the database
   */
  public close() {
    if (this.isConnected())
      this.connection.end()
  }

  /**
   * Delete objects from the database
   * @param type - The type of the objects to delete
   * @param filter - The filter to use
   * @returns {Promise<void>} A promise that resolves when the objects are deleted
   * @template T The type of the objects to delete (has to extend SqlType)
   * @category SQL
   * @since 1.0.0
   * @async
   * @method
   * @public
   * @throws {Error} If the query fails
   * @author Axel ECKENBERG
   */
  public delete<T extends typeof SqlType>(type: T, filter: SqlFilter<T>): Promise<void> {
    const query = `DELETE FROM ${type.databaseName} WHERE ?`
    return this.query(query, filter)
  }
}

/**
 * A class to represent a type in the database
 * @class
 * @property {string} databaseName The name of the table in the database
 * @property {() => SqlType} getEmptyObject A function that returns an empty object of the type
 * @abstract
 * @category SQL
 * @since 1.0.0
 */
export abstract class SqlType {
  /**
   * The name of the table in the database
   * @type {string}
   * @category SQL
   * @since 1.0.0
   * @author Axel ECKENBERG
   */
  static databaseName: string
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
}

/**
 * A type to filter objects in the database
 * @template T The type of the objects to filter (has to extend SqlType)
 * @category SQL
 * @since 1.0.0
 * @author Axel ECKENBERG
 */
export type SqlFilter<T extends abstract new (...args: any) => any> = {
  [P in keyof InstanceType<T>]?: InstanceType<T>[P];
} & {
  prototype?: never;
  databaseName?: never;
}

/**
 * The default connector
 * @category SQL
 * @since 1.0.0
 * @type {SqlConnect}
 * @constant
 * @default new SqlConnect()
 * @see SqlConnect
 * @author Axel
 */
export default new SqlConnect()

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
export type SqlJson = unknown | string
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
