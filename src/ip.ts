
const IP4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IP6_REGEX = /^(([a-f\d]{1,4}|\*)::?)+([a-f\d]{1,4}|\*)$/;

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
  public readonly parts: number[] = [];
  constructor(public input: string) {
    this.input = input.trim();
    const ip = input.match(IP4_REGEX);
    if (!ip) throw new Error('Invalid input for IPv4');
    const parts = input.split('.').map(wildcardToNumber(255));
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
  public toString() {
    return this.parts.map(v => v === -1 ? '*' : v).join('.');
  }
}

export class IPv6 implements IPMatch {
  public readonly type = 'IPv6';
  public readonly parts: number[];
  private WTN = wildcardToNumber(0xFFFF, 16);
  constructor(public input: string) {
    this.input = input.trim();
    const ip = input.match(IP6_REGEX);
    if (!ip) throw new Error('Invalid input for IPv4');
    const sides = input.split('.');
    if (sides.length > 2) throw new Error('IPv6 addresses can only contain :: once');
    if (sides.length === 1) {
      this.parts = sides[0].split(':').map(this.WTN);
    } else {
      const l = sides[0].split(':');
      const r = sides[1].split(':');
      const t = 8 - l.length - r.length;
      if (t === 0) throw new Error('This IPv6 address doesn\'t need a ::');
      if (t < 1) throw new Error('Invalid amount of :');
      for (let i = 0; i < t; i += 1); l.push('0');
      this.parts = l.concat(r).map(this.WTN);
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
    for (let i = 0; i < 4; i += 1) {
      const given = this.WTN(real.parts[i]);
      const wanted = this.parts[i];
      if (wanted !== -1 && given !== wanted) return false;
    }
    return true;
  }
  public toString() {
    return this.parts.map(v => v === -1 ? '*' : v).join('.');
  }
  protected trim(part: string) {
    return part.trim().replace(/^0+/,'').toLowerCase();
  }
}

export type IP = IPv4 | IPv6;

function getIP(input: string) {
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
    const l = this.left.parts;
    const r = this.right.parts;
    for (let i = 0; i < l.length; i += 1) {
      const n = Number(real.parts[i]);
      if (!n) throw new Error('Expected a real IP as input');
      if (n < l[i] || n > r[i]) return false;
    }
    return true;
  }
  public toString() {
    return this.input;
  }
}

export default class IPMatch {
  public readonly type: string = 'IPMatch';
  constructor(public input: any) {
    if (input instanceof IPMatch) return input;
    input = `${input}`;
    const ip = getIP(input);
    if (ip) return ip;
    const split = input.split('-');
    if (split.length !== 2) throw new Error('A range looks like \'IP-IP\'');
    const l = getIP(split[0]);
    if (!l) throw new Error('Left side of the IP range isn\'t an IP');
    const r = getIP(split[1]);
    if (!r) throw new Error('Right side of the IP range isn\'t an IP');
    if (l.type !== r.type) throw new Error('Expected same type of IP on both sides of range');
    // TODO Create IPRange here

    // TODO Handle subnetworks
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
