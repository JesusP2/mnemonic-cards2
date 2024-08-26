import Dexie, { type EntityTable } from 'dexie';

export interface IdbFile {
  key: string;
  file: File;
}

export const db = new Dexie('localFiles') as Dexie & {
  files: EntityTable<IdbFile, 'key'>;
};

db.version(1).stores({
  files: 'key, file',
});
