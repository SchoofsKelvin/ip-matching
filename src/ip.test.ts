
import { getMatch, IPMask, IPMatch, IPRange, IPSubnetwork, IPv4, IPv6, matches } from '.';

console.log('===== RUNNING IP TESTS =====');

const assert = (b: any) => { if (!b) throw new Error('oops'); };

// Using the helper function matches
// matches(ip: string | IP, target: string | IPMatch): boolean;
assert(matches('10.0.0.1', '10.0.0.0/24')); // true
assert(!matches('10.0.1.1', '10.0.0.0/24')); // false
assert(matches('abc::def', 'abc:*::def')); // true
assert(!matches('abc::def', 'abc:9::def')); // false
assert(matches('0001:2:3:4:5:6:7', '1:2:3:4:5:6:7')); // true

// getMatch returns an instance of
// IPv4, IPv6, IPRange, IPSubnetwork or IPMask, all extending IPMatch
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

  const mask = getMatch('10.20.130.40/255.0.128.0'); // returns an IPMask
  assert(mask.toString() === '10.0.128.0/255.0.128.0');
  assert(mask.matches('10.20.130.40')); // true
  assert(mask.matches('10.30.130.50')); // true
  assert(mask.matches('10.20.150.50')); // true
  assert(!mask.matches('10.20.10.50')); // false
  assert(mask.matches('10.20.255.255')); // true
  assert(mask.matches('10.50.130.50')); // true
  assert(!mask.matches('11.50.130.50')); // false
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

  const mask = getMatch('a:b:cccc:d::/ffff:0:ff00:0::'); // returns an IPMask
  assert(mask.toString() === 'a:0:cc00::/ffff:0:ff00::');
  assert(mask.matches('a:0:cc00::')); // true
  assert(mask.matches('a:0:cc00::1')); // true
  assert(mask.matches('a:0:ccdd::')); // true
  assert(!mask.matches('a::')); // false
  assert(!mask.matches('a:0:dd00::')); // false
  assert(!mask.matches('b:0:cc00::')); // false

  /** String representations */

  // toString() for IPv6 produces the shortest possible address
  assert(new IPv6('a:0:0::B:0:C').toString() === 'a::b:0:c');

  // Other string (or similar) representation methods:
  assert(new IPv6('a:0:0::B:0:C').toLongString() === 'a:0:0:0:0:b:0:c');
  assert(new IPv6('a:0:0::B:0:C').toFullString() === '000a:0000:0000:0000:0000:000b:0000:000c');
  assert(new IPv6('::ffff:a9db:d85').toMixedString() === '::ffff:169.219.13.133');
  assert(new IPv6('::ffff:a9db:*').toMixedString() === '::ffff:169.219.*.*');
  assert(new IPv6('a::10.0.0.0').toMixedString() === 'a::10.0.0.0');
  assert(JSON.stringify(new IPv6('a:0:*::B:0:C').toHextets()) === '["a","0","*","0","0","b","0","c"]');

  // IPRange/IPSubnetwork use the shortened .toString() for IPv6:
  assert(getMatch('a::bc:1234/112').toString() === 'a::bc:0/112');
  // IPMask also uses the shortened .toString() for IPv6:
  assert(getMatch('a::abbc:1234/ffff::ff80:000f').toString() === 'a::ab80:4/ffff::ff80:f');

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

