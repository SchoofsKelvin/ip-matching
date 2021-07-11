
# IP-Matching

[![GitHub package version](https://img.shields.io/github/v/release/SchoofsKelvin/ip-matching?include_prereleases&label=GitHub)](https://github.com/SchoofsKelvin/ip-matching)
[![NPM](https://img.shields.io/npm/v/ip-matching?label=NPM)](https://www.npmjs.com/package/ip-matching)
[![NPM downloads](https://img.shields.io/npm/dt/ip-matching?color=blue&label=NPM%20downloads)](https://www.npmjs.com/package/ip-matching)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/c62ef110c85246a58adc29ab8de2538d)](https://www.codacy.com/gh/SchoofsKelvin/ip-matching/dashboard)

[![GitHub Sponsors](https://img.shields.io/github/sponsors/SchoofsKelvin?color=green&label=GitHub%20Sponsors)](https://github.com/sponsors/SchoofsKelvin)
[![Donate](./.github/paypal.png)](https://www.paypal.me/KSchoofs)

Standalone module with some handy features regarding IPs:
- Quick and easy-to-use way to check whether an IP meets a requirement
- Support for IPv4/IPv6 wildcard addresses, ranges, subnetworks and masks.
- Supports both parsing and outputting all common IPv6 notations
- Utility methods, e.g. next/previous IP, range to a list of CIDRs, ...
- Every release is thoroughly [tested](https://github.com/SchoofsKelvin/ip-matching/tree/master/src/) and [linted](https://github.com/SchoofsKelvin/ip-matching/actions) before published

## Installation
```bash
npm install --save ip-matching
# or
yarn add ip-matching
```

Comes with its own built-in [TypeScript declarations](https://github.com/SchoofsKelvin/ip-matching/blob/master/api/index.d.ts)
 with included documentation.

## Example
```ts
import { getMatch, IPMatch, IPSubnetwork, IPRange, matches } from 'ip-matching';

// matches(ip: string | IP, target: string | IPMatch): boolean;

matches('10.0.0.1', '10.0.0.0/24'); // true
matches('10.0.1.1', '10.0.0.0/24'); // false
matches('abc::def', 'abc:*::def'); // true
matches('abc::def', 'abc:9::def'); // false
matches('0001:2:3:4:5:6:7', '1:2:3:4:5:6:7'); // true

// getMatch returns an instance of
// IPv4, IPv6, IPRange, IPSubnetwork or IPMask, all extending IPMatch
const mySubnet: IPMatch = getMatch('fefe::0001:abcd/112');
mySubnet.type; // 'IPSubnetwork'
mySubnet instanceof IPSubnetwork; // true
mySubnet instanceof IPMatch; // true
mySubnet.toString(); // 'fefe::1:0/112'
mySubnet.matches('FEFE::1:bbbb'); // true
mySubnet.matches('FEFE::2:bbbb'); // false
mySubnet.equals(new IPSubnetwork(new IPv6('fefe::1:abcd'), 112)); // true
mySubnet.getAmount(); // 65536
(mySubnet as IPSubnetwork).getLast().toString(); // 'fefe::1:ffff'

const myIp = new IPv6('a:0:0::B:0:C');
myIp.toString(); // 'a::b:0:c'
myIp.toLongString(); // 'a:0:0:0:0:b:0:c'
myIp.toFullString(); // '000a:0000:0000:0000:0000:000b:0000:000c'
new IPv6('::ffff:a9db:*').toMixedString(); // '::ffff:169.219.*.*'

const myRange = getMatch('10.0.0.0-10.1.2.3') as IPRange;
myRange.convertToMasks().map((mask: IPMask) => mask.convertToSubnet().toString());
// [ '10.0.0.0/16', '10.1.0.0/23', '10.1.2.0/30' ]

const mask1 = getMatch('10.0.1.0/255.0.255.0') as IPMask;
const mask2 = getMatch('10.0.0.0/128.0.0.0') as IPMask;
mask1.isSubsetOf(mask2); // true
mask2.getAmount(); // 2147483648

getMatch('a::abbc:1234/ffff::ff80:000f').toString(); // 'a::ab80:4/ffff::ff80:f'
```
***Note**: The `matches` function and all constructors error for invalid inputs*

You can take a look at the [test code](https://github.com/SchoofsKelvin/ip-matching/blob/master/src/ip.test.ts) or the [TypeScript declarations](https://github.com/SchoofsKelvin/ip-matching/blob/master/api/index.d.ts) for all the features.

## Allowed patterns
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
    * IPv6: `2001::/123`
* IP Mask
    * IPv4: `10.0.0.0/255.0.64.0`
    * IPv6: `2001:abcd::/ffff:ff8::`

The IPMask's `toString()` method does not automatically simplify e.g. `/255.0.0.0` to `/8`, even though those are equivalent. Since 2.0.0, IPMask comes with a method `convertToSubnet()` which returns an equivalent IPSubnetwork if possible, otherwise `undefined`.

## Links
* GitHub: https://github.com/SchoofsKelvin/ip-matching
* NPM: https://www.npmjs.com/package/ip-matching
