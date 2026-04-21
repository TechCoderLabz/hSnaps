import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import 'hive-authentication/build.css'
import 'hive-react-kit/build.css'
import './i18n'
import App from './App.tsx'

// Polyfill Buffer for libs (dhive, secp256k1) that rely on it being a global.
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
