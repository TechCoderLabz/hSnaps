import { HashRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AiohaProvider } from '@aioha/react-provider'
import { initAioha } from '@aioha/aioha'
import { AppRoutes } from './app/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { EulaGate } from './components/EulaGate'
import { useBlacklistStore } from './stores/blacklistStore'
import { useAbusiveUsersStore } from './stores/abusiveUsersStore'

void useBlacklistStore.getState().ensureFresh()
// Always force-refresh the admin abusive list on app load — admin add/remove
// should propagate immediately, not after the 24h TTL.
void useAbusiveUsersStore.getState().refresh()

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
      <AuthProvider>
        <EulaGate>
          <HashRouter>
            <AppRoutes />
            <Toaster position="bottom-center" richColors closeButton />
          </HashRouter>
        </EulaGate>
      </AuthProvider>
    </AiohaProvider>
  )
}

export default App
