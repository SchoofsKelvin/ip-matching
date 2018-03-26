
import { IP, IPMatch } from './ip';

export * from './ip';

export function matches(ip: string | IP, target: string | IPMatch) {
  const targ = new IPMatch(target);
  return targ.matches(ip);
}

export const test = process.hrtime();
