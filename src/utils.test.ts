
import { getMatch, IP, IPMask, IPMatch, IPv4, IPv6, partsToIP } from './ip';
import { compactMasks } from './utils';

const toString = (obj: any): string => `${obj}`;

function validateMatches(original: IPMatch[], processed: IPMatch[], ips: IP[]) {
  for (const ip of ips) {
    const a = original.some(m => m.matches(ip));
    const b = processed.some(m => m.matches(ip));
    if (a === b) continue;
    fail(`Expected ${a} for ${ip} but got ${b}`);
  }
}
function validateRandom(original: IPMatch[], processed: IPMatch[], clazz: typeof IPv4 | typeof IPv6) {
  const ips: IP[] = [];
  for (let i = 0; i < 1000; i++) {
    const bits: number[] = [];
    for (let i = 0; i < clazz.bits; i++) bits[i] = Math.random() < 0.5 ? 0 : 1;
    ips.push(clazz.fromBits(bits));
  }
  validateMatches(original, processed, ips);
}
function findEdgeCases(matches: IPMatch[]) {
  const cases: IP[] = [];
  for (const match of matches) {
    for (const mask of match.convertToMasks()) {
      cases.push(mask.ip);
      const prev = mask.ip.getPrevious();
      if (prev) cases.push(prev);
      const next = mask.ip.getNext();
      if (next) cases.push(next);
      const ipParts = [...mask.ip.parts];
      const maskParts = mask.mask.parts;
      const maxPart = (2 ** (mask.ip.bits / ipParts.length)) - 1;
      for (let i = 0; i < ipParts.length; i++) {
        ipParts[i] = ipParts[i] | (maxPart & maskParts[i]);
      }
      const ip = partsToIP(ipParts);
      cases.push(ip);
      const ipPrev = ip.getPrevious();
      if (ipPrev) cases.push(ipPrev);
      const ipNext = ip.getNext();
      if (ipNext) cases.push(ipNext);
    }
  }
  return cases;
}
function validateEdges(original: IPMatch[], processed: IPMatch[]) {
  const ips = [...findEdgeCases(original), ...findEdgeCases(processed)];
  validateMatches(original, processed, ips);
}

describe('compactMasks', () => {
  describe('IPv4 set 1', () => {
    const masks = [
      getMatch('10.0.0.0/255.0.255.0') as IPMask,
      getMatch('10.0.0.0/255.0.255.0') as IPMask,
      getMatch('10.0.0.0/255.255.1.0') as IPMask,
      getMatch('10.0.0.0/255.255.0.255') as IPMask,
      getMatch('11.0.0.0/255.0.255.0') as IPMask,
      getMatch('20.1.2.3/255.0.0.0') as IPMask,
      getMatch('20.1.2.3/0.255.0.0') as IPMask,
      getMatch('20.1.2.3/255.255.0.0') as IPMask,
    ];
    const compacted = compactMasks(masks);
    const expected = [
      getMatch('0.1.0.0/0.255.0.0') as IPMask,
      getMatch('10.0.0.0/254.0.255.0') as IPMask,
      getMatch('10.0.0.0/255.255.0.255') as IPMask,
      getMatch('10.0.0.0/255.255.1.0') as IPMask,
      getMatch('20.0.0.0/255.0.0.0') as IPMask,
    ].map(toString).sort();
    test('matches expected', () => {
      expect(compacted.map(toString).sort()).toEqual(expected);
    });
    test('validate edge cases', () => {
      validateEdges(masks, compacted);
    });
    test('validate 1000 random addresses', () => {
      validateRandom(masks, compacted, IPv4);
    })
    test('validate first two octets', () => {
      let ip = getMatch('0.0.0.0') as IPv4;
      const parts = ip.parts;
      for (let i = 0; i <= 255 * 255; i++) {
        parts[0] = i >> 8;
        parts[1] = i & 255;
        ip = partsToIP(parts) as IPv4;
        const a = masks.some(m => m.matches(ip));
        const b = compacted.some(m => m.matches(ip));
        if (a === b) continue;
        fail(`Expected ${a} for ${ip} but got ${b}`);
      }
    });
  });

  describe('IPv6 set 1', () => {
    const masks = [
      getMatch('a:b:c:d::/ffff::') as IPMask,
      getMatch('a:b:c:d::/ffff::') as IPMask,
      getMatch('a:b:c:d::/0:ffff::') as IPMask,
      getMatch('a:b:c:d::/ffff:ffff::') as IPMask,
      getMatch('b:b:c:d::/ffff::') as IPMask,
      getMatch('fa:b:c:d::/ffff::') as IPMask,
      getMatch('fb:b:c:d::/ffff::') as IPMask,
      getMatch('8888:1:2:3::/ffff::') as IPMask,
      getMatch('8888:1:2:3::/0:ffff::') as IPMask,
      getMatch('8888:1:2:3::/ffff:ffff::') as IPMask,
    ];
    const compacted = compactMasks(masks);
    const expected = [
      getMatch('0:1::/0:ffff::') as IPMask,
      getMatch('0:b::/0:ffff::') as IPMask,
      getMatch('a::/fffe::') as IPMask,
      getMatch('fa::/fffe::') as IPMask,
      getMatch('8888::/ffff::') as IPMask,
    ].map(toString).sort();
    test('matches expected', () => {
      expect(compacted.map(toString).sort()).toEqual(expected);
    });
    test('validate edge cases', () => {
      validateEdges(masks, compacted);
    });
    test('validate 1000 random addresses', () => {
      validateRandom(masks, compacted, IPv6);
    })
    test('validate first hextet', () => {
      let ip = getMatch('0::') as IPv6;
      const parts = ip.parts;
      for (let i = 0; i <= 0xffff; i++) {
        parts[0] = i;
        ip = partsToIP(parts) as IPv6;
        const a = masks.some(m => m.matches(ip));
        const b = compacted.some(m => m.matches(ip));
        if (a === b) continue;
        fail(`Expected ${a} for ${ip} but got ${b}`);
      }
    });
  });
});

