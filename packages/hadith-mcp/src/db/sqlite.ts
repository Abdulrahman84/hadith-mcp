import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export class SqliteJsonClient {
  readonly dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = path.resolve(dbPath);

    if (!existsSync(this.dbPath)) {
      throw new Error(`SQLite database not found: ${this.dbPath}`);
    }
  }

  query<T>(sql: string): T[] {
    const output = execFileSync("sqlite3", ["-readonly", "-json", this.dbPath, sql], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024
    }).trim();

    if (output.length === 0) {
      return [];
    }

    return JSON.parse(output) as T[];
  }
}

export function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}
