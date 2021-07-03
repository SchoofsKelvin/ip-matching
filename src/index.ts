
/**
 * Library mostly focused on IP matching, but with some other fancy goods.
 * Repository: https://github.com/SchoofsKelvin/ip-matching
 * @packageDocumentation
 */

import { getMatch, IP, IPMatch } from './ip';

export * from './ip';

/**
 * Checks whether the given IP matches the given whitelist
 * @param ip - The IP to check, or a string to be converted to an exact IP
 * @param target - The target to check against, or a string to convert to an IPMatch
 * @throws Throws an error if either argument is a string but does not have a correct format
 */
export function matches(ip: string | IP, target: string | IPMatch): boolean {
  const targ = getMatch(target);
  return targ.matches(ip);
}
