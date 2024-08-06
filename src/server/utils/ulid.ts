import { ulidFactory } from 'ulid-workers';

export function createUlid() {
  const ulid = ulidFactory();
  return ulid();
}
