/** Browser entry point: registers the PWA and mounts React into index.html. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './styles.css'

registerSW({
  immediate: true,
  onNeedRefresh() {
    // Activate the new app shell immediately so installed PWAs do not stay on an old screen.
    window.location.reload()
  },
})

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
const app = (
  // HashRouter keeps client-side routes working on static GitHub Pages hosting.
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider> : app,
)
