/**
 * Library mostly focused on IP matching, but with some other fancy goods.
 * Repository: https://github.com/SchoofsKelvin/ip-matching
 * @packageDocumentation
 */

/**
 * Tries to convert the given input string to an IP, aka an IPv4 or IPv6 object.
 * For ease-of-use, if the input is already an IPv4 or IPv6, it is returned.
 * @throws Errors if the given input format matches an IPv4/IPv6 address well enough, but is still invalid.
 */
export declare function getIP(input: string | IP): IP | null;

/**
 * Converts a string to an IPMatch object. This correspondends either to
 * an IPv4, IPv4, IPRange or IPSubnetwork object, all extending the IPMatch class.
 * For ease-of-use, if the given input is an IPMatch object, that object itself is returned.
 * @param input - The input string to convert, or IPMatch object to return.
 * @returns Returns an IPMatch for the given string (or returns the given IPMatch itself)
 */
export declare function getMatch(input: string | IPMatch): IPMatch;

/** Represents either an IPv4 or an IPv6, aka single addresses (or wildcard ones) */
export declare type IP = IPv4 | IPv6;

/** Represents an IP mask. The combination of an IP and a mask. A more complex version of IPSubnetwork. */
export declare class IPMask extends IPMatch {
    readonly ip: IP;
    readonly mask: IP;
    readonly type = "IPMask";
    readonly input: string;
    constructor(ip: IP, mask: IP);
    /** Checks whether the given IP matches this mask */
    matches(ip: string | IP): boolean;
    equals(match: IPMatch): boolean;
    /**
     * Converts this IPMask to a string, by joining the IP and mask with a slash, e.g. "IP/mask".
     * Does simplify the IP and mask in their IP form, but does not simplify e.g. `10.0.0.0/255.0.0.0` to `10.0.0.0/8`.
     */
    toString(): string;

    /**
     * Tries to convert this IPMask to an IPSubnetwork. This only works if this mask is a "proper" subnet mask.
     * In other words, the bits have to be sequential. `255.255.128.0` is valid, `255.255.63.0` is not.
     * When this is not the case, `undefined` is returned instead.
     */
    convertToSubnet(): IPSubnetwork | undefined;
    convertToMasks(): IPMask[];
    getAmount(): number;
    /**
     * Returns whether this mask is a subset of the given mask. In other words, all IP addresses matched
     * by this mask should also be matched by the given mask, although the given mask can match others too.
     * @throws Throws an error if the IP address types mismatch (e.g. this mask is for IPv4 but the given is IPv6)
     */
    isSubsetOf(mask: IPMask): boolean;
}

/**
 * Superclass of the IPv4, IPv6, IPRange and IPSubnetwork classes.
 * Only specifies a generic .matches() function and .type field.
 *
 * **Check the specific classes for more specialized methods/docs**
 * e.g. IPRange comes with `convertToSubnets`, IPv6 with `toLongString`, ...
 */
export declare abstract class IPMatch {
    /** String indicating the type of this IPMatch, as an alternative to `instanceof`. Check subclasses for the possible values */
    abstract readonly type: string;
    /** The string representation of this IPMatch. Not necessarily the exact input string that generated it */
    abstract readonly input: string;
    /**
     * This used to be the generic way of converting a string to an IPRange/IPv4/... without assuming a type.
     * This class is now made abstract with a protected constructor, in favor of the new `getMatch(input)` function.
     * The abstract/deprecated/protected flag are to warn users about switching over to the new function.
     * With the way TypeScript compiles them to JavaScript, this constructor still works (thus compatible with old code)
     * @deprecated Use `getMatch(input: string)` instead.
     */
    protected constructor(input: string | null);
    /**
     * Checks whether the given IP (or string to be first converted to an IP) matches this IPMatch object.
     * The exact way this is checked is specific to each IPv4/IPRange/... class. Check their documentation.
     */
    abstract matches(ip: string | IP): boolean;
    /** Each subclass formats itself in a specific way. IPv6 also has a bunch of extra string methods. Check their documentation */
    abstract toString(): string;
    /**
     * Checks whether this IPMatch equals the given match. The match type matters, e.g. the IPv4 `10.0.0.0` and
     * the IPSubnetwork `10.0.0.0/32` will result in this method returning false, even though they both only match `10.0.0.0`.
     */
    abstract equals(match: IPMatch): boolean;
    /**
     * Converts this IPMatch to a list of IPMasks (union) matching the same IPs.
     * IPRange has a handy method convertToSubnets() to convert the range to an array
     * of IPSubnetworks, which are basically CIDR notations. If you're looking at
     * this method, you might also be interested in checking `convertToSubnets` out.
     */
    abstract convertToMasks(): IPMask[];
    /** Retuns the amount of unique IP addresses this IPMatch would match */
    abstract getAmount(): number;
}

