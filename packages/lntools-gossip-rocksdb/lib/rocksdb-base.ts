import levelup, { LevelUp } from "levelup";
import rocksdb from "rocksdb";

export abstract class RocksdbBase {
  protected _path: string;
  protected _db: LevelUp;

  constructor(path: string) {
    this._path = path;
    this._db = levelup(rocksdb(this._path));
  }

  public async open(): Promise<void> {
    return this._db.open();
  }

  public async close(): Promise<void> {
    return this._db.close();
  }
}