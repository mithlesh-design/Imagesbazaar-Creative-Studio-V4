import Home from './pages/Home'
import { StudioProvider } from './studio/StudioProvider'

/**
 * The studio's state lives above the page, not inside the overlay, so closing
 * the workspace is non-destructive — reopening finds the image and every edit
 * exactly as they were left.
 */
export default function App() {
  return (
    <StudioProvider>
      <Home />
    </StudioProvider>
  )
}