/** Represents a range of IP addresses, according to their numerical value */
export declare class IPRange extends IPMatch {
    readonly left: IP;
    readonly right: IP;
    readonly type = "IPRange";
    readonly input: string;
    /** Both values should be the same type (IPv4 or IPv6) and `left` should be lower in numeric value than `right` */
    constructor(left: IP, right: IP);
    /** Checks whether the given IP lies in the range defined by the two bounds (inclusive) */
    matches(ip: string | IP): boolean;
    equals(match: IPMatch): boolean;
    /** Converts this IPRange to a string, by joining the two bounds with a dash, e.g. "IP1-IP2" */
    toString(): string;

    /** Converts this IPRange to an optimized list of (CIDR) IPSubnetworks */
    convertToSubnets(): IPSubnetwork[];

    convertToMasks(): IPMask[];
    getAmount(): number;
    /** Returns the first IP address in this range */
    getFirst(): IP;
    /** Returns the last IP address in this range */
    getLast(): IP;
    protected isLowerOrEqual(left: IP, right: IP): boolean;
}

/** Represents a subnetwork. The combination of an IP and a (simple) mask. A simplified version of IPMask. */
export declare class IPSubnetwork extends IPMatch {
    readonly bits: number;
    readonly type = "IPSubnetwork";
    readonly input: string;
    protected range: IPRange;
    /** Bits has to be in the range 0-32 for IPv4 and 0-128 for IPv6 */
    constructor(ip: IP, bits: number);
    /** Checks whether the given IP lies in this subnetwork */
    matches(ip: string | IP): boolean;
    equals(match: IPMatch): boolean;
    /** Converts this IPSubnetwork to a string in CIDR representation, e.g. "IP/mask" */
    toString(): string;

    convertToMasks(): IPMask[];
    getAmount(): number;
    /** Returns the first IP address in this range */
    getFirst(): IP;
    /** Returns the last IP address in this range */
    getLast(): IP;
}

/** Represents an IPv4 address, optionall with wildcards */
export declare class IPv4 extends IPMatch {
    readonly type = "IPv4";
    readonly parts: number[];
    readonly input: string;
    constructor(input: string);
    /**
     * Checks whether the given IP (or string to be first converted to an IP) matches this IPv4 object.
     * - If the given string represents an IPv6 address, this method returns false.
     * - In other cases, for an IPv4, we check if all 4 octets match.
     * - Octets that are wildcards in this object are always assumed to match.
     * - Octets that are wildcards in the input are **NOT** seen as a wildcard, e.g.
     *    `10.0.0.*` matches `10.0.0.3`, but the inverse would give false.
     */
    matches(ip: string | IP): boolean;
    equals(match: IPMatch): boolean;
    /** Returns whether this IPv4 is exact (aka contains no wildcards) */
    exact(): boolean;
    /**
     * Returns this IPv4 in dot-decimal/quat-dotted notation. Wildcards are represented as stars.
     * For example: `"10.*.0.*"`
     */
    toString(): string;

    convertToMasks(): IPMask[];
    getAmount(): number;
    /**
     * Returns the previous address, or undefined for `0.0.0.0`.
     * In case of a non-exact IP, the wildcard parts are ignored.
     * E.g. getPrevious for `10.0.*.0` returns `9.255.*.255`
     */
    getPrevious(): IPv4 | undefined;
    /**
     * Returns the next address, or undefined for `255.255.255.255`.
     * In case of a non-exact IP, the wildcard parts are ignored.
     * E.g. getNext for `10.0.*.255` returns `10.1.*.0`
     */
    getNext(): IPv4 | undefined;
    /** Converts this IP to an array of bits, e.g. `[1, 1, 0, 0, 0, ...]` for `192.0.0.0`. */
    toBits(): number[];
    /** Converts an array of 32 bits to an IPv4, e.g. `192.0.0.0` for `[1, 1, 0, 0, 0, ...]` */
    static fromBits(bits: number[]): IPv4;
    /** Field present on both IPv4 and IPv6 indicating how many bits an address of that type has */
    static readonly bits = 32;
    /** Field present on both IPv4 and IPv6 addresses indicating how many bits an address of that type has */
    readonly bits = 32;
}

