import mysql from "mysql"
import 'dotenv/config'

export class SqlConnect {
  connection: mysql.Connection
  private isConnecting: boolean = false

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

  public isConnected(): boolean {
    return !this.isConnecting && (this.connection.state === "connected" || this.connection.state === "authenticated")
  }

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
          object[<keyof K>trueKey] = (row[key] === 1) as K[keyof K]
        } else if (trueKey.startsWith('json')) {
          object[<keyof K>trueKey] = JSON.parse(row[key]) as K[keyof K]
        } else {
          object[<keyof K>trueKey] = row[key]
        }
      }
      objects.push(object)
    }
    return objects
  }

  public async getOne<T extends typeof SqlType, K extends InstanceType<T>>(type: T, filter?: SqlFilter<T>): Promise<K | null> {
    const results = await this.getMany(type, filter) as K[]

    if (results.length === 0) return null

    return results[0]
  }

  public async insert<T extends typeof SqlType, K extends InstanceType<T>>(type: T, object: K): Promise<void> {
    const query = `INSERT INTO ${type.databaseName} SET ?`

    object = this.prepareObject(object)
    await this.query(query, object)
  }

  public async update<T extends typeof SqlType, K extends InstanceType<T>>(type: T, object: K, filter?: SqlFilter<T>): Promise<boolean> {
    const query = `UPDATE ${type.databaseName} SET ? WHERE ?`
    const old = await this.getOne(type, filter) as K
    if (!old) return false

    object = this.prepareObject(object)
    const result = await this.query(query, object, filter ?? {})
    return result.changedRows > 0
  }

  private prepareObject<K>(object: K): K {
    const duplicate = { ...object }
    for (const key in duplicate) {
      if (key.toLowerCase().startsWith('is') || key.toLowerCase().startsWith('has')) {
        duplicate[<keyof K>key] = (object[<keyof K>key] ? 1 : 0) as K[keyof K]
      } else if (key.toLowerCase().startsWith('json')) {
        duplicate[<keyof K>key] = JSON.stringify(object[<keyof K>key]) as K[keyof K]
      }
    }
    return duplicate
  }

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

  public close() {
    if (this.isConnected())
      this.connection.end()
  }

  public delete<T extends typeof SqlType>(type: T, filter: SqlFilter<T>): Promise<void> {
    const query = `DELETE FROM ${type.databaseName} WHERE ?`
    return this.query(query, filter)
  }
}

export abstract class SqlType {
  static databaseName: string
  static getEmptyObject: () => SqlType

  abstract equals(other: SqlType): boolean
  abstract fromJson(json: any): SqlType
}

export type SqlFilter<T extends abstract new (...args: any) => any> = {
  [P in keyof InstanceType<T>]?: InstanceType<T>[P];
} & {
  prototype?: never;
  databaseName?: never;
}

export default new SqlConnect()

export type SqlBoolean = boolean | number
export type SqlJson = unknown | string
export type SqlUpdate<T extends typeof SqlType, K extends InstanceType<T>> = { isDiff: boolean, oldObject: K, newObject: K } | void
