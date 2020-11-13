
# IP-Matching

Quick and easy-to-use checking whether an IP belongs to a range, subnetwork, mask or IP with wildcards.

The IPv6 class also comes with a few handy methods to convert it to several string representations.

### Installation
```bash
npm install --save ip-matching
# or
yarn add ip-matching
```

Comes with its own TypeScript declarations with included documentation.

### Example
```ts
import { getMatch, IPMatch, IPSubnetwork, matches } from 'ip-matching';

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

assert(new IPv6('a:0:0::B:0:C').toString() === 'a::b:0:c');
assert(new IPv6('a:0:0::B:0:C').toLongString() === 'a:0:0:0:0:b:0:c');
assert(new IPv6('a:0:0::B:0:C').toFullString() === '000a:0000:0000:0000:0000:000b:0000:000c');
assert(new IPv6('::ffff:a9db:*').toMixedString() === '::ffff:169.219.*.*');

assert(getMatch('a::bc:1234/112').toString() === 'a::bc:0/112');
assert(getMatch('a::abbc:1234/ffff::ff80:000f').toString() === 'a::ab80:4/ffff::ff80:f');
```
***Note**: The `matches` function and all constructors error for invalid inputs*

You can take a look at the [test code](https://github.com/SchoofsKelvin/ip-matching/blob/master/src/ip.test.ts) for a demonstration of all the features.

### Allowed patterns
* IP (IPv4/IPv6)
    * Regular IPv4: `10.0.0.0`
    * Wildcard IPv4: `10.0.0.*` or even `10.*.0.*`
    * Regular IPv6: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
    * Shortened IPv6: `2001:db8:85a3::8a2e:0370:7334` or `::abc` or `abc::`
    * Wildcard IPv6: `2001::*` or even `2001::*:abc:*`
    * Mixed IPv6 (mapped IPv4): `::ffff:127.0.0.1` _(no wildcards allowed in IPv4 part)_
    * **Not allowed**: `10.0.1*.0` or `2001::a*c`
* IP Range
    * IPv4: `10.0.0.0-10.1.2.3`
    * IPv6: `2001::abc-2001::1:ffff`
    * **Note**: Left side has to be "lower" than the right side
* IP Subnetwork
    * IPv4: `10.0.0.0/16`
    * IPv6: `2001::/64`
* IP Mask
    * IPv4: `10.0.0.0/255.0.64.0`
    * IPv6: `2001:abcd::/ffff:ff8::`

For legacy reasons, IPSubnetwork and IPMask are separate classes, even though the former can be seen as a simplified version of the latter. The IPMask toString() method does not automatically simplify e.g. `/255.0.0.0` to `/8`, even though those are equivalent.

### Links
* GitHub: https://github.com/SchoofsKelvin/ip-matching
* NPM: https://www.npmjs.com/package/ip-matching
