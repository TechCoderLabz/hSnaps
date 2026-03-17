/**
 * App version, branch and commit for drawer footer.
 * Version from package.json; branch/commit from build-time defines.
 */
import { version } from '../../package.json'

const env = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> }).env : undefined
export const APP_VERSION = version
export const APP_BRANCH = __DEPLOYMENT_BRANCH__ || env?.VITE_APP_BRANCH || 'main'
export const APP_COMMIT_HASH = __DEPLOYMENT_COMMIT_HASH__ || env?.VITE_APP_COMMIT_HASH || ''
