
# Changelog

Keep track of all changes between versions. Should basically match the release descriptions on GitHub.

## 2.1.2

### Project changes
- Updated description (in `package.json`)
  - This module is more like 50% matching and 50% IP-related utilities
- Updated README
  - Added badges for GitHub/NPM and Codacy grade
  - Reworded certain parts and improved formatting
  - Improved the example, showcasing more functionality
- Added CHANGELOG

### Development changes
- Renamed script names to be more logical/consistent
- Add Codacy for static analysis of source code

## 2.1.1

### Development changes
- Added ESLint
  - Setup for TypeScript code base (including tests)
  - Includes VS Code build task in watch mode with problem matcher
  - Included in the `prepack` script, thus running in CI for every release and pushed commit
- Typescript updated to `^4.3.5`
- `@microsoft/api-extractor` updated to `^7.18.1`
- Small refactor of unreleased code

## 2.1.0

### New features
- Added `toBits()` to `IPv4`/`IPv6`, producing e.g. `[1, 1, 0, 0, 0, 0, ...]` for `192.0.0.0` (length 32 and 128 for IPv4 and IPv6 respectively)
- Added `IPv4.fromBits(bits)` and `IPv6.fromBits(bits)`, accepting the "bit arrays" produced from `toBits()`
  - Accepts arrays (with length 32 for `IPv4` and length 128 for `IPv6`) filled with `0`'s and `1`'s
- Added `IPv4.bits = 32` and `IPv6.bits = 128`, both on the class and class objects (e.g. `new IPv4('0.0.0.0').bits`)
- Added `getAmount()` to `IPMatch`, allowing you see how many IP addresses a match (e.g. a range/subnet) matches
- Added `isSubsetOf(mask)` to `IPMask`, allowing to check whether one mask is a subset of another mask
  - Mask A is a subset of mask B if every IP address that is matched by A is also matched by B

### Changes
- Caching added to `convertToMasks()`/`convertToSubnets()`, making repeated calls a lot cheaper
- `matches(ip)` in `IPRange` no longer errors for passing an `IPv4` to an `IPv6` range and vice-versa, instead returning false now
  - This is line with `matches()` in general, where it only errors if the input is neither an IP nor a string that can be converted to one


## 2.0.0
Lots of changes since the previous v1.2.1 version.

### New features
- Added `getNext()` and `getPrevious()` to `IPv4` and `IPv4`
- Added `getFirst()` and `getLast()` to `IPRange` and `IPSubnetwork`
- Added `IPMask` subclass, supporting _any_ mask _(e.g. `255.0.128.0`)_
- Added `convertToSubnets()` to `IPRange` (optimized CIDR array)
- Added `convertToSubnet()` to `IPMask` _(only supports traditional subnet masks)_
- Added `convertToMasks()` to `IPMatch`

### Improved documentation
- Improved JSDoc comments in the source code
- API Extractor generating an index.d.ts for `package.json` `"typings"`
- Added workflow file (GitHub Actions)
  - Tries to compile the code
  - Runs API Extractor (in validation mode)
  - Runs all the tests
  - Packages an NPM-ready tarball (uploaded as artifact)
  - Prepares a release draft for tags starting with `v`
  
### Bug fixes
- Improved `IPSubnetwork` parsing _(supports `/0` now)_

### Development changes
- Added API Extractor support
- Switched to Jest for testing
- Removed unused files (e.g. ESLint)
- Updated .gitignore, .vscode tasks/settings, ...
- License change to LGPL-3.0-only
