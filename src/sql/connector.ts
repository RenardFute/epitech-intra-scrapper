import mysql from "mysql"
import 'dotenv/config'
import exp from "constants"
export class SqlConnect {
  connection: mysql.Connection;
  private isConnecting: boolean = false;

  constructor(connection?: mysql.Connection) {
    if (connection) {
      this.connection = connection;
    } else {
      this.connection = mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? "3306"),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      })
    }

    this.connect().then(r => console.log("Connected to database"));
  }

  public async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;
    return new Promise<void>((resolve, reject) => {
      this.connection.connect((err) => {
        if (err) reject(err);
        this.isConnecting = false;
        resolve();
      })
    })
  }

  public isConnected(): boolean {
    return this.connection.state === "connected";
  }

  public async query(query: string, values: any[]): Promise<any> {
    if (!this.isConnected()) await this.connect();

    return new Promise((resolve, reject) => {
      this.connection.query(query, values, (err, result) => {
        if (err) reject(err);
        resolve(result);
      })
    })
  }

  public async getMany<T extends typeof SqlType, K extends InstanceType<T>>(type: T, filter?: SqlFilter<T>): Promise<K[]> {
    const query = filter ? `SELECT * FROM ${type.databaseName} WHERE ?` : `SELECT * FROM ${type.databaseName}`;
    const values: SqlFilter<T>[] = [filter ?? {}];

    const result = await this.query(query, values);
    const objects = [] as K[];
    for (const row of result) {
      const object = new type() as K;
      for (const key in row) {
        object[<keyof K>key] = row[key];
      }
      objects.push(object);
    }
    return objects;
  }

  public async getOne<T extends typeof SqlType, K extends InstanceType<T>>(type: T, filter?: SqlFilter<T>): Promise<K> {
    const results = await this.getMany(type, filter) as K[];

    if (results.length === 0) throw new Error("No results found");

    return results[0];
  }

  public close() {
    if (this.isConnected())
      this.connection.end();
  }
}

export class SqlType {
  static databaseName: string
}

export type SqlFilter<T extends abstract new (...args: any) => any> = {
  [P in keyof InstanceType<T>]?: InstanceType<T>[P];
} & {
  prototype?: never;
  databaseName?: never;
}

export default new SqlConnect();
