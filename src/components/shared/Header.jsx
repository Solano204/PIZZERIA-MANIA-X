import { useState, useEffect } from 'react'
import useAppStore from '../../store/useAppStore'
import NotificationsPanel from './NotificationsPanel'

const ROLE_NAMES = { admin: 'Administrador', cashier: 'Cajero', kitchen: 'Cocina', waiter: 'Mesero' }
const ROLE_ICONS = { admin: '👨‍💼', cashier: '💰', kitchen: '👨‍🍳', waiter: '🍽️' }

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="hidden lg:flex flex-1 justify-center">
      <div className="glass px-6 py-1.5 rounded-2xl border border-white shadow-sm flex flex-col items-center justify-center bg-white/40">
        <span className="text-[10px] font-bold text-theme-textMuted uppercase tracking-widest leading-none mb-1">
          {time.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <span className="text-2xl font-black text-theme-greenDark tracking-wider leading-none drop-shadow-sm">
          {time.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>
      </div>
    </div>
  )
}

export default function Header({ onLogout }) {
  const { currentUser, currentBranch, toggleDarkMode, isSaving } = useAppStore()
  const [showNotifs, setShowNotifs] = useState(false)

  if (!currentUser) return null

  const branchLabel = currentBranch === 'sucursal_principal' ? 'Principal' : 'Centro'

  return (
    <header className="glass border-b border-white px-3 md:px-4 py-3 flex items-center justify-between shrink-0 gap-2">
      <div className="flex items-center gap-2 md:gap-3">
        <img src="https://chicfkbdfqdrrevtrrby.supabase.co/storage/v1/object/public/PIZZERIA_ADMIN/mania.jpg" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg drop-shadow-sm" />
        <div>
          <h1 className="text-lg md:text-xl font-bold text-theme-greenDark leading-tight flex items-center gap-2">
            SISTEMA POS
            <span className="text-[10px] md:text-xs bg-theme-green text-white px-2 py-1 rounded-lg shadow-sm">
              {branchLabel}
            </span>
            {isSaving && (
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg animate-pulse-custom">
                ☁️ Guardando...
              </span>
            )}
          </h1>
        </div>
      </div>

      <Clock />

      <div className="flex items-center gap-2 md:gap-4">
        <button
          id="darkModeBtn"
          onClick={toggleDarkMode}
          className="p-1.5 md:p-2 hover:bg-white/60 rounded-lg transition text-xl md:text-2xl"
          title="Cambiar Tema"
        >
          🌙
        </button>

        <div className="relative">
          <button onClick={() => setShowNotifs(v => !v)} className="relative cursor-pointer p-1">
            <span className="text-xl md:text-2xl">🔔</span>
            <NotifBadge />
          </button>
          {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
        </div>

        <div className="flex items-center gap-2 glass px-2 md:px-3 py-1.5 md:py-2 rounded-xl border border-white">
          <span className="text-lg md:text-xl">{ROLE_ICONS[currentUser.role]}</span>
          <div className="hidden sm:block">
            <p className="text-xs md:text-sm font-bold text-theme-greenDark leading-tight">{currentUser.name}</p>
            <p className="text-[10px] md:text-xs text-theme-textMuted font-medium">{ROLE_NAMES[currentUser.role]}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 md:p-2 hover:bg-white/60 rounded-lg transition text-lg md:text-xl"
          title="Cerrar Sesión"
        >
          🚪
        </button>
      </div>
    </header>
  )
}

function NotifBadge() {
  const { state, currentUser } = useAppStore()
  const count = (state.notifications || []).filter(
    n => !n.read && (n.forRoles.length === 0 || n.forRoles.includes(currentUser?.role))
  ).length
  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-md">
      {count}
    </span>
  )
}
