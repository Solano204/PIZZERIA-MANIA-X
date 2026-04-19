import useAppStore from '../../store/useAppStore'

const NAV_ITEMS = {
  admin: [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'kitchen', icon: '👨‍🍳', label: 'Cocina' },
    { id: 'waiter', icon: '🍽️', label: 'Meseros' },
    { id: 'inventory', icon: '📦', label: 'Inventario' },
    { id: 'products', icon: '🍴', label: 'Productos' },
    { id: 'users', icon: '👥', label: 'Usuarios' },
    { id: 'reports', icon: '📈', label: 'Estadísticas' },
    { id: 'settings', icon: '⚙️', label: 'Configuración' },
  ],
  cashier: [
    { id: 'pos', icon: '🛒', label: 'Punto de Venta' },
    { id: 'orders', icon: '📋', label: 'Pedidos' },
    { id: 'cashregister', icon: '💵', label: 'Caja' },
    { id: 'tickethistory', icon: '🧾', label: 'Historial Tickets' },
  ],
  kitchen: [{ id: 'kitchen', icon: '👨‍🍳', label: 'Cocina' }],
  waiter: [
    { id: 'waiter', icon: '🍽️', label: 'Mesas' },
    { id: 'myorders', icon: '📋', label: 'Mis Pedidos' },
  ],
}

export default function Navigation({ currentView, onNavigate }) {
  const { currentUser, currentBranch, state } = useAppStore()
  if (!currentUser) return null

  let items = NAV_ITEMS[currentUser.role] || []

  if (state.settings?.systemMode === 'counter') {
    items = items.filter(i => !['kitchen', 'waiter', 'myorders'].includes(i.id))
  }

  if (currentUser.role === 'admin' && currentBranch === 'sucursal_principal') {
    if (!items.find(i => i.id === 'global')) {
      items = [items[0], { id: 'global', icon: '🌍', label: 'Control Global' }, ...items.slice(1)]
    }
  }

  return (
    <nav className="glass border-b border-white px-4 py-2 shrink-0">
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap
              ${currentView === item.id
                ? 'bg-theme-green text-white shadow-md font-medium'
                : 'hover:bg-white/60 text-theme-textMuted'
              }`}
          >
            <span>{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
