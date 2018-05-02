
const IP4_REGEX = /^(\d{1,3}\.|\*\.){3}(\d{1,3}|\*)$/;
const IP6_REGEX = /^((([a-f\d]{1,4}|\*)::?)+([a-f\d]{1,4}|\*)|:(:[a-f\d]{1,4}|:\*)+|([a-f\d]{1,4}:|\*:)+:)$/;

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

export class IPv4 implements IPMatch {
  public readonly type = 'IPv4';
  public readonly parts: number[];
  constructor(public readonly input: string) {
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

export class IPv6 implements IPMatch {
  public readonly type = 'IPv6';
  public readonly parts: number[];
  public readonly input: string;
  constructor(input: string) {
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
  public toString() {
    const hextets = this.toHextets();
    const score = [0,0,0,0,0,0,0,0];
    for (let i = 0; i < 8; i += 1) {
      for (let j = i; j < 8; j += 1) {
        if (hextets[j] === '0') score[i] += 1; else break;
      }
    }
    const best = score.reduce((prev, s, key) => s > score[prev] ? key : prev, 0);
    if (score[best]) {
      hextets.splice(best, score[best] - 1);
      hextets[best] = '';
    }
    return hextets.join(':').replace(/(^:|:$)/, '::');
  }
  protected trim(part: string) {
    return part.trim().replace(/^0+/,'').toLowerCase();
  }
}

export type IP = IPv4 | IPv6;

function getIP(input: string) {
  input = input.trim();
  let m = input.match(IP4_REGEX);
  if (m) return new IPv4(input);
  m = input.match(IP6_REGEX);
  if (m) return new IPv6(input);
  return null;
}

export class IPRange implements IPMatch {
  public readonly type = 'IPRange';
  public input: string;
  constructor(private left: IP, private right: IP) {
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

export class IPSubnetwork implements IPMatch {
  public readonly type: string = 'IPSubnetwork';
  public readonly input: string;
  protected range: IPRange;
  constructor(ip: IP, public readonly bits: number) {
    const maxBits = (ip.type === 'IPv4' ? 32 : 128);
    if (bits < 1  || bits > maxBits) {
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

export class IPMatch {
  public readonly type: string = 'IPMatch';
  constructor(public readonly input: any) {
    if (input instanceof IPMatch) return input;
    input = `${input}`;
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
  public matches(ip: string | IP): boolean {
    let real: IP | null;
    if (!(ip instanceof IPv4 || ip instanceof IPv6)) {
      real = getIP(ip);
    } else {
      real = ip as any;
    }
    if (!real) throw new Error('The given value is not a valid IP');
    throw new Error('Not implemented');
  }
}
