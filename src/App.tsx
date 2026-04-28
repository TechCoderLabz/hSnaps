import { HashRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AiohaProvider } from "@aioha/react-ui";
import { initAioha } from '@aioha/aioha'
import { useTranslation } from 'react-i18next'
import { HiveLanguageProvider } from 'hive-react-kit'
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
  // Drive HiveReactKit's content translation off the same i18n state that
  // powers the UI labels — so when the user picks Español in Settings,
  // post / comment bodies and feed previews rendered by the kit also flip.
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage || i18n.language || 'en'

  return (
    <AiohaProvider aioha={aioha}>
      <AuthProvider>
        <HiveLanguageProvider language={language}>
          <EulaGate>
            <HashRouter>
              <AppRoutes />
              <Toaster position="bottom-center" richColors closeButton duration={3500} />
            </HashRouter>
          </EulaGate>
        </HiveLanguageProvider>
      </AuthProvider>
    </AiohaProvider>
  )
}

export default App
