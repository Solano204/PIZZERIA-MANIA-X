import { create } from 'zustand'
import { calculateCartTotal } from '../lib/helpers'

const useCartStore = create((set, get) => ({
  cart: [],

  addToCart: (product, overrideName = null, overridePrice = null) => {
    set(s => {
      const name = overrideName || product.name
      const price = overridePrice !== null ? overridePrice : product.price
      const existing = s.cart.find(i => i.productId === product.id && i.name === name && !i.note)
      if (existing) {
        return { cart: s.cart.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i) }
      }
      return { cart: [...s.cart, { productId: product.id, name, price, quantity: 1 }] }
    })
  },

  addCustomItem: (item) => {
    set(s => {
      const existing = s.cart.find(
        i => i.productId === item.productId && i.name === item.name && !i.note
      )
      if (existing) {
        return { cart: s.cart.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i) }
      }
      return { cart: [...s.cart, { ...item, quantity: 1 }] }
    })
  },

  updateQty: (productId, delta) => {
    set(s => {
      const item = s.cart.find(i => i.productId === productId)
      if (!item) return s
      const newQty = item.quantity + delta
      if (newQty <= 0) return { cart: s.cart.filter(i => i.productId !== productId) }
      return { cart: s.cart.map(i => i.productId === productId ? { ...i, quantity: newQty } : i) }
    })
  },

  updateQtyByIndex: (index, delta) => {
    set(s => {
      const cart = [...s.cart]
      cart[index] = { ...cart[index], quantity: cart[index].quantity + delta }
      if (cart[index].quantity <= 0) cart.splice(index, 1)
      return { cart }
    })
  },

  removeByProductId: (productId) => {
    set(s => ({ cart: s.cart.filter(i => i.productId !== productId) }))
  },

  setNote: (index, note) => {
    set(s => ({
      cart: s.cart.map((item, i) => (i === index ? { ...item, note } : item)),
    }))
  },

  clearCart: () => set({ cart: [] }),

  get total() {
    return calculateCartTotal(get().cart)
  },

  get itemCount() {
    return get().cart.reduce((sum, i) => sum + i.quantity, 0)
  },
}))

export default useCartStore
