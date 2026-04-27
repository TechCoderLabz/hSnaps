import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from './package.json'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dhiveShimPath = path.resolve(__dirname, 'src/shims/hiveio-dhive.js')

/**
 * Force every bare `@hiveio/dhive` import — both ours and inside
 * hive-react-kit's pre-bundled ESM output — to resolve to a local shim.
 *
 * @hiveio/dhive's package.json `browser` field redirects the entry to a UMD
 * bundle (dist/dhive.js) that has no ESM named exports, so a plain
 * `import { Client } from '@hiveio/dhive'` blows up under Vite. The other
 * two entries (lib/index.js, lib/index-browser.js) need Node builtins or
 * uninstalled core-js polyfills respectively.
 *
 * `resolve.alias` alone wasn't enough because for packages in
 * optimizeDeps.exclude (hive-react-kit), the alias plugin didn't intercept
 * before the package resolver applied the browser-field redirect. A pre-
 * enforced custom resolver runs first and short-circuits the chain.
 *
 * Subpath imports (e.g. '@hiveio/dhive/dist/dhive.js' used by the shim
 * itself) pass through untouched.
 */
function hiveioDhiveShim(): Plugin {
  return {
    name: 'hiveio-dhive-shim',
    enforce: 'pre',
    resolveId(source) {
      if (source === '@hiveio/dhive') return dhiveShimPath
      return null
    },
  }
}

const deployment = (pkg as { deployment?: { branch?: string; commitHash?: string } }).deployment

export default defineConfig({
  plugins: [hiveioDhiveShim(), react(), tailwindcss()],
  define: {
    __DEPLOYMENT_BRANCH__: JSON.stringify(deployment?.branch ?? ''),
    __DEPLOYMENT_COMMIT_HASH__: JSON.stringify(deployment?.commitHash ?? ''),
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['hive-react-kit'],
    // Vite plugins don't run inside esbuild's dep pre-bundle scan, so the
    // same redirect is registered here as a native esbuild plugin too.
    esbuildOptions: {
      plugins: [
        {
          name: 'hiveio-dhive-shim-esbuild',
          setup(build) {
            build.onResolve({ filter: /^@hiveio\/dhive$/ }, () => ({
              path: dhiveShimPath,
            }))
          },
        },
      ],
    },
  },
  server: {
    proxy: {
      // Avoid CORS: browser calls same origin, Vite forwards to PeakD
      '/api/peakd': {
        target: 'https://peakd.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/peakd/, '/api/public/snaps'),
      },
    },
  },
})