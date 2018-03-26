
import { IP, IPMatch } from './ip';

export * from './ip';

export default function matches(ip: string | IP, target: string | IPMatch) {
  const targ = new IPMatch(target);
  return targ.matches(ip);
}
