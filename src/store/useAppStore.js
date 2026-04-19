import { create } from 'zustand'
import { DEFAULT_DATA } from '../lib/defaultData'
import {
  loadBranchState,
  saveBranchState,
  subscribeToBranchState,
  saveSession,
  loadSession,
  clearSession,
} from '../lib/firebaseService'
import { checkProductAvailability, deductInventoryForCart } from '../lib/helpers'

const useAppStore = create((set, get) => ({
  // ==================== STATE ====================
  state: JSON.parse(JSON.stringify(DEFAULT_DATA)),
  currentUser: null,
  currentBranch: 'sucursal_principal',
  isLoading: true,
  isSaving: false,
  stateUnsubscribe: null,

  // ==================== AUTH ====================
  login: async (username, password, branch) => {
    const branchState = await loadBranchState(branch)
    const user = branchState.users?.find(
      u => u.username === username && u.password === password && u.active
    )
    if (!user) throw new Error('Usuario o contraseña incorrectos en esta Sucursal')

    // Persist session to Firestore (no localStorage)
    await saveSession(user, branch)

    // Start live subscription
    const prev = get().stateUnsubscribe
    if (prev) prev()

    const unsub = subscribeToBranchState(branch, (newState) => {
      set(s => ({ state: { ...s.state, ...newState } }))
    })

    set({
      currentUser: user,
      currentBranch: branch,
      state: branchState,
      stateUnsubscribe: unsub,
      isLoading: false,
    })

    get().logActivity('LOGIN', `Usuario ${user.name} inició sesión`)
    return user
  },

  logout: async () => {
    const { currentUser, stateUnsubscribe } = get()
    if (currentUser) {
      get().logActivity('LOGOUT', `Usuario ${currentUser.name} cerró sesión`)
    }
    if (stateUnsubscribe) stateUnsubscribe()
    await clearSession()
    set({
      currentUser: null,
      currentBranch: 'sucursal_principal',
      state: JSON.parse(JSON.stringify(DEFAULT_DATA)),
      stateUnsubscribe: null,
    })
  },

  checkSession: async () => {
    const session = await loadSession()
    if (session?.user && session?.branch) {
      const { user, branch } = session
      const branchState = await loadBranchState(branch)

      const prev = get().stateUnsubscribe
      if (prev) prev()

      const unsub = subscribeToBranchState(branch, (newState) => {
        set(s => ({ state: { ...s.state, ...newState } }))
      })

      set({
        currentUser: user,
        currentBranch: branch,
        state: branchState,
        stateUnsubscribe: unsub,
        isLoading: false,
      })
      return user
    }

    set({ isLoading: false })
    return null
  },

  // ==================== STATE PERSISTENCE ====================
  saveToStorage: async () => {
    const { state, currentBranch } = get()
    set({ isSaving: true })
    try {
      await saveBranchState(currentBranch, state)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      set({ isSaving: false })
    }
  },

  // ==================== ACTIVITY LOG ====================
  logActivity: (action, details) => {
    const { currentUser } = get()
    set(s => ({
      state: {
        ...s.state,
        activityLog: [
          ...(s.state.activityLog || []),
          {
            id: Date.now(),
            userId: currentUser?.id,
            userName: currentUser?.name,
            action,
            details,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }))
    get().saveToStorage()
  },

  // ==================== NOTIFICATIONS ====================
  addNotification: (type, message, forRoles = []) => {
    const notif = {
      id: Date.now(),
      type,
      message,
      forRoles,
      timestamp: new Date().toISOString(),
      read: false,
    }
    set(s => ({
      state: {
        ...s.state,
        notifications: [notif, ...(s.state.notifications || [])].slice(0, 50),
      },
    }))
    get().saveToStorage()
  },

  markNotifRead: (id) => {
    set(s => ({
      state: {
        ...s.state,
        notifications: (s.state.notifications || []).map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
      },
    }))
    get().saveToStorage()
  },

  clearNotifications: () => {
    const { currentUser } = get()
    set(s => ({
      state: {
        ...s.state,
        notifications: (s.state.notifications || []).filter(
          n => !(n.forRoles.length === 0 || n.forRoles.includes(currentUser?.role))
        ),
      },
    }))
    get().saveToStorage()
  },

  // ==================== INVENTORY ====================
  addInventoryEntry: (itemId, qty, userName, userId) => {
    set(s => {
      const inventory = s.state.inventory.map(item => {
        if (item.id === itemId) return { ...item, stock: item.stock + qty }
        return item
      })

      const products = s.state.products.map(p => {
        if (!p.active) {
          const hasStock = !p.ingredients?.some(ing => {
            const inv = inventory.find(i => i.id === ing.id)
            return !inv || inv.stock < ing.qty
          })
          if (hasStock) return { ...p, active: true }
        }
        return p
      })

      const invItem = s.state.inventory.find(i => i.id === itemId)
      const movement = {
        id: Date.now(),
        itemId,
        itemName: invItem?.name || '',
        type: 'entry',
        quantity: qty,
        unit: invItem?.unit || '',
        timestamp: new Date().toISOString(),
        userId,
        userName,
      }

      return {
        state: {
          ...s.state,
          inventory,
          products,
          inventoryMovements: [...(s.state.inventoryMovements || []), movement],
        },
      }
    })
    get().saveToStorage()
  },

  // ==================== ORDERS ====================
  updateOrderStatus: (orderId, newStatus) => {
    set(s => {
      const orders = s.state.orders.map(o => {
        if (o.id !== orderId) return o
        const updated = { ...o, status: newStatus, statusUpdatedAt: new Date().toISOString() }
        if (newStatus === 'delivered') {
          updated.items = o.items.map(item => ({
            ...item,
            deliveredQty: item.quantity,
            printedQty: item.quantity,
          }))
        }
        return updated
      })
      return { state: { ...s.state, orders } }
    })
    get().saveToStorage()
  },

  sendTableOrder: (tableId, cartItems, currentUser) => {
    const { state } = get()
    const table = state.tables.find(t => t.id === tableId)

    let orders = [...state.orders]
    let order = orders.find(
      o => o.tableId === tableId && o.paymentStatus !== 'paid' && o.status !== 'cancelled'
    )

    if (!order) {
      order = {
        id: Date.now(),
        type: 'table',
        tableId,
        tableName: table?.name || `Mesa ${tableId}`,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        waiterId: currentUser.id,
        waiterName: currentUser.name,
        items: [],
        status: 'pending',
        total: 0,
        timestamp: new Date().toISOString(),
        paymentStatus: 'pending',
        paidAmount: 0,
        payments: [],
      }
      orders.push(order)
    } else {
      if (['delivered', 'ready'].includes(order.status)) {
        order = { ...order, status: 'pending', createdAt: new Date().toISOString() }
        orders = orders.map(o => (o.id === order.id ? order : o))
      }
    }

    cartItems.forEach(cartItem => {
      const existing = order.items.find(
        i => i.productId === cartItem.productId && i.name === cartItem.name && i.note === cartItem.note
      )
      if (existing) {
        order = {
          ...order,
          items: order.items.map(i =>
            i === existing ? { ...i, quantity: i.quantity + cartItem.quantity } : i
          ),
        }
      } else {
        order = { ...order, items: [...order.items, { ...cartItem }] }
      }
    })

    order = {
      ...order,
      total: order.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }

    orders = orders.map(o => (o.id === order.id ? order : o))

    const updatedInventory = deductInventoryForCart(cartItems, state.products, state.inventory)
    const { products: updatedProducts } = checkProductAvailability(state.products, updatedInventory)

    const tables = state.tables.map(t =>
      t.id === tableId ? { ...t, status: 'occupied' } : t
    )

    set(s => ({
      state: {
        ...s.state,
        orders,
        inventory: updatedInventory,
        products: updatedProducts,
        tables,
      },
    }))

    get().saveToStorage()
  },

  freeTable: (tableId) => {
    const { state } = get()
    const unpaid = state.orders.find(
      o => o.tableId === tableId && o.paymentStatus !== 'paid' && o.status !== 'cancelled'
    )
    if (unpaid) return false

    set(s => ({
      state: {
        ...s.state,
        tables: s.state.tables.map(t =>
          t.id === tableId ? { ...t, status: 'free' } : t
        ),
      },
    }))
    get().saveToStorage()
    return true
  },

  // ==================== PAYMENTS ====================
  processPayment: ({ order, method, amountToPay, received, change, currentUser }) => {
    const { state } = get()
    const isNew = order.id === 'new_counter'
    const isLiteMode = state.settings?.systemMode === 'counter'

    let orders = [...state.orders]
    let targetOrder

    if (isNew) {
      targetOrder = {
        id: Date.now(),
        type: 'counter',
        items: [...order.items],
        total: order.total,
        status: isLiteMode ? 'delivered' : 'pending',
        paymentMethod: null,
        paymentStatus: 'pending',
        paidAmount: 0,
        payments: [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        tableId: null,
      }
      orders.push(targetOrder)
    } else {
      targetOrder = orders.find(o => String(o.id) === String(order.id))
    }

    if (!targetOrder) return null

    const payment = {
      method,
      amount: amountToPay,
      received,
      change,
      timestamp: new Date().toISOString(),
      cashierName: currentUser.name,
    }

    targetOrder = {
      ...targetOrder,
      paidAmount: (targetOrder.paidAmount || 0) + amountToPay,
      payments: [...(targetOrder.payments || []), payment],
    }

    let cashRegister = { ...state.cashRegister }
    if (cashRegister.isOpen) {
      cashRegister = {
        ...cashRegister,
        movements: [
          ...(cashRegister.movements || []),
          {
            type: 'sale',
            amount: amountToPay,
            paymentMethod: method,
            orderId: targetOrder.id,
            timestamp: new Date().toISOString(),
            description: `Abono a Ticket #${targetOrder.id.toString().slice(-4)}`,
          },
        ],
      }
    }

    orders = orders.map(o => (o.id === targetOrder.id ? targetOrder : o))

    let sale = null

    if (targetOrder.paidAmount >= targetOrder.total) {
      targetOrder = {
        ...targetOrder,
        paymentStatus: 'paid',
        paymentMethod: targetOrder.payments.length > 1 ? 'mixed' : method,
      }
      orders = orders.map(o => (o.id === targetOrder.id ? targetOrder : o))

      sale = {
        id: Date.now(),
        orderId: targetOrder.id,
        items: [...targetOrder.items],
        subtotal: targetOrder.total,
        total: targetOrder.total,
        paymentMethod: targetOrder.paymentMethod,
        paymentsBreakdown: targetOrder.payments,
        timestamp: new Date().toISOString(),
        cashierId: currentUser.id,
        cashierName: currentUser.name,
      }

      set(s => ({
        state: {
          ...s.state,
          orders,
          cashRegister,
          sales: [...(s.state.sales || []), sale],
        },
      }))
    } else {
      set(s => ({ state: { ...s.state, orders, cashRegister } }))
    }

    get().saveToStorage()
    return { order: targetOrder, sale, fullyPaid: !!sale }
  },

  // ==================== PRODUCTS ====================
  toggleProductActive: (productId) => {
    set(s => ({
      state: {
        ...s.state,
        products: s.state.products.map(p =>
          p.id === productId ? { ...p, active: !p.active } : p
        ),
      },
    }))
    get().saveToStorage()
  },

  deleteProduct: (productId) => {
    set(s => ({
      state: {
        ...s.state,
        products: s.state.products.filter(p => p.id !== productId),
      },
    }))
    get().saveToStorage()
  },

  saveProduct: (product) => {
    const { state } = get()
    const exists = state.products.find(p => p.id === product.id)
    set(s => ({
      state: {
        ...s.state,
        products: exists
          ? s.state.products.map(p => (p.id === product.id ? product : p))
          : [...s.state.products, product],
      },
    }))
    get().saveToStorage()
  },

  // ==================== DARK MODE ====================
  toggleDarkMode: () => {
    document.body.classList.toggle('dark')
    const isDark = document.body.classList.contains('dark')
    const btn = document.getElementById('darkModeBtn')
    if (btn) btn.innerText = isDark ? '☀️' : '🌙'
    // Store dark mode preference in Firestore as part of user settings
    set(s => ({
      state: {
        ...s.state,
        settings: { ...s.state.settings, darkMode: isDark },
      },
    }))
    get().saveToStorage()
  },
}))

export default useAppStore
