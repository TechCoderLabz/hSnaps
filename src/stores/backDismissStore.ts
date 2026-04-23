import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * LIFO stack of dismiss handlers. When the Android hardware back button is
 * pressed (see `useSystemBackButton`), the top handler is invoked instead of
 * navigating back. Modals/sheets push their close callback while open; the
 * global handler falls through to `navigate(-1)` only when the stack is empty.
 */
interface BackDismissState {
  stack: Array<() => void>
  push: (handler: () => void) => () => void // returns remover
  popAndRun: () => boolean // true if a handler ran; false if stack empty
}

export const useBackDismissStore = create<BackDismissState>((set, get) => ({
  stack: [],
  push: (handler) => {
    set((s) => ({ stack: [...s.stack, handler] }))
    return () => {
      set((s) => ({ stack: s.stack.filter((h) => h !== handler) }))
    }
  },
  popAndRun: () => {
    const { stack } = get()
    if (stack.length === 0) return false
    const top = stack[stack.length - 1]
    set({ stack: stack.slice(0, -1) })
    try { top() } catch { /* ignore */ }
    return true
  },
}))

/**
 * Register `onDismiss` as the top-of-stack back-button handler while `isOpen`
 * is true. When Android back is pressed, the handler fires and is popped.
 * The handler is also removed on unmount or when `isOpen` flips to false.
 */
export function useBackDismiss(isOpen: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!isOpen) return
    const remove = useBackDismissStore.getState().push(onDismiss)
    return remove
  }, [isOpen, onDismiss])
}
