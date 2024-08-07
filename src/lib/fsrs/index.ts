import { fsrs, generatorParameters } from 'ts-fsrs';

const params = generatorParameters({ enable_fuzz: true });
export const fsrsScheduler = fsrs(params);