/* IPMatch.prototype.equals */
{
  const matches: IPMatch[] = [
    getMatch('10.20.30.40'),
    getMatch('10.20.30.50'),
    getMatch('10.20.30.40/16'),
    getMatch('10.20.30.40/24'),
    getMatch('10.20.30.40/32'),
    getMatch('10.20.30.40-10.20.30.40'),
    getMatch('10.20.30.0-10.20.30.255'),
    getMatch('a::bc:1234'),
    getMatch('a::bc:5678'),
    getMatch('a::bc:1234/64'),
    getMatch('a::bc:1234/112'),
    getMatch('a::bc:1234/128'),
    getMatch('a::bc:1234-a::bc:1234'),
    getMatch('a::bc:0-a::bc:ffff'),
  ];
  let failed = false;
  for (const a of matches) {
    for (const b of matches) {
      const eq = a.equals(b);
      if (eq === (a === b)) continue;
      console.error(`Matches '${a}' and '${b}' where unexpectedly ${eq ? 'equal' : 'unequal'}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
}

/* convertToMasks and convertToSubnets for IPv4 */
{
  assert(getMatch('10.0.0.1/24').convertToMasks().toString() === '10.0.0.0/255.255.255.0')
  assert(getMatch('10.0.0.1').convertToMasks().toString() === '10.0.0.1/255.255.255.255')
  assert(getMatch('10.*.0.1').convertToMasks().toString() === '10.0.0.1/255.0.255.255')
  assert(getMatch('10.0.0.1/255.0.0.0').convertToMasks().toString() === '10.0.0.0/255.0.0.0')
  const match = getMatch('1.1.1.111-1.1.1.120') as IPRange;
  const masks: IPMask[] = match.convertToMasks();
  assert(masks.length === 3);
  assert(masks[0].toString() === '1.1.1.111/255.255.255.255');
  assert(masks[1].toString() === '1.1.1.112/255.255.255.248');
  assert(masks[2].toString() === '1.1.1.120/255.255.255.255');
  console.log(`Masks for ${match}:`);
  masks.forEach((m, i) => console.log(`  ${i}. ${m.toString()}`));
  const subnets = match.convertToSubnets();
  assert(subnets.length === 3);
  assert(subnets[0].toString() === '1.1.1.111/32');
  assert(subnets[1].toString() === '1.1.1.112/29');
  assert(subnets[2].toString() === '1.1.1.120/32');
  console.log(`Subnets for ${match}:`);
  subnets.forEach((s, i) => console.log(`  ${i}. ${s.toString()}`));
}

/* convertToMasks and convertToSubnets for IPv6 */
{
  assert(getMatch('a::b/24').convertToMasks().toString() === 'a::/ffff:ff00::')
  assert(getMatch('a::b').convertToMasks().toString() === 'a::b/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')
  assert(getMatch('a:*::b').convertToMasks().toString() === 'a::b/ffff::ffff:ffff:ffff:ffff:ffff:ffff')
  assert(getMatch('a::b/ffff::f00').convertToMasks().toString() === 'a::/ffff::f00')
  const match = getMatch('a:b:0:ff::-a:b:8:ffff::') as IPRange;
  const masks: IPMask[] = match.convertToMasks();
  assert(masks.length === 29);
  assert(masks[0].toString() === 'a:b:0:ff::/ffff:ffff:ffff:ffff::');
  assert(masks[11].toString() === 'a:b:4::/ffff:ffff:fffc::');
  assert(masks[28].toString() === 'a:b:8:ffff::/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
  console.log(`Masks for ${match}:`);
  masks.forEach((m, i) => console.log(`  ${i}. ${m.toString()}`));
  const subnets = match.convertToSubnets();
  assert(subnets.length === 29);
  assert(subnets[0].toString() === 'a:b:0:ff::/64');
  assert(subnets[11].toString() === 'a:b:4::/46');
  assert(subnets[28].toString() === 'a:b:8:ffff::/128');
  console.log(`Subnets for ${match}:`);
  subnets.forEach((s, i) => console.log(`  ${i}. ${s.toString()}`));
}

/* Special cases */
{
  // In version 1.1.0 and earlier, `new IPMatch(input)` was basically what the
  // current `getMatch(input)` is. While TypeScript typing complains we can't
  // use it like that anymore (as expected), it still has to be able to function
  // this way to keep compatibility with older code still using this constructor.
  // @ts-expect-error
  assert(new IPMatch('127.0.0.1') instanceof IPv4);
}

console.log('Tests ran fine');
