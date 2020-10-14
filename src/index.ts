
import { getMatch, IP, IPMatch } from './ip';

export * from './ip';

export function matches(ip: string | IP, target: string | IPMatch) {
  const targ = getMatch(target);
  return targ.matches(ip);
}
