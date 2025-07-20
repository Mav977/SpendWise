
import * as SQLite from "expo-sqlite";

export function getDB() {
  const db = SQLite.openDatabaseSync("myDatabase.db");
  return db;
}
