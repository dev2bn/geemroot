import { useEffect, useState } from 'react'

let cache = null
const DEFAULTS = { logo_text: 'Geem', logo_image: '', hero_image: '' }

export function useSettings() {
  const [s, setS] = useState(cache || DEFAULTS)
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { cache = d; setS(d) })
      .catch(() => {})
  }, [])
  return s
}