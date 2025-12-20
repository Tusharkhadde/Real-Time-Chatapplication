// client/src/components/Shared/Footer.jsx
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-4 text-center text-sm text-muted-foreground">
      <p className="flex items-center justify-center gap-1">
        Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by ChatApp Team
      </p>
      <p className="mt-1">© {new Date().getFullYear()} ChatApp. All rights reserved.</p>
    </footer>
  )
}