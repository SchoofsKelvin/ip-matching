
const IP4_REGEX = /^(\d{1,3}\.|\*\.){3}(\d{1,3}|\*)$/;
const IP6_REGEX = /^((([a-f\d]{1,4}|\*)::?)+([a-f\d]{1,4}|\*)|:(:[a-f\d]{1,4}|:\*)+|([a-f\d]{1,4}:|\*:)+:)$/i;

function wildcardToNumber(max: number, radix: number = 10) {
  return (input: string | number) => {
    if (input === '*') return -1;
    const n = parseInt(input as string, radix);
    if (n < 0 || n > max) {
      throw new Error(`Value has to be in the range of 0-${max}`);
    }
    return n;
  };
}

export function getMatch(input: string | IPMatch): IPMatch {
  if (input instanceof IPMatch) return input;
  input = `${input}`; // If it somehow isn't a string yet, make it one
  let ip = getIP(input);
  if (ip) return ip;
  let split = input.split('-');
  if (split.length !== 1) {
    if (split.length !== 2) throw new Error('A range looks like \'IP-IP\'');
    const l = getIP(split[0]);
    if (!l || !l.exact()) throw new Error('Left side of the IP range isn\'t a valid IP');
    const r = getIP(split[1]);
    if (!r || !r.exact()) throw new Error('Right side of the IP range isn\'t a valid IP');
    if (l.type !== r.type) throw new Error('Expected same type of IP on both sides of range');
    return new IPRange(l, r);
  }
  split = input.split('/');
  if (split.length !== 1) {
    ip = getIP(split[0]);
    if (!ip || !ip.exact()) throw new Error('Expected a valid IP for a subnetwork');
    const bits = Number(split[1]);
    if (!bits) throw new Error('A subnetwork looks like \'IP/bits\'');
    return new IPSubnetwork(ip, bits);
  }
  throw new Error('Invalid IP (range/subnetwork)');
}

