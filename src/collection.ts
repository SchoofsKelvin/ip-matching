import { IPMask, IPMatch, IPv4, IPv6 } from './ip';

export function isMaskSubsetOfMask(a: IPMask, b: IPMask): boolean {
    if (a.ip.type !== b.ip.type)
        throw new Error('Expected same type of masks (e.g. all IPv4 or all IPv6)');
    if (a.equals(b)) return true;
    if (a.getAmount() > b.getAmount()) return false;
    const iBitsA = a.ip.toBits();
    const mBitsA = a.mask.toBits();
    const iBitsB = b.ip.toBits();
    const mBitsB = b.mask.toBits();
    for (let i = 0; i < iBitsA.length; i++) {
        if (!mBitsB[i]) continue; // mask B matches every bit
        if (!mBitsA[i]) return false; // mask A matches every bit, mask B doesn't
        if (iBitsA[i] !== iBitsB[i]) return false; // both masks expect different bits
    }
    return true;
}

type Compacter = (a: IPMask, b: IPMask) => IPMask | undefined;
const COMPACTERS: Compacter[] = [
    // Simple compacter for when one of the subset of the other
    (a, b) => isMaskSubsetOfMask(a, b) ? b : (isMaskSubsetOfMask(b, a) ? a : undefined),
    // Compact if masks are same but IPs are different
    (a, b) => {
        if (!a.mask.equals(b.mask)) return undefined;
        const iBitsA = a.ip.toBits();
        const iBitsB = b.ip.toBits();
        const mBits = a.mask.toBits();
        let changed = false;
        for (let i = 0; i < iBitsA.length; i++) {
            if (!mBits[i]) continue; // mask=0 so bit can be both already
            if (iBitsA[i] === iBitsB[i]) continue; // bits are same anyway
            if (changed) return undefined; // only works if the IPs differ in 1 bit
            mBits[i] = 0; // flag the bit as being able to be both
            changed = true;
        }
        const ipType = a.ip.type === 'IPv4' ? IPv4 : IPv6;
        const mask = new IPMask(a.ip, ipType.fromBits(mBits));
        // Wouldn't this mean the IPs are the same? First compacter should've caught that?
        //if (mask.equals(a) || mask.equals(b)) return undefined;
        return mask;
    },
];

export function compactMasks(masks: IPMask[]): IPMask[] {
    masks = [...masks];
    if (masks.length < 2) return masks;
    let results: IPMask[] = [];
    masks: for (const mask of masks) {
        for (let i = 0; i < results.length; i++) {
            const other = results[i];
            for (const compacter of COMPACTERS) {
                const compacted = compacter(mask, other);
                if (!compacted) continue;
                // Remove whatever we compacted with from the results
                results = [...results.slice(0, i), ...results.slice(i + 1)];
                masks.push(compacted);
                continue masks;
            }
        }
        // Did not compact with a previous result
        results.push(mask);
    }
    return results;
}
