import { useNavigate } from 'react-router-dom'
import { useAuthData } from '../stores/authStore'

export function AppLogo() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthData()

  const handleClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard/snaps')
    } else {
      navigate('/')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg"
      aria-label={isAuthenticated ? 'Go to dashboard' : 'Go to home'}
    >
      <img
        src="/logo.png"
        alt="hSnaps"
        className="h-9 w-9 object-contain sm:h-10 sm:w-10"
      />
    </button>
  )
}