export abstract class IPMatch {
  public readonly type!: string;
  /**
   * @deprecated Use `getMatch(input: string)` instead.
   */
  protected constructor(public readonly input: string | null) {
    if (input == null) return this;
    return getMatch(input);
  }
  public abstract matches(ip: string | IP): boolean;
  public abstract matches(ip: string | IP): boolean;
export class IPv4 extends IPMatch {
  public readonly type = 'IPv4';
  public readonly parts: number[];
  constructor(public readonly input: string) {
    super(null);
    this.input = input.trim();
    const ip = input.match(IP4_REGEX);
    if (!ip) throw new Error('Invalid input for IPv4');
    this.parts = input.split('.').map(wildcardToNumber(255));
  }
  public matches(ip: string | IP): boolean {
    let real: IP | null;
    if (!(ip instanceof IPv4 || ip instanceof IPv6)) {
      real = getIP(ip);
    } else {
      real = ip as any;
    }
    if (!real) throw new Error('The given value is not a valid IP');
    if (!(real instanceof IPv4)) return false;
    for (let i = 0; i < 4; i += 1) {
      const given = real.parts[i];
      const wanted = this.parts[i];
      if (wanted !== -1 && given !== wanted) return false;
    }
    return true;
  }
  public exact() {
    return !this.parts.includes(-1);
  }
  public toString() {
    return this.parts.map(v => v === -1 ? '*' : v).join('.');
  }
}

const IP6_WTN = wildcardToNumber(0xFFFF, 16);

function shortenIPv6(address: string | string[] | IPv6): string {
  if (typeof address === 'string') address = new IPv6(address);
  if (address instanceof IPv6) address = address.toHextets();
  const score = [0, 0, 0, 0, 0, 0, 0, 0];
  const { length } = address;
  for (let i = 0; i < length; i += 1) {
    for (let j = i; j < length; j += 1) {
      if (address[j] === '0') score[i] += 1; else break;
    }
  }
  const best = score.reduce((prev, s, key) => s > score[prev] ? key : prev, 0);
  if (score[best]) {
    address.splice(best, score[best] - 1);
    address[best] = '';
  }
  // '::' results in address being ['']
  if (address.length === 1 && !address[0]) return '::';
  return address.join(':').replace(/(^:|:$)/, '::');
}

export class IPv6 extends IPMatch {
  public readonly type = 'IPv6';
  public readonly parts: number[];
  public readonly input: string;
  constructor(input: string) {
    super(null);
    input = input.trim();
    this.input = input;
    const ip = input.match(IP6_REGEX);
    if (!ip) throw new Error('Invalid input for IPv6');
    const sides = input.split('::');
    if (sides.length > 2) throw new Error('IPv6 addresses can only contain :: once');
    if (sides.length === 1) {
      this.parts = sides[0].split(':').map(IP6_WTN);
    } else {
      const l = sides[0] ? sides[0].split(':') : [];
      const r = sides[1] ? sides[1].split(':') : [];
      const t = 8 - l.length - r.length;
      if (t === 0) throw new Error('This IPv6 address doesn\'t need a ::');
      if (t < 1) throw new Error('Invalid amount of :');
      for (let i = 0; i < t; i += 1) l.push('0');
      this.parts = l.concat(r).map(IP6_WTN);
    }
  }
  public matches(ip: string | IP): boolean {
    let real: IP | null;
    if (!(ip instanceof IPv4 || ip instanceof IPv6)) {
      real = getIP(ip);
    } else {
      real = ip as any;
    }
    if (!real) throw new Error('The given value is not a valid IP');
    if (!(real instanceof IPv6)) return false;
    for (let i = 0; i < 8; i += 1) {
      const given = real.parts[i];
      const wanted = this.parts[i];
      if (wanted !== -1 && given !== wanted) return false;
    }
    return true;
  }
  public exact() {
    return !this.parts.includes(-1);
  }
  public toHextets() {
    return this.parts.map(v => v === -1 ? '*' : v.toString(16));
  }
  public toLongString() {
    return this.toHextets().join(':');
  }
  public toFullString() {
    return this.toHextets().map(v => v !== '*' && v.length < 4 ? `${'0'.repeat(4 - v.length)}${v}` : v).join(':');
    }
  public toMixedString() {
    const { parts } = this;
    // Prepare the first part
    const hextets = parts.slice(0, 6).map(v => v === -1 ? '*' : v.toString(16));
    let shorten = shortenIPv6(hextets);
    if (shorten === '::') shorten = ':';
    // Prepare the second part
    const ipv4: (number | string)[] = [
      parts[6] >> 8,
      parts[6] & 0xFF,
      parts[7] >> 8,
      parts[7] & 0xFF,
    ];
    if (parts[6] === -1) ipv4[0] = ipv4[1] = '*';
    if (parts[7] === -1) ipv4[2] = ipv4[3] = '*';
    // And slap them together
    return `${shorten}:${ipv4.join('.')}`;
  }
  public toString() {
    return shortenIPv6(this.toHextets());
  }
}

export type IP = IPv4 | IPv6;

export function getIP(input: string): IP | null {
  input = input.trim();
  if (IP4_REGEX.test(input)) return new IPv4(input);
  if (IP6_REGEX.test(input) || IP6_MIXED_REGEX.test(input)) return new IPv6(input);
  return null;
}

export class IPRange extends IPMatch {
  public readonly type = 'IPRange';
  public input: string;
  constructor(private left: IP, private right: IP) {
    super(null);
    if (left.type !== right.type) throw new Error('Expected same type of IP on both sides of range');
    if (!this.isLowerOrEqual(left, right)) throw new Error('Left side of range should be lower than right side');
    this.input = left + '-' + right;
  }
  public matches(ip: string | IP): boolean {
    let real: IP | null;
    if (!(ip instanceof IPv4 || ip instanceof IPv6)) {
      real = getIP(ip);
    } else {
      real = ip as any;
    }
    if (!real) throw new Error('The given value is not a valid IP');
    if (real.type !== this.left.type) throw new Error('Expected same type of IP as used to construct the range');
    return this.isLowerOrEqual(this.left, real) && this.isLowerOrEqual(real, this.right);
  }
  public toString() {
    return this.input;
  }
  protected isLowerOrEqual(left: IP, right: IP) {
    const l = left.parts;
    const r = right.parts;
    for (let i = 0; i < l.length; i += 1) {
      const L = l[i];
      const R = r[i];
      if (L === R) continue;
      if (L < R) return true;
      if (L > R) return false;
    }
    return true;
  }
}

function getLowerPart(part: number, bits: number, max: number) {
  if (bits > max) bits = max;
  /* tslint:disable-next-line */
  return part & (Math.pow(2, max) - Math.pow(2, max - bits));
}
function getUpperPart(part: number, bits: number, max: number) {
  if (bits > max) bits = max;
  /* tslint:disable-next-line */
  return part | (Math.pow(2, max - bits) - 1);
}

export class IPSubnetwork extends IPMatch {
  public readonly input: string;
  protected range: IPRange;
  constructor(ip: IP, public readonly bits: number) {
    super(null);
    const maxBits = (ip.type === 'IPv4' ? 32 : 128);
    if (bits < 1 || bits > maxBits) {
      throw new Error(`A ${ip.type} subnetwork's bits should be in the range of 1-${maxBits}`);
    }
    let lower = new ((ip as any).constructor)(ip.input) as IP;
    let upper = new ((ip as any).constructor)(ip.input) as IP;
    const bitsPerPart = ip.type === 'IPv4' ? 8 : 16;
    for (let i = 0; i < ip.parts.length; i += 1) {
      lower.parts[i] = getLowerPart(ip.parts[i], bits, bitsPerPart);
      upper.parts[i] = getUpperPart(lower.parts[i], bits, bitsPerPart);
      bits = bits <= bitsPerPart ? 0 : bits - bitsPerPart;
    }
    lower = new ((ip as any).constructor)(lower.toString());
    upper = new ((ip as any).constructor)(upper.toString());
    this.range = new IPRange(lower, upper);
    this.input = `${lower}/${this.bits}`;
  }
  public matches(ip: string | IP) {
    return this.range.matches(ip);
  }
  public toString() {
    return this.input;
  }
}
