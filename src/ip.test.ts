
import { getMatch, IPMask, IPMatch, IPRange, IPv4, IPv6, matches } from '.';
import { IPSubnetwork } from './ip';

function expectGetMatch<T extends IPMatch>(str: string, type: new (...args: any) => T): T {
  const result = getMatch(str);
  expect(result).toBeInstanceOf(IPMatch);
  expect(result).toBeInstanceOf(type);
  return result as T;
}

function testIP<T extends IPMatch>(ip: string, type: new (...args: any) => T, func: (obj: T) => void): void {
  test(ip, () => {
    const obj = getMatch(ip) as T;
    expect(obj).toBeInstanceOf(IPMatch);
    expect(obj).toBeInstanceOf(type);
    return func(obj);
  });
}

const toString = (obj: any): string => `${obj}`;

describe(IPv4, () => {
  testIP('10.0.0.0', IPv4, ip => {
    expect(ip.exact()).toBe(true);
    expect(ip.matches('10.0.0.0')).toBe(true);
    expect(ip.matches('9.255.255.255')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('10.0.0.1');
    expect(ip.getPrevious()?.toString()).toBe('9.255.255.255');
  });
  testIP('10.0.*.0', IPv4, ip => {
    expect(ip.exact()).toBe(false);
    expect(ip.matches('10.0.0.0')).toBe(true);
    expect(ip.matches('10.0.123.0')).toBe(true);
    expect(ip.matches('10.0.0.123')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('10.0.*.1');
    expect(ip.getPrevious()?.toString()).toBe('9.255.*.255');
  });
  testIP('10.0.*.255', IPv4, ip => {
    expect(ip.exact()).toBe(false);
    expect(ip.matches('10.0.0.255')).toBe(true);
    expect(ip.matches('10.0.123.255')).toBe(true);
    expect(ip.matches('10.0.0.123')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('10.1.*.0');
    expect(ip.getPrevious()?.toString()).toBe('10.0.*.254');
  });
  testIP('10.0.0.*', IPv4, ip => {
    expect(ip.exact()).toBe(false);
    expect(ip.matches('10.0.0.0')).toBe(true);
    expect(ip.matches('10.0.0.123')).toBe(true);
    expect(ip.matches('10.0.123.0')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('10.0.1.*');
    expect(ip.getPrevious()?.toString()).toBe('9.255.255.*');
  });
  testIP('10.20.30.255', IPv4, ip => {
    expect(ip.exact()).toBe(true);
    expect(ip.matches('10.20.30.255')).toBe(true);
    expect(ip.matches('10.0.0.0')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('10.20.31.0');
    expect(ip.getPrevious()?.toString()).toBe('10.20.30.254');
  });
  testIP('0.0.0.0', IPv4, ip => {
    expect(ip.exact()).toBe(true);
    expect(ip.matches('0.0.0.0')).toBe(true);
    expect(ip.matches('0.0.0.1')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('0.0.0.1');
    expect(ip.getPrevious()?.toString()).toBeUndefined();
  });
  testIP('255.255.255.255', IPv4, ip => {
    expect(ip.exact()).toBe(true);
    expect(ip.matches('255.255.255.255')).toBe(true);
    expect(ip.matches('255.255.255.254')).toBe(false);
    expect(ip.getNext()?.toString()).toBeUndefined();
    expect(ip.getPrevious()?.toString()).toBe('255.255.255.254');
  });
});

describe(IPv6, () => {
  testIP('aaaa::bbbb', IPv6, ip => {
    expect(ip.exact()).toBe(true);
    expect(ip.matches('aaaa::bbbb')).toBe(true);
    expect(ip.matches('aaaa::cccc')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('aaaa::bbbc');
    expect(ip.getPrevious()?.toString()).toBe('aaaa::bbba');
  });
  testIP('aaaa::*:cccc', IPv6, ip => {
    expect(ip.exact()).toBe(false);
    expect(ip.matches('aaaa::cccc')).toBe(true);
    expect(ip.matches('aaaa::1234:cccc')).toBe(true);
    expect(ip.matches('aaaa::cccd')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('aaaa::*:cccd');
    expect(ip.getPrevious()?.toString()).toBe('aaaa::*:cccb');
  });
  testIP('a::b', IPv6, ip => {
    expect(ip.exact()).toBe(true);
    expect(ip.matches('a::b')).toBe(true);
    expect(ip.matches('a::0:b')).toBe(true);
    expect(ip.matches('a:0::b')).toBe(true);
    expect(ip.matches('a:0:0:0:0:0:0:b')).toBe(true);
    expect(ip.matches('b::b')).toBe(false);
    expect(ip.matches('b::0:b')).toBe(false);
    expect(ip.matches('b:0::b')).toBe(false);
    expect(ip.matches('b:0:0:0:0:0:0:b')).toBe(false);
    expect(ip.getNext()?.toString()).toBe('a::c');
    expect(ip.getPrevious()?.toString()).toBe('a::a');
  });
  testIP('a:0:0::B:0:C', IPv6, ip => {
    expect(ip.toString()).toBe('a::b:0:c');
    expect(ip.toLongString()).toBe('a:0:0:0:0:b:0:c');
    expect(ip.toFullString()).toBe('000a:0000:0000:0000:0000:000b:0000:000c');
    expect(ip.toHextets()).toEqual(['a', '0', '0', '0', '0', 'b', '0', 'c']);
    expect(ip.getNext()?.toString()).toBe('a::b:0:d');
    expect(ip.getPrevious()?.toString()).toBe('a::b:0:b');
  });
  testIP('a:0:*::B:0:C', IPv6, ip => {
    expect(ip.toString()).toBe('a:0:*::b:0:c');
    expect(ip.toLongString()).toBe('a:0:*:0:0:b:0:c');
    expect(ip.toFullString()).toBe('000a:0000:*:0000:0000:000b:0000:000c');
    expect(ip.toHextets()).toEqual(['a', '0', '*', '0', '0', 'b', '0', 'c']);
    expect(ip.getNext()?.toString()).toBe('a:0:*::b:0:d');
    expect(ip.getPrevious()?.toString()).toBe('a:0:*::b:0:b');
  });
  testIP('::ffff:a9db:d85', IPv6, ip => {
    expect(ip.toString()).toBe('::ffff:169.219.13.133');
    expect(ip.toMixedString()).toBe('::ffff:169.219.13.133');
    expect(ip.getNext()?.toString()).toBe('::ffff:169.219.13.134');
    expect(ip.getPrevious()?.toString()).toBe('::ffff:169.219.13.132');
  });
  testIP('::ffff:a9db:*', IPv6, ip => {
    expect(ip.toString()).toBe('::ffff:169.219.*.*');
    expect(ip.toMixedString()).toBe('::ffff:169.219.*.*');
    expect(ip.getNext()?.toString()).toBe('::ffff:169.220.*.*');
    expect(ip.getPrevious()?.toString()).toBe('::ffff:169.218.*.*');
  });
  testIP('::ffff:0:0.169.0.0', IPv6, ip => {
    expect(ip.toString()).toBe('::ffff:0:0.169.0.0');
    expect(ip.toMixedString()).toBe('::ffff:0:0.169.0.0');
    expect(ip.getNext()?.toString()).toBe('::ffff:0:0.169.0.1');
    expect(ip.getPrevious()?.toString()).toBe('::ffff:0:0.168.255.255');
  });
  testIP('a::10.0.0.0', IPv6, ip => {
    expect(ip.toString()).toBe('a::a00:0');
    expect(ip.toMixedString()).toBe('a::10.0.0.0');
    expect(ip.getNext()?.toMixedString()).toBe('a::10.0.0.1');
    expect(ip.getPrevious()?.toString()).toBe('a::9ff:ffff');
  });
  testIP('::', IPv6, ip => {
    expect(ip.toString()).toBe('::');
    expect(ip.getNext()?.toString()).toBe('::1');
    expect(ip.getPrevious()?.toString()).toBeUndefined();
  });
  testIP('::1', IPv6, ip => {
    expect(ip.toString()).toBe('::1');
    expect(ip.getNext()?.toString()).toBe('::2');
    expect(ip.getPrevious()?.toString()).toBe('::');
  });
  testIP('A::', IPv6, ip => {
    expect(ip.toString()).toBe('a::');
    expect(ip.getNext()?.toString()).toBe('a::1');
    expect(ip.getPrevious()?.toString()).toBe('9:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
  });
  testIP('::*', IPv6, ip => {
    expect(ip.toString()).toBe('::*');
    expect(ip.getNext()?.toString()).toBe('::1:*');
    expect(ip.getPrevious()?.toString()).toBeUndefined();
  });
  testIP('::*:ffff', IPv6, ip => {
    expect(ip.toString()).toBe('::*:ffff');
    expect(ip.getNext()?.toString()).toBe('::1:*:0');
    expect(ip.getPrevious()?.toString()).toBe('::*:fffe');
  });
  testIP('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', IPv6, ip => {
    expect(ip.toString()).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    expect(ip.getNext()?.toString()).toBeUndefined();
    expect(ip.getPrevious()?.toString()).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe');
  });
});

describe(IPRange, () => {
  testIP('10.0.0.0-10.1.255.255', IPRange, range => {
    expect(range.toString()).toBe('10.0.0.0-10.1.255.255');
    expect(range.matches('10.0.0.5')).toBe(true);
    expect(range.matches('10.0.5.5')).toBe(true);
    expect(range.matches('10.5.5.5')).toBe(false);
    const left = expectGetMatch('10.0.0.0', IPv4);
    expect(range.left.equals(left)).toBe(true);
    const right = expectGetMatch('10.1.255.255', IPv4);
    expect(range.right.equals(right)).toBe(true);
  });
  testIP('aaaa::bbbb:0-aaaa::cccc:00', IPRange, range => {
    expect(range.toString()).toBe('aaaa::bbbb:0-aaaa::cccc:0');
    expect(range.matches('aaaa::bbbb:0')).toBe(true);
    expect(range.matches('aaaa::bbcc:1234')).toBe(true);
    expect(range.matches('aaaa::1:bbbb:0')).toBe(false);
    const left = expectGetMatch('aaaa::bbbb:0', IPv6);
    expect(range.left.equals(left)).toBe(true);
    const right = expectGetMatch('aaaa::cccc:0', IPv6);
    expect(range.right.equals(right)).toBe(true);
  });
  describe('convertToSubnets', () => {
    testIP('1.1.1.111-1.1.1.120', IPRange, range => {
      expect(range.convertToSubnets().map(toString)).toEqual([
        '1.1.1.111/32',
        '1.1.1.112/29',
        '1.1.1.120/32',
      ]);
    });
    testIP('a:b:0:ff::-a:b:8:ffff::', IPRange, range => {
      expect(range.convertToSubnets().map(toString)).toEqual([
        'a:b:0:ff::/64',
        'a:b:0:100::/56',
        'a:b:0:200::/55',
        'a:b:0:400::/54',
        'a:b:0:800::/53',
        'a:b:0:1000::/52',
        'a:b:0:2000::/51',
        'a:b:0:4000::/50',
        'a:b:0:8000::/49',
        'a:b:1::/48',
        'a:b:2::/47',
        'a:b:4::/46',
        'a:b:8::/49',
        'a:b:8:8000::/50',
        'a:b:8:c000::/51',
        'a:b:8:e000::/52',
        'a:b:8:f000::/53',
        'a:b:8:f800::/54',
        'a:b:8:fc00::/55',
        'a:b:8:fe00::/56',
        'a:b:8:ff00::/57',
        'a:b:8:ff80::/58',
        'a:b:8:ffc0::/59',
        'a:b:8:ffe0::/60',
        'a:b:8:fff0::/61',
        'a:b:8:fff8::/62',
        'a:b:8:fffc::/63',
        'a:b:8:fffe::/64',
        'a:b:8:ffff::/128',
      ]);
    });
  });
});

describe(IPSubnetwork, () => {
  testIP('10.20.30.40/16', IPSubnetwork, subnet => {
    expect(subnet.toString()).toBe('10.20.0.0/16');
    expect(subnet.matches('10.20.30.40')).toBe(true);
    expect(subnet.matches('10.20.50.50')).toBe(true);
    expect(subnet.matches('10.20.255.255')).toBe(true);
    expect(subnet.matches('10.20.20.40')).toBe(true);
    expect(subnet.matches('10.21.0.0')).toBe(false);
    expect(subnet.matches('10.21.30.40')).toBe(false);
    expect(subnet.matches('10.5.5.5')).toBe(false);
  });
  testIP('a:b:c:d::/64', IPSubnetwork, subnet => {
    expect(subnet.toString()).toBe('a:b:c:d::/64');
    expect(subnet.matches('a:b:c:d::')).toBe(true);
    expect(subnet.matches('a:b:c:d:ffff:ffff:ffff:ffff')).toBe(true);
    expect(subnet.matches('a:b:c:d:1:2:3:4')).toBe(true);
    expect(subnet.matches('a:b:c:dd::')).toBe(false);
    expect(subnet.matches('a:b:c:cfff::')).toBe(false);
    expect(subnet.matches('c::')).toBe(false);
  });
  testIP('::/0', IPSubnetwork, subnet => {
    expect(subnet.toString()).toBe('::/0');
    expect(subnet.matches('::')).toBe(true);
    expect(subnet.matches('a::b')).toBe(true);
    expect(subnet.getFirst().toString()).toBe('::');
    expect(subnet.getLast().toString()).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    expect(subnet.bits).toBe(0);
  });
  testIP('::/64', IPSubnetwork, subnet => {
    expect(subnet.toString()).toBe('::/64');
    expect(subnet.matches('::')).toBe(true);
    expect(subnet.matches('ffff::')).toBe(false);
    expect(subnet.getFirst().toString()).toBe('::');
    expect(subnet.getLast().toString()).toBe('::ffff:ffff:ffff:ffff');
    expect(subnet.bits).toBe(64);
  });
  testIP('::/128', IPSubnetwork, subnet => {
    expect(subnet.toString()).toBe('::/128');
    expect(subnet.matches('::')).toBe(true);
    expect(subnet.matches('::1')).toBe(false);
    expect(subnet.getFirst().toString()).toBe('::');
    expect(subnet.getLast().toString()).toBe('::');
    expect(subnet.bits).toBe(128);
  });
});

describe(IPMask, () => {
  testIP('10.20.130.40/255.0.128.0', IPMask, mask => {
    expect(mask.toString()).toBe('10.0.128.0/255.0.128.0');
    expect(mask.matches('10.20.130.40')).toBe(true);
    expect(mask.matches('10.30.130.50')).toBe(true);
    expect(mask.matches('10.20.150.50')).toBe(true);
    expect(mask.matches('10.20.10.50')).toBe(false);
    expect(mask.matches('10.20.255.255')).toBe(true);
    expect(mask.matches('10.50.130.50')).toBe(true);
    expect(mask.matches('11.50.130.50')).toBe(false);
  });
  testIP('a:b:cccc:d::/ffff:0:ff00:0::', IPMask, mask => {
    expect(mask.toString()).toBe('a:0:cc00::/ffff:0:ff00::');
    expect(mask.matches('a:0:cc00::')).toBe(true);
    expect(mask.matches('a:0:cc00::1')).toBe(true);
    expect(mask.matches('a:0:ccdd::')).toBe(true);
    expect(mask.matches('a::')).toBe(false);
    expect(mask.matches('a:0:dd00::')).toBe(false);
    expect(mask.matches('b:0:cc00::')).toBe(false);
  });
  describe('equals', () => {
    const matches: IPMatch[] = [
      expectGetMatch('10.20.30.40', IPv4),
      expectGetMatch('10.20.30.50', IPv4),
      expectGetMatch('10.20.30.40/16', IPSubnetwork),
      expectGetMatch('10.20.30.40/24', IPSubnetwork),
      expectGetMatch('10.20.30.40/32', IPSubnetwork),
      expectGetMatch('10.20.30.40-10.20.30.40', IPRange),
      expectGetMatch('10.20.30.0-10.20.30.255', IPRange),
      expectGetMatch('a::bc:1234', IPv6),
      expectGetMatch('a::bc:5678', IPv6),
      expectGetMatch('a::bc:1234/64', IPSubnetwork),
      expectGetMatch('a::bc:1234/112', IPSubnetwork),
      expectGetMatch('a::bc:1234/128', IPSubnetwork),
      expectGetMatch('a::bc:1234-a::bc:1234', IPRange),
      expectGetMatch('a::bc:0-a::bc:ffff', IPRange),
    ];
    test.each(matches)('%s', a => {
      matches.forEach(b => expect(a.equals(b)).toBe(a === b));
    });
  });
  describe('convertToSubnet', () => {
    const entries: [string, string][] = [
      ['10.20.30.40', '10.20.30.40/32'],
      ['10.20.30.50', '10.20.30.50/32'],
      ['10.20.30.40/16', '10.20.30.40/16'],
      ['10.20.30.40/24', '10.20.30.40/24'],
      ['10.20.30.40/32', '10.20.30.40/32'],
      ['10.20.30.64-10.20.30.127', '10.20.30.64/26'],
      ['10.20.30.0-10.20.30.255', '10.20.30.0/24'],
      ['::/::', '::/0'],
      ['::/ffff:ffff:ffff:ffff::', '::/64'],
      ['::/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '::/128'],
      ['a::bc:1234', 'a::bc:1234/128'],
      ['a::bc:5678', 'a::bc:5678/128'],
      ['a::bc:1234/64', 'a::bc:1234/64'],
      ['a::bc:1234/112', 'a::bc:1234/112'],
      ['a::bc:1234/128', 'a::bc:1234/128'],
      ['a::bc:ff00-a::bc:ff0f', 'a::bc:ff00/124'],
      ['a::bc:0-a::bc:ffff', 'a::bc:0/112'],
    ];
    test.each(entries)('expect %s to indirectly convert to %s', (inputStr, outputStr) => {
      const input = getMatch(inputStr);
      const output = expectGetMatch(outputStr, IPSubnetwork);
      const masks = input.convertToMasks();
      expect(masks.length).toBe(1);
      const [mask] = masks;
      const subnet1 = mask.convertToSubnet();
      expect(subnet1?.toString()).toBe(output.toString());
      const subnet2 = mask.convertToSubnet();
      expect(subnet1).toBe(subnet2);
    });
    const invalid: string[] = [
      '0.0.0.0/255.0.255.255',
      '0.0.0.0/255.0.0.255',
      '0.0.0.0/255.0.0.63',
      '0.0.0.0/255.255.255.63',
      '0.0.0.0/254.255.255.255',
      '0.0.0.0/254.255.255.63',
      '::/::ffff',
      '::/ffff::ffff',
      '::/ffff:0:ffff::',
      '::/f0ff::',
    ];
    test.each(invalid)('expect %s to not be convertible to a subnet', inputStr => {
      const input = expectGetMatch(inputStr, IPMask);
      expect(input.convertToSubnet()?.toString()).toBeUndefined();
    });
  });
  describe('isMaskSubsetOfMask', () => {
    const masks = [
      /* mask0 */ getMatch('10.0.0.0/255.255.0.0') as IPMask,
      /* mask1 */ getMatch('10.0.0.0/255.0.0.0') as IPMask,
      /* mask2 */ getMatch('10.0.0.0/0.255.0.0') as IPMask,
      /* mask3 */ getMatch('10.0.0.0/0.0.0.0') as IPMask,
      /* mask4 */ getMatch('10.0.0.0/255.255.1.0') as IPMask,
      /* mask5 */ getMatch('10.0.0.0/0.0.0.1') as IPMask,
      /* mask6 */ getMatch('10.0.0.0/255.255.0.255') as IPMask,
      /* mask7 */ getMatch('11.0.0.0/255.255.0.0') as IPMask,
    ];
    const subsets: number[][] = [
      /* mask0 */[0, 1, 2, 3],
      /* mask1 */[1, 3],
      /* mask2 */[2, 3],
      /* mask3 */[3],
      /* mask4 */[0, 1, 2, 3, 4],
      /* mask5 */[3, 5],
      /* mask6 */[0, 1, 2, 3, 5, 6],
      /* mask7 */[2, 3, 7],
    ];
    for (let a = 0; a < masks.length; a++) {
      for (let b = 0; b < masks.length; b++) {
        test(`is mask${a} (${masks[a]}) a subset of mask${b} (${masks[b]})`, () => {
          const shouldMatch = subsets[a].includes(b);
          expect(masks[a].isSubsetOf(masks[b])).toBe(shouldMatch);
        });
      }
    }
  });
});

describe(matches, () => {
  test.each<[string, string, boolean]>([
    ['10.0.0.1', '10.0.0.0/24', true],
    ['10.0.1.1', '10.0.0.0/24', false],
    ['abc::def', 'abc:*::def', true],
    ['abc::def', 'abc:9::def', false],
    ['0001:2:3:4:5:6:7', '1:2:3:4:5:6:7', true],
  ])('expect matches(%s, %s) to return %s', (a, b, c) => {
    expect(matches(a, b)).toBe(c);
  });
});

describe('convertToMasks', () => {
  testIP('10.0.0.1/24', IPSubnetwork, range => {
    expect(range.convertToMasks().map(toString)).toEqual(['10.0.0.0/255.255.255.0']);
  });
  testIP('10.0.0.1', IPv4, ip => {
    expect(ip.convertToMasks().map(toString)).toEqual(['10.0.0.1/255.255.255.255']);
  });
  testIP('10.*.0.1', IPv4, ip => {
    expect(ip.convertToMasks().map(toString)).toEqual(['10.0.0.1/255.0.255.255']);
  });
  testIP('10.0.0.1/255.0.0.0', IPMask, mask => {
    expect(mask.convertToMasks().map(toString)).toEqual(['10.0.0.0/255.0.0.0']);
  });
  testIP('1.1.1.111-1.1.1.120', IPRange, range => {
    expect(range.convertToMasks().map(toString)).toEqual([
      '1.1.1.111/255.255.255.255',
      '1.1.1.112/255.255.255.248',
      '1.1.1.120/255.255.255.255',
    ]);
  });
  testIP('a::b/32', IPSubnetwork, range => {
    expect(range.convertToMasks().map(toString)).toEqual(['a::/ffff:ffff::']);
  });
  testIP('a::b', IPv6, ip => {
    expect(ip.convertToMasks().map(toString)).toEqual(['a::b/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']);
  });
  testIP('a:*::b', IPv6, ip => {
    expect(ip.convertToMasks().map(toString)).toEqual(['a::b/ffff::ffff:ffff:ffff:ffff:ffff:ffff']);
  });
  testIP('a:bbcc::d/ffff:ff00::', IPMask, mask => {
    expect(mask.convertToMasks().map(toString)).toEqual(['a:bb00::/ffff:ff00::']);
  });
  testIP('a:b:0:ff::-a:b:8:ffff::', IPRange, range => {
    expect(range.convertToMasks().map(toString)).toEqual([
      'a:b:0:ff::/ffff:ffff:ffff:ffff::',
      'a:b:0:100::/ffff:ffff:ffff:ff00::',
      'a:b:0:200::/ffff:ffff:ffff:fe00::',
      'a:b:0:400::/ffff:ffff:ffff:fc00::',
      'a:b:0:800::/ffff:ffff:ffff:f800::',
      'a:b:0:1000::/ffff:ffff:ffff:f000::',
      'a:b:0:2000::/ffff:ffff:ffff:e000::',
      'a:b:0:4000::/ffff:ffff:ffff:c000::',
      'a:b:0:8000::/ffff:ffff:ffff:8000::',
      'a:b:1::/ffff:ffff:ffff::',
      'a:b:2::/ffff:ffff:fffe::',
      'a:b:4::/ffff:ffff:fffc::',
      'a:b:8::/ffff:ffff:ffff:8000::',
      'a:b:8:8000::/ffff:ffff:ffff:c000::',
      'a:b:8:c000::/ffff:ffff:ffff:e000::',
      'a:b:8:e000::/ffff:ffff:ffff:f000::',
      'a:b:8:f000::/ffff:ffff:ffff:f800::',
      'a:b:8:f800::/ffff:ffff:ffff:fc00::',
      'a:b:8:fc00::/ffff:ffff:ffff:fe00::',
      'a:b:8:fe00::/ffff:ffff:ffff:ff00::',
      'a:b:8:ff00::/ffff:ffff:ffff:ff80::',
      'a:b:8:ff80::/ffff:ffff:ffff:ffc0::',
      'a:b:8:ffc0::/ffff:ffff:ffff:ffe0::',
      'a:b:8:ffe0::/ffff:ffff:ffff:fff0::',
      'a:b:8:fff0::/ffff:ffff:ffff:fff8::',
      'a:b:8:fff8::/ffff:ffff:ffff:fffc::',
      'a:b:8:fffc::/ffff:ffff:ffff:fffe::',
      'a:b:8:fffe::/ffff:ffff:ffff:ffff::',
      'a:b:8:ffff::/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    ]);
  });
});

describe('getAmount', () => {
  describe(IPv4, () => {
    testIP('10.0.0.0', IPv4, ip => expect(ip.getAmount()).toBe(1));
    testIP('10.0.*.0', IPv4, ip => expect(ip.getAmount()).toBe(256));
    testIP('10.*.0.*', IPv4, ip => expect(ip.getAmount()).toBe(256 * 256));
  });
  describe(IPv6, () => {
    testIP('::', IPv6, ip => expect(ip.getAmount()).toBe(1));
    testIP('::*:0', IPv6, ip => expect(ip.getAmount()).toBe(0x10000));
    testIP('0:*::*:0', IPv6, ip => expect(ip.getAmount()).toBe(0x10000 * 0x10000));
  });
  describe(IPRange, () => {
    testIP('10.0.0.0-10.0.0.0', IPRange, ip => expect(ip.getAmount()).toBe(1));
    testIP('10.0.5.0-10.1.6.7', IPRange, ip => expect(ip.getAmount()).toBe(256 * 256 + 256 + 8));
    testIP('0.0.0.0-255.255.255.255', IPRange, ip => expect(ip.getAmount()).toBe(2 ** 32));
    testIP('::5-::5', IPRange, ip => expect(ip.getAmount()).toBe(1));
    testIP('::1:2:3-::2:5:7', IPRange, ip => expect(ip.getAmount()).toBe(0x10000 * 0x10000 + 0x10000 * 3 + 5));
    testIP('::-ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', IPRange, ip => expect(ip.getAmount()).toBe(2 ** 128));
  });
  describe(IPSubnetwork, () => {
    testIP('10.1.2.3/32', IPSubnetwork, ip => expect(ip.getAmount()).toBe(1));
    testIP('10.1.2.3/30', IPSubnetwork, ip => expect(ip.getAmount()).toBe(2 ** 2));
    testIP('10.1.2.3/10', IPSubnetwork, ip => expect(ip.getAmount()).toBe(2 ** 22));
    testIP('a:b:c::d:e:f/128', IPSubnetwork, ip => expect(ip.getAmount()).toBe(1));
    testIP('a:b:c::d:e:f/100', IPSubnetwork, ip => expect(ip.getAmount()).toBe(2 ** 28));
    testIP('a:b:c::d:e:f/10', IPSubnetwork, ip => expect(ip.getAmount()).toBe(2 ** 118));
  });
  describe(IPMask, () => {
    testIP('10.1.2.3/255.255.255.255', IPMask, ip => expect(ip.getAmount()).toBe(1));
    testIP('10.1.2.3/255.255.255.252', IPMask, ip => expect(ip.getAmount()).toBe(4));
    testIP('10.1.2.3/255.252.255.252', IPMask, ip => expect(ip.getAmount()).toBe(16));
    testIP('a:b:c::d:e:f/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', IPMask, ip => expect(ip.getAmount()).toBe(1));
    testIP('a:b:c::d:e:f/ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffd', IPMask, ip => expect(ip.getAmount()).toBe(2));
    testIP('a:b:c::d:e:f/ffff:ffff:f4ff:ffff:ffff:ff5f:ffff:ff00', IPMask, ip => expect(ip.getAmount()).toBe(2 ** 13));
  });
});
describe('isMaskSubsetOfMask', () => {
  const masks = [
    /* mask0 */ getMatch('10.0.0.0/255.255.0.0') as IPMask,
    /* mask1 */ getMatch('10.0.0.0/255.0.0.0') as IPMask,
    /* mask2 */ getMatch('10.0.0.0/0.255.0.0') as IPMask,
    /* mask3 */ getMatch('10.0.0.0/0.0.0.0') as IPMask,
    /* mask4 */ getMatch('10.0.0.0/255.255.1.0') as IPMask,
    /* mask5 */ getMatch('10.0.0.0/0.0.0.1') as IPMask,
    /* mask6 */ getMatch('10.0.0.0/255.255.0.255') as IPMask,
    /* mask7 */ getMatch('11.0.0.0/255.255.0.0') as IPMask,
  ];
  const subsets: number[][] = [
    /* mask0 */[0, 1, 2, 3],
    /* mask1 */[1, 3],
    /* mask2 */[2, 3],
    /* mask3 */[3],
    /* mask4 */[0, 1, 2, 3, 4],
    /* mask5 */[3, 5],
    /* mask6 */[0, 1, 2, 3, 5, 6],
    /* mask7 */[2, 3, 7],
  ];
  for (let a = 0; a < masks.length; a++) {
    for (let b = 0; b < masks.length; b++) {
      test(`is mask${a} (${masks[a]}) a subset of mask${b} (${masks[b]})`, () => {
        const shouldMatch = subsets[a].includes(b);
        expect(masks[a].isSubsetOf(masks[b])).toBe(shouldMatch);
      });
    }
  }
});

test('deprecated constructor', () => {
  // @ts-expect-error Constructor went from public to protected, but should still work
  expect(new IPMatch('127.0.0.1')).toBeInstanceOf(IPv4);
});
