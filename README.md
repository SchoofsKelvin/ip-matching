
# IP-Matching

Standalone module with some handy features regarding IPs:
- Quick and easy-to-use way to check whether an IP meets a requirement
- Support for IPv4/IPv6 wildcard addresses, ranges, subnetworks and masks.
- Supports both parsing and outputting all common IPv6 notations
- Utility methods, e.g. next/previous IP, range to a list of CIDRs, ...
- Every release is thoroughly [tested](https://github.com/SchoofsKelvin/ip-matching/blob/master/src/ip.test.ts) before published

### Installation
```bash
npm install --save ip-matching
# or
yarn add ip-matching
```

Comes with its own built-in [TypeScript declarations](https://github.com/SchoofsKelvin/ip-matching/blob/master/api/index.d.ts)
 with included documentation.

### Example
```ts
import { getMatch, IPMatch, IPSubnetwork, matches } from 'ip-matching';

// matches(ip: string | IP, target: string | IPMatch): boolean;

matches('10.0.0.1', '10.0.0.0/24'); // true
matches('10.0.1.1', '10.0.0.0/24'); // false
matches('abc::def', 'abc:*::def'); // true
matches('abc::def', 'abc:9::def'); // false
matches('0001:2:3:4:5:6:7', '1:2:3:4:5:6:7'); // true

// getMatch returns an instance of
// IPv4, IPv6, IPRange, IPSubnetwork or IPMask, all extending IPMatch
const mySubnet = getMatch('fefe::0001:abcd/112');
mySubnet.type; // 'IPSubnetwork'
mySubnet instanceof IPSubnetwork; // true
mySubnet instanceof IPMatch; // true
mySubnet.matches('FEFE::1:bbbb'); // true
mySubnet.matches('FEFE::2:bbbb'); // false
mySubnet.equals(new IPSubnetwork(new IPv6('fefe::1:abcd'), 112)); // true

new IPv6('a:0:0::B:0:C').toString() // 'a::b:0:c'
new IPv6('a:0:0::B:0:C').toLongString() // 'a:0:0:0:0:b:0:c'
new IPv6('a:0:0::B:0:C').toFullString() // '000a:0000:0000:0000:0000:000b:0000:000c'
new IPv6('::ffff:a9db:*').toMixedString() // '::ffff:169.219.*.*'

getMatch('a::bc:1234/112').toString() // 'a::bc:0/112'
getMatch('a::abbc:1234/ffff::ff80:000f').toString() // 'a::ab80:4/ffff::ff80:f'
```
***Note**: The `matches` function and all constructors error for invalid inputs*

You can take a look at the [test code](https://github.com/SchoofsKelvin/ip-matching/blob/master/src/ip.test.ts) for a demonstration of all the features.

### Allowed patterns
* IP (IPv4/IPv6)
    * Regular IPv4: `10.0.0.0`
    * Wildcard IPv4: `10.0.0.*` or even `10.*.0.*`
    * Regular IPv6: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
    * Shortened IPv6: `2001:db8:85a3::8a2e:0370:7334` or `::` or `::1` or `a::`
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

The IPMask toString() method does not automatically simplify e.g. `/255.0.0.0` to `/8`, even though those are equivalent. Since 2.0.0, IPMask comes with a method `convertToSubnet()` which returns an equivalent IPSubnetwork if possible, otherwise `undefined`.

### Links
* GitHub: https://github.com/SchoofsKelvin/ip-matching
* NPM: https://www.npmjs.com/package/ip-matching
