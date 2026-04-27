/**
 * ESM shim for @hiveio/dhive.
 *
 * The package ships three entries and all three break under Vite:
 *   - dist/dhive.js (UMD, what `browser` field points to) — no ESM named exports
 *   - lib/index-browser.js — requires core-js/regenerator-runtime/whatwg-fetch (not installed)
 *   - lib/index.js (CJS, node-targeted) — requires process/util/stream (not in browser)
 *
 * The UMD bundle at dist/dhive.js does run cleanly in the browser — it has
 * its polyfills baked into a self-contained IIFE. Esbuild treats it as CJS
 * (because of the `module.exports = f()` branch in the UMD wrapper), wraps
 * it, and exposes the resulting `module.exports` value as the default
 * export. So we default-import it to get the full dhive exports object.
 *
 * (A side-effect import doesn't work: the UMD's `window.dhive = f()`
 * fallback only runs when `exports`/`module` are undefined, but esbuild's
 * CJS wrapper provides them, so the UMD takes the `module.exports = f()`
 * branch and never touches window.)
 *
 * vite.config.ts routes the bare `@hiveio/dhive` specifier to this file via
 * a pre-enforced resolver plugin, so both our code and hive-react-kit's
 * bundled imports land here.
 */
import * as dhiveNs from '@hiveio/dhive/dist/dhive.js'

// Esbuild's CJS interop varies. Try every reasonable shape:
//   - namespace contains Client directly (named exports flattened from module.exports)
//   - namespace.default is module.exports
//   - the UMD's window.dhive fallback ran and globalThis has it
const candidates = [
  dhiveNs?.Client ? dhiveNs : null,
  dhiveNs?.default?.Client ? dhiveNs.default : null,
  typeof globalThis !== 'undefined' && globalThis.dhive?.Client ? globalThis.dhive : null,
]
const dhive = candidates.find(Boolean)

if (!dhive) {
  const nsKeys = dhiveNs ? Object.keys(dhiveNs) : []
  const defaultKeys = dhiveNs?.default ? Object.keys(dhiveNs.default) : []
  throw new Error(
    `@hiveio/dhive: could not resolve exports. ns keys=[${nsKeys.join(',')}] default keys=[${defaultKeys.join(',')}]`
  )
}

export const Client = dhive.Client
export const PrivateKey = dhive.PrivateKey
export const PublicKey = dhive.PublicKey
export const Signature = dhive.Signature
export const Asset = dhive.Asset
export const Price = dhive.Price
export const Authority = dhive.Authority
export const Memo = dhive.Memo
export const Transaction = dhive.Transaction
export const SignedTransaction = dhive.SignedTransaction
export const Aborted = dhive.Aborted
export const VError = dhive.VError
export const RPCError = dhive.RPCError
export const Types = dhive.Types
export const cryptoUtils = dhive.cryptoUtils
export const utils = dhive.utils
export const NodeHealthTracker = dhive.NodeHealthTracker
export const operationOrders = dhive.operationOrders
export const makeBitMaskFilter = dhive.makeBitMaskFilter

export default dhive
