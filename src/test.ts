
import { IPMatch, IPv4, IPv6, matches } from '.';

const assert = (b: any) => { if (!b) throw new Error('oops'); };

// Using the helper function matches
// matches(ip: string | IP, target: string | IPMatch): boolean;
assert(matches('10.0.0.1', '10.0.0.0/24')); // true
assert(!matches('10.0.1.1', '10.0.0.0/24')); // false
assert(matches('abc::def', 'abc:*::def')); // true
assert(!matches('abc::def', 'abc:9::def')); // false

// Directly creating the IPMatch and using
// IPMatch.matches(ip: IP | string): boolean;
const ip = new IPMatch('10.0.0.0') as IPv4; // returns an IPv4
assert(ip.exact()); // true
assert(ip.matches('10.0.0.0')); // true
assert(!ip.matches('9.255.255.255')); // false

const ipw = new IPMatch('10.0.*.0') as IPv6; // also returns an IPv4
// (an octet/hextet has to be a number or a wildcard)
// (e.g. 10.*.*.0 is valid, 10.1*.0.0 isn't)
assert(!ipw.exact()); // false
assert(ipw.matches('10.0.0.0')); // true
assert(ipw.matches('10.0.123.0')); // true
assert(!ipw.matches('10.0.0.123')); // false

const range = new IPMatch('10.0.0.0-10.1.255.255'); // returns an IPRange
assert(range.matches('10.0.0.5')); // true
assert(range.matches('10.0.5.5')); // true
assert(!range.matches('10.5.5.5')); // false

const subnet = new IPMatch('10.20.30.40/16'); // returns an IPSubnetwork
assert(subnet.matches('10.20.30.40')); // true
assert(subnet.matches('10.20.50.50')); // true
assert(subnet.matches('10.20.255.255')); // true
assert(subnet.matches('10.20.20.40')); // true
assert(!subnet.matches('10.21.0.0')); // false
assert(!subnet.matches('10.21.30.40')); // false
assert(!subnet.matches('10.5.5.5')); // false

console.log('Seems like the demo/testing works fine');
