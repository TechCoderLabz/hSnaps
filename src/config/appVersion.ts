/**
 * App version, branch and commit for drawer footer.
 * Branch/commit from package.json deployment (injected at build); version from VITE_APP_VERSION.
 */
const env = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> }).env : undefined
export const APP_VERSION = env?.VITE_APP_VERSION ?? '0.0.0'
export const APP_BRANCH = __DEPLOYMENT_BRANCH__ || env?.VITE_APP_BRANCH || 'main'
export const APP_COMMIT_HASH = __DEPLOYMENT_COMMIT_HASH__ || env?.VITE_APP_COMMIT_HASH || ''
