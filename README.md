
# IP-Matching

Quick and easy-to-use checking whether an IP belongs to a range, subnetwork or IP with wildcards.

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
import { IPMatch, IPSubnetwork, matches } from 'ip-matching';

// matches(ip: string | IP, target: string | IPMatch): boolean;

matches('10.0.0.1', '10.0.0.0/24'); // true
matches('10.0.1.1', '10.0.0.0/24'); // false
matches('abc::def', 'abc:*::def'); // true
matches('abc::def', 'abc:9::def'); // false

// IPMatch constructor actually returns an instance of
// IPv4, IPv6, IPRange or IPSubnetwork, all extending IPMatch.
// Could use the constructors for ^ to force user input to be e.g. a subnet.
const mySubnet = new IPMatch('10.0.5.0/24');
assert(mySubnet.type === 'IPSubnetwork'); // 'IPSubnetwork'
assert(mySubnet instanceof IPSubnetwork); // true
assert(mySubnet instanceof IPMatch); // true
assert(mySubnet.matches('10.0.5.4')); // true
assert(!mySubnet.matches('10.0.6.4')); // false

assert(new IPv6('a:0:0::B:0:C').toString() === 'a::b:0:c');
assert(new IPv6('a:0:0::B:0:C').toLongString() === 'a:0:0:0:0:b:0:c');
assert(new IPv6('a:0:0::B:0:C').toFullString() === '000a:0000:0000:0000:0000:000b:0000:000c');
assert(new IPv6('::ffff:a9db:*').toMixedString() === '::ffff:169.219.*.*');
```
***Note**: The `matches` function and all constructors error for invalid inputs*

You can take a look at the [test code](https://github.com/SchoofsKelvin/ip-matching/blob/master/src/test.ts) for a quick overview of formats IPMatch/matches accepts.

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

### Links
* GitHub: https://github.com/SchoofsKelvin/ip-matching
* NPM: https://www.npmjs.com/package/ip-matching
