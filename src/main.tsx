import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'hive-authentication/build.css'
import 'hive-react-kit/build.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