/** Represents an IPv6 address, optionall with wildcards */
export declare class IPv6 extends IPMatch {
    readonly type = "IPv6";
    readonly parts: number[];
    readonly input: string;
    constructor(input: string);
    /**
     * Checks whether the given IP (or string to be first converted to an IP) matches this IPv6 object.
     * - If the given string represents an IPv4 address, this method returns false.
     * - In other cases, for an IPv6, we check if all 8 hextets/hexadectets match.
     * - Octets that are wildcards in this object are always assumed to match.
     * - Octets that are wildcards in the input are **NOT** seen as a wildcard, e.g.
     *    `2001::abcd:*` matches `2001::abcd:1`, but the inverse would give false.
     */
    matches(ip: string | IP): boolean;
    equals(match: IPMatch): boolean;
    /** Returns whether this IPv4 is exact (aka contains no wildcards) */
    exact(): boolean;
    /** Returns an array with the 8 hextets of this address, or `"*"` for wildcard hextets */
    toHextets(): string[];
    /**
     * Returns the address in the full format, but with leading zeroes of hextets omitted.
     * Hextets representing wildcards will be shown as `"*"` instead.
     * Example result: `"2001:0:0:0:0:0:abc:1"`
     */
    toLongString(): string;
    /**
     * Returns the address in the full format, but without omitting leading zeroes or hextets.
     * Hextets representing wildcards will be shown as `"*"` instead.
     * Example result: `"2001:0000:0000:0000:0000:0000:0abc:0001"`
     */
    toFullString(): string;
    /** Returns a mixed address (32 last bits representing an IPv4 address) in a mixed format e.g. "::ffff:c000:0280" as "::ffff:192.0.2.128" */
    toMixedString(): string;
    /**
     * Returns the address in the shortest possible format, according to RFC 5952:
     * - All hexadecimal digits are lowercase (if applicable), as is the case with .toLongString(), toFullString(), ...
     * - Leading zeroes of each hextet are suppressed, apart from the all-zero field which is rendered as a single zero
     * - The (leftmost) longest sequence of multiple consecutive all-zero hextets is replaced with "::"
     * - If this address is known to be IPv4 mapped, it is displayed as such, which currently are for e.g. 127.0.0.1:
     *    - `"::ffff:127.0.0.1"`
     *    - `"::ffff:0:127.0.0.1"`
     */
    toString(): string;

    convertToMasks(): IPMask[];
    getAmount(): number;
    /**
     * Returns the previous address, or undefined for `::`.
     * In case of a non-exact IP, the wildcard parts are ignored.
     * E.g. getPrevious for `::5:*:0` returns `::4:*:ffff`
     */
    getPrevious(): IPv6 | undefined;
    /**
     * Returns the next address, or undefined for `ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff`.
     * In case of a non-exact IP, the wildcard parts are ignored.
     * E.g. getNext for `::0:*:ffff` returns `::1:*:0`
     */
    getNext(): IPv6 | undefined;
    /** Converts this IP to an array of bits, e.g. `[1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, ...]` for `f8::`. */
    toBits(): number[];
    /** Converts an array of 128 bits to an IPv6, e.g. `f8::` for `[1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, ...]` */
    static fromBits(bits: number[]): IPv6;
    /** Field present on both IPv4 and IPv6 indicating how many bits an address of that type has */
    static readonly bits = 128;
    /** Field present on both IPv4 and IPv6 addresses indicating how many bits an address of that type has */
    readonly bits = 128;
}

/**
 * Checks whether the given IP matches the given whitelist
 * @param ip - The IP to check, or a string to be converted to an exact IP
 * @param target - The target to check against, or a string to convert to an IPMatch
 * @throws Throws an error if either argument is a string but does not have a correct format
 */
export declare function matches(ip: string | IP, target: string | IPMatch): boolean;

export { }
