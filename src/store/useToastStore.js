import { create } from 'zustand'

const useToastStore = create((set, get) => ({
  toasts: [],

  showToast: (message, type = 'info') => {
    const id = Date.now()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 3500)
  },

  removeToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))

export default useToastStore
