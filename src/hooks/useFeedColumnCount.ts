import { useState, useEffect } from 'react'

/** 1 col: mobile. 2 col: tablet. 4 col: desktop+. */
export type FeedColumnCount = 1 | 2 | 4

const TABLET_MIN = 768
const DESKTOP_4COL_MIN = 1280

export function useFeedColumnCount(): FeedColumnCount {
  const [cols, setCols] = useState<FeedColumnCount>(1)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= DESKTOP_4COL_MIN) setCols(4)
      else if (w >= TABLET_MIN) setCols(2)
      else setCols(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return cols
}
