
import { IPMatch, IPv4, IPv6, matches } from '.';

const assert = (b: any) => { if (!b) throw new Error('oops'); };

// Using the helper function matches
// matches(ip: string | IP, target: string | IPMatch): boolean;
assert(matches('10.0.0.1', '10.0.0.0/24')); // true
assert(!matches('10.0.1.1', '10.0.0.0/24')); // false
assert(matches('abc::def', 'abc:*::def')); // true
assert(!matches('abc::def', 'abc:9::def')); // false
assert(matches('0001:2:3:4:5:6:7', '1:2:3:4:5:6:7')); // true

/* IPv4 */
{
  // Directly creating the IPMatch and using
  // IPMatch.matches(ip: IP | string): boolean;
  const ip = new IPMatch('10.0.0.0') as IPv4; // returns an IPv4
  assert(ip.exact()); // true
  assert(ip.matches('10.0.0.0')); // true
  assert(!ip.matches('9.255.255.255')); // false

  const ipw = new IPMatch('10.0.*.0') as IPv4; // also returns an IPv4
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
}

/* IPv6 */
{
  // Directly creating the IPMatch and using
  // IPMatch.matches(ip: IP | string): boolean;
  const ip = new IPMatch('aaaa::bbbb') as IPv6; // returns an IPv6
  assert(ip.exact()); // true
  assert(ip.matches('aaaa::bbbb')); // true
  assert(!ip.matches('aaaa::cccc')); // false

  const ipw = new IPMatch('aaaa::*:cccc') as IPv6; // also returns an IPv6
  // (an octet/hextet has to be a number or a wildcard)
  // (e.g. aaaa::*:cccc is valid, aaaa::b*:cccc isn't)
  assert(!ipw.exact()); // false
  assert(ipw.matches('aaaa::cccc')); // true
  assert(ipw.matches('aaaa::1234:cccc')); // true
  assert(!ipw.matches('aaaa::cccd')); // false

  const range = new IPMatch('aaaa::bbbb:0-aaaa::cccc:0'); // returns an IPRange
  assert(range.matches('aaaa::bbbb:0')); // true
  assert(range.matches('aaaa::bbcc:1234')); // true
  assert(!range.matches('aaaa::1:bbbb:0')); // false

  const subnet = new IPMatch('a:b:c:d::/64'); // returns an IPSubnetwork
  assert(subnet.matches('a:b:c:d::')); // true
  assert(subnet.matches('a:b:c:d:ffff:ffff:ffff:ffff')); // true
  assert(subnet.matches('a:b:c:d:1:2:3:4')); // true
  assert(!subnet.matches('a:b:c:dd::')); // false
  assert(!subnet.matches('a:b:c:cfff::')); // false
  assert(!subnet.matches('c::')); // false
}

console.log('Seems like the demo/testing works fine');
