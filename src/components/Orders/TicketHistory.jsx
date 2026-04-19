import { useState, useEffect } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import ReceiptModal from '../POS/ReceiptModal'
import { getTodayLocalStr } from '../../lib/helpers'

export default function TicketHistory() {
  const { state } = useAppStore()
  const { openModal } = useModalStore()
  const [selectedDate, setSelectedDate] = useState(getTodayLocalStr())
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getTodayLocalStr()

  useEffect(() => { loadTickets() }, [selectedDate, state.sales])

  const loadTickets = () => {
    setLoading(true)
    const start = new Date(selectedDate + 'T00:00:00')
    const end = new Date(selectedDate + 'T23:59:59')
    const filtered = (state.sales || [])
      .filter(s => { const d = new Date(s.timestamp); return d >= start && d <= end })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    setTickets(filtered)
    setLoading(false)
  }

  const handleDelete = (saleId, orderId) => openModal(<DeleteTicketModal saleId={saleId} orderId={orderId} />)

  return (
    <div className="animate-slideIn h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 shrink-0 border-b border-theme-beige pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">🧾 Historial de Tickets</h2>
          <span className="bg-white px-3 py-1 rounded-lg text-sm font-bold text-theme-textMuted border border-theme-beige shadow-sm">
            {loading ? 'Cargando...' : `Total: ${tickets.length} tickets`}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-theme-beige shadow-sm">
          <span className="text-xl">📅</span>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent font-black text-theme-text focus:outline-none cursor-pointer" />
          {selectedDate !== today && (
            <button onClick={() => setSelectedDate(today)} className="ml-2 text-xs bg-theme-bg px-3 py-1.5 rounded-lg text-theme-text font-bold hover:bg-theme-beige transition border border-theme-beige shadow-sm">Ir a Hoy</button>
          )}
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-auto scrollbar-thin pr-2 pb-4">
        {loading
          ? <p className="text-center py-12 text-theme-textMuted">Cargando...</p>
          : tickets.length === 0
            ? <p className="text-theme-textMuted text-center py-12 font-medium text-lg">No hay cobros registrados en esta fecha.</p>
            : tickets.map(sale => (
              <div key={sale.id} className="glass bg-white/80 border border-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-md">
                <div>
                  <p className="font-extrabold text-theme-text text-lg">Ticket #{sale.orderId?.toString().slice(-4)}</p>
                  <p className="text-xs font-bold text-theme-textMuted mt-1">🕒 {new Date(sale.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-sm font-medium mt-2 text-theme-text">{(sale.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                </div>
                <div className="text-left md:text-right flex flex-col justify-between items-start md:items-end h-full">
                  <p className="font-extrabold text-xl text-theme-greenDark mb-3">${sale.total.toLocaleString()}</p>
                  <div className="flex gap-2 mt-auto">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {sale.paymentMethod === 'cash' ? '💵 Efectivo' : '📱 Transferencia'}
                    </span>
                    <button onClick={() => openModal(<ReceiptModal sale={sale} />)} className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-theme-bg border border-theme-beige hover:bg-theme-beige transition text-theme-text">🖨️ Ver Ticket</button>
                    <button onClick={() => handleDelete(sale.id, sale.orderId)} className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">🗑️ Borrar</button>
                  </div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

function DeleteTicketModal({ saleId, orderId }) {
  const { saveToStorage, logActivity } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const [password, setPassword] = useState('')

  const execute = () => {
    if (password !== '726188') return showToast('Contraseña incorrecta', 'error')
    useAppStore.setState(s => ({
      state: {
        ...s.state,
        sales: s.state.sales.filter(s2 => s2.id !== saleId),
        orders: s.state.orders.filter(o => o.id !== orderId),
        cashRegister: {
          ...s.state.cashRegister,
          movements: (s.state.cashRegister?.movements || []).filter(m => m.orderId !== orderId),
        },
      }
    }))
    logActivity('TICKET_DELETED', `Ticket #${orderId?.toString().slice(-4)} eliminado`)
    saveToStorage()
    showToast('✅ Ticket eliminado', 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-red-400 text-center">
      <div className="text-5xl mb-4">👻</div>
      <h3 className="text-xl font-extrabold mb-2 text-red-600">¿Eliminar Ticket?</h3>
      <p className="text-sm text-theme-text font-medium mb-6">Estás a punto de borrar el ticket #{orderId?.toString().slice(-4)} de la base de datos.</p>
      <div className="mb-6">
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && execute()}
          className="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-xl text-center text-2xl tracking-widest focus:outline-none focus:border-red-500 font-bold" placeholder="******" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
        <button onClick={execute} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition">Borrar Ticket</button>
      </div>
    </div>
  )
}
