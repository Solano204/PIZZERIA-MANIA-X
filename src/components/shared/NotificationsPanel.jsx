import { useEffect, useRef } from 'react'
import useAppStore from '../../store/useAppStore'

export default function NotificationsPanel({ onClose }) {
  const { state, currentUser, markNotifRead, clearNotifications } = useAppStore()
  const panelRef = useRef(null)

  const relevant = (state.notifications || [])
    .filter(n => n.forRoles.length === 0 || n.forRoles.includes(currentUser?.role))
    .slice(0, 20)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-10 w-80 glass rounded-2xl p-4 z-50 animate-slideIn max-h-96 flex flex-col shadow-xl border border-white"
    >
      <div className="flex items-center justify-between mb-3 border-b border-theme-beige pb-2 shrink-0">
        <h3 className="font-bold flex items-center gap-2 text-theme-greenDark">🔔 Notificaciones</h3>
        <button
          onClick={clearNotifications}
          className="text-xs font-bold text-theme-textMuted hover:text-red-500 bg-white/60 hover:bg-white px-2 py-1 rounded-md transition shadow-sm border border-transparent hover:border-red-200"
        >
          Limpiar
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto scrollbar-thin pr-1 flex-1">
        {relevant.length === 0
          ? <p className="text-theme-textMuted text-sm text-center py-4">Sin notificaciones</p>
          : relevant.map(n => (
            <div
              key={n.id}
              onClick={() => markNotifRead(n.id)}
              className={`p-3 rounded-lg ${n.read ? 'bg-white/40' : 'bg-white/80 border border-white'} text-sm cursor-pointer hover:bg-white transition`}
            >
              <p className={n.read ? 'text-theme-textMuted' : 'text-theme-text font-medium'}>{n.message}</p>
              <p className="text-xs text-theme-textMuted mt-1">
                {new Date(n.timestamp).toLocaleString('es-MX')}
              </p>
            </div>
          ))
        }
      </div>
    </div>
  )
}
