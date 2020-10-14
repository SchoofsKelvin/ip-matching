
import { IPMatch, IPSubnetwork, IPv4, IPv6, matches } from '.';
import { getMatch } from './ip';

const assert = (b: any) => { if (!b) throw new Error('oops'); };

// Using the helper function matches
// matches(ip: string | IP, target: string | IPMatch): boolean;
assert(matches('10.0.0.1', '10.0.0.0/24')); // true
assert(!matches('10.0.1.1', '10.0.0.0/24')); // false
assert(matches('abc::def', 'abc:*::def')); // true
assert(!matches('abc::def', 'abc:9::def')); // false
assert(matches('0001:2:3:4:5:6:7', '1:2:3:4:5:6:7')); // true

// IPMatch constructor actually returns an instance of
// IPv4, IPv6, IPRange or IPSubnetwork, all extending IPMatch
const mySubnet = getMatch('fefe::0001:abcd/112');
assert(mySubnet.type === 'IPSubnetwork'); // 'IPSubnetwork'
assert(mySubnet instanceof IPSubnetwork); // true
assert(mySubnet instanceof IPMatch); // true
assert(mySubnet.matches('FEFE::1:bbbb')); // true
assert(!mySubnet.matches('FEFE::2:bbbb')); // false

/* IPv4 */
{
  // Directly creating the IPMatch and using
  // IPMatch.matches(ip: IP | string): boolean;
  const ip = getMatch('10.0.0.0') as IPv4; // returns an IPv4
  assert(ip.exact()); // true
  assert(ip.matches('10.0.0.0')); // true
  assert(!ip.matches('9.255.255.255')); // false

  const ipw = getMatch('10.0.*.0') as IPv4; // also returns an IPv4
  // (an octet/hextet has to be a number or a wildcard)
  // (e.g. 10.*.*.0 is valid, 10.1*.0.0 isn't)
  assert(!ipw.exact()); // false
  assert(ipw.matches('10.0.0.0')); // true
  assert(ipw.matches('10.0.123.0')); // true
  assert(!ipw.matches('10.0.0.123')); // false

  const range = getMatch('10.0.0.0-10.1.255.255'); // returns an IPRange
  assert(range.matches('10.0.0.5')); // true
  assert(range.matches('10.0.5.5')); // true
  assert(!range.matches('10.5.5.5')); // false

  const subnet = getMatch('10.20.30.40/16'); // returns an IPSubnetwork
  assert(subnet.toString() === '10.20.0.0/16'); // "Standard" form
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
  const ip = getMatch('aaaa::bbbb') as IPv6; // returns an IPv6
  assert(ip.exact()); // true
  assert(ip.matches('aaaa::bbbb')); // true
  assert(!ip.matches('aaaa::cccc')); // false

  const ipw = getMatch('aaaa::*:cccc') as IPv6; // also returns an IPv6
  // (an octet/hextet has to be a number or a wildcard)
  // (e.g. aaaa::*:cccc is valid, aaaa::b*:cccc isn't)
  assert(!ipw.exact()); // false
  assert(ipw.matches('aaaa::cccc')); // true
  assert(ipw.matches('aaaa::1234:cccc')); // true
  assert(!ipw.matches('aaaa::cccd')); // false

  const range = getMatch('aaaa::bbbb:0-aaaa::cccc:0'); // returns an IPRange
  assert(range.matches('aaaa::bbbb:0')); // true
  assert(range.matches('aaaa::bbcc:1234')); // true
  assert(!range.matches('aaaa::1:bbbb:0')); // false

  const subnet = getMatch('a:b:c:d::/64'); // returns an IPSubnetwork
  assert(subnet.matches('a:b:c:d::')); // true
  assert(subnet.matches('a:b:c:d:ffff:ffff:ffff:ffff')); // true
  assert(subnet.matches('a:b:c:d:1:2:3:4')); // true
  assert(!subnet.matches('a:b:c:dd::')); // false
  assert(!subnet.matches('a:b:c:cfff::')); // false
  assert(!subnet.matches('c::')); // false

  /** String representations */

  // toString() for IPv6 produces the shortest possible address
  assert(new IPv6('a:0:0::B:0:C').toString() === 'a::b:0:c');

  // Other string (or similar) representation methods:
  assert(new IPv6('a:0:0::B:0:C').toLongString() === 'a:0:0:0:0:b:0:c');
  assert(new IPv6('a:0:0::B:0:C').toFullString() === '000a:0000:0000:0000:0000:000b:0000:000c');
  assert(new IPv6('::ffff:a9db:d85').toMixedString() === '::ffff:169.219.13.133');
  assert(new IPv6('::ffff:a9db:*').toMixedString() === '::ffff:169.219.*.*');
  assert(JSON.stringify(new IPv6('a:0:*::B:0:C').toHextets()) === '["a","0","*","0","0","b","0","c"]');

  // IPRange/IPSubnetwork use the shortened .toString() for IPv6:
  assert(getMatch('a::bc:1234/112').toString() === 'a::bc:0/112');

  // Super short notation of IPv6 unspecified address
  assert(new IPv6('::').toString() === '::');
  // Quite short notation of e.g. IPv6 localhost address
  assert(new IPv6('::1').toString() === '::1');
  // Short notation but the other way around
  assert(new IPv6('A::').toString() === 'a::');

  // IPs that are known to be mixed format should have .toString() return the mixed format
  assert(new IPv6('::ffff:a9db:*').toString() === '::ffff:169.219.*.*');
  assert(new IPv6('::ffff:0:a9:0').toString() === '::ffff:0:0.169.0.0');

  // Now we should also be able to parse mixed formats:
  assert(new IPv6('::ffff:0:0.169.0.0').toString() === '::ffff:0:0.169.0.0');
}

/** Special cases */
{
  // In version 1.1.0 and earlier, `new IPMatch(input)` was basically what the
  // current `getMatch(input)` is. While TypeScript typing complains we can't
  // use it like that anymore (as expected), it still has to be able to function
  // this way to keep compatibility with older code still using this constructor.
  // @ts-expect-error
  assert(new IPMatch('127.0.0.1') instanceof IPv4);
}

console.log('Seems like the demo/test works fine');
