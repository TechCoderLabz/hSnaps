import { HashRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AiohaProvider } from '@aioha/react-provider'
import { initAioha } from '@aioha/aioha'
import { AppRoutes } from './app/AppRoutes'

// Single Aioha instance configured similarly to the reference app
const aioha = initAioha({
  hivesigner: {
    app: 'hsnaps.app',
    callbackURL: window.location.origin + '/hivesigner.html',
    scope: ['login', 'vote'],
  },
  hiveauth: {
    name: 'hSnaps',
    description: 'hSnaps · Snaps · Threads · Waves · Moments',
  },
})

function App() {
  return (
    <AiohaProvider aioha={aioha}>
      <HashRouter>
        <AppRoutes />
        <Toaster position="bottom-center" richColors closeButton />
      </HashRouter>
    </AiohaProvider>
  )
}

export default App
