import { create } from 'zustand'

const useModalStore = create((set) => ({
  modal: null,
  openModal: (component) => set({ modal: { component } }),
  closeModal: () => set({ modal: null }),
}))

export default useModalStore
