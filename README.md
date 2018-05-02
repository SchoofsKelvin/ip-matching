
# IP-Matching

### Installation
```bash
npm install --save ip-matching
# or
yarn add ip-matcher
```

### Usage
```ts
import { matches } from 'ip-matching';

const assert = (b: any) => { if (!b) throw new Error('oops'); };

// matches(ip: string | IP, target: string | IPMatch): boolean;

matches('10.0.0.1', '10.0.0.0/24'); // true
matches('10.0.1.1', '10.0.0.0/24'); // false
matches('abc::def', 'abc:*::def'); // true
matches('abc::def', 'abc:9::def'); // false
```
***Note**: The `matches` function and all constructors error for invalid inputs*

Check [Allowed patterns](#Allowed%20patterns) below for all possible patterns.

You can take a look at the [test code](https://github.com/SchoofsKelvin/ip-matching/blob/master/src/test.ts) for a quick overview.

### Allowed patterns
* IP (IPv4/IPv6)
    * Regular IPv4: `10.0.0.0`
    * Wildcard IPv4: `10.0.0.*` or even `10.*.0.*`
    * Regular IPv6: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
    * Shortened IPv6: `2001:db8:85a3::8a2e:0370:7334` or `::abc` or `abc::`
    * Wildcard IPv6: `2001::*` or even `2001::*:abc:*`
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
