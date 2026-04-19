import { useState, useEffect } from 'react'
import useAppStore from './store/useAppStore'
import useToastStore from './store/useToastStore'

import Login from './pages/Login'
import Header from './components/shared/Header'
import Navigation from './components/shared/Navigation'
import ToastContainer from './components/shared/Toast'
import ModalContainer from './components/shared/Modal'

import Dashboard from './components/Dashboard/Dashboard'
import POS from './components/POS/POS'
import KitchenBoard from './components/Kitchen/KitchenBoard'
import FloorPlan from './components/Waiter/FloorPlan'
import Inventory from './components/Inventory/Inventory'
import Products from './components/Products/Products'
import Users from './components/Users/Users'
import Reports from './components/Reports/Reports'
import Settings from './components/Settings/Settings'
import Orders from './components/Orders/Orders'
import CashRegister from './components/CashRegister/CashRegister'
import MyOrders from './components/Orders/MyOrders'
import TicketHistory from './components/Orders/TicketHistory'

const DEFAULT_VIEWS = {
  admin: 'dashboard',
  cashier: 'pos',
  kitchen: 'kitchen',
  waiter: 'waiter',
}

const VIEW_COMPONENTS = {
  dashboard: Dashboard,
  pos: POS,
  kitchen: KitchenBoard,
  waiter: FloorPlan,
  inventory: Inventory,
  products: Products,
  users: Users,
  reports: Reports,
  settings: Settings,
  orders: Orders,
  cashregister: CashRegister,
  myorders: MyOrders,
  tickethistory: TicketHistory,
}

export default function App() {
  const { currentUser, isLoading, checkSession, logout, state } = useAppStore()
  const { showToast } = useToastStore()
  const [currentView, setCurrentView] = useState(null)

  // Apply saved dark mode preference from Firestore state
  useEffect(() => {
    if (state?.settings?.darkMode) {
      document.body.classList.add('dark')
    }
  }, [state?.settings?.darkMode])

  // Check for existing Firebase session on mount
  useEffect(() => {
    checkSession().then(user => {
      if (user) {
        setCurrentView(DEFAULT_VIEWS[user.role] || 'pos')
      }
    })
  }, [])

  // Online/offline notifications
  useEffect(() => {
    const onOffline = () => showToast('⚠️ Sin internet. Los cambios se sincronizarán al reconectarte.', 'warning')
    const onOnline = () => showToast('✅ Conexión recuperada. Sincronizando con Firebase...', 'success')
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  const handleLogin = () => {
    const user = useAppStore.getState().currentUser
    if (user) setCurrentView(DEFAULT_VIEWS[user.role] || 'pos')
  }

  const handleLogout = async () => {
    await logout()
    setCurrentView(null)
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-theme-bg">
        <div className="text-6xl mb-4 animate-pulse-custom">🍕</div>
        <h2 className="text-xl font-bold text-theme-greenDark">Conectando con Firebase...</h2>
        <p className="text-sm text-theme-textMuted mt-2">Cargando datos en tiempo real</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <>
        <Login onSuccess={handleLogin} />
        <ToastContainer />
      </>
    )
  }

  const ViewComponent = currentView ? VIEW_COMPONENTS[currentView] : null

  return (
    <div className="h-full flex flex-col bg-theme-bg text-theme-text overflow-auto">
      <Header onLogout={handleLogout} />
      <Navigation currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 overflow-auto p-4 scrollbar-thin">
        {ViewComponent ? <ViewComponent /> : (
          <div className="flex items-center justify-center h-full">
            <p className="text-theme-textMuted font-medium">Selecciona una sección del menú</p>
          </div>
        )}
      </main>

      <ModalContainer />
      <ToastContainer />
    </div>
  )
}
