import { useState, useEffect } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import { getStatusClass, getStatusLabel, getTodayLocalStr } from '../../lib/helpers'
import PaymentModal from '../POS/PaymentModal'
import ReceiptModal from '../POS/ReceiptModal'

export default function Orders() {
  const { state, currentUser, processPayment, saveToStorage } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()
  const [selectedDate, setSelectedDate] = useState(getTodayLocalStr())
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getTodayLocalStr()

  useEffect(() => { loadOrders() }, [selectedDate, state.orders])

  const loadOrders = () => {
    setLoading(true)
    const start = new Date(selectedDate + 'T00:00:00')
    const end = new Date(selectedDate + 'T23:59:59')
    const filtered = (state.orders || []).filter(o => {
      const d = new Date(o.createdAt)
      return d >= start && d <= end && o.status !== 'cancelled'
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    setOrders(filtered)
    setLoading(false)
  }

  const handlePay = (order, method) => {
    openModal(
      <PaymentModal
        order={order} method={method}
        onConfirm={({ method: m, amountToPay, received, change }) => {
          const result = processPayment({ order, method: m, amountToPay, received, change, currentUser })
          if (result?.sale) openModal(<ReceiptModal sale={result.sale} />)
          else showToast(`Abono guardado. Restan: $${(result?.order?.total - result?.order?.paidAmount).toLocaleString()}`, 'info')
        }}
      />
    )
  }

  const handleDelete = (orderId) => openModal(<DeleteOrderModal orderId={orderId} />)

  return (
    <div className="animate-slideIn h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-theme-beige pb-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">📋 Historial de Pedidos</h2>
          <span className="bg-white px-3 py-1 rounded-lg text-sm font-bold text-theme-textMuted border border-theme-beige shadow-sm">
            {loading ? 'Cargando...' : `${orders.length} tickets`}
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

      <div className="space-y-4 flex-1 overflow-y-auto scrollbar-thin pr-2 pb-4">
        {loading
          ? <p className="text-center py-12 text-theme-textMuted font-medium">Cargando pedidos...</p>
          : orders.length === 0
            ? <p className="text-theme-textMuted text-center py-12 font-medium text-lg">No hay pedidos registrados en esta fecha.</p>
            : orders.map(order => {
              const tableDisplay = order.type === 'table' ? (order.tableName || `Mesa ${order.tableId}`) : 'Mostrador'
              return (
                <div key={order.id} className="glass bg-white/60 border border-white rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-extrabold text-theme-text">#{order.id.toString().slice(-4)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${order.type === 'table' ? 'bg-purple-400' : 'bg-blue-400'}`}>{tableDisplay}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.paymentStatus === 'paid' ? '✅ Pagado' : '⏳ Pendiente Pago'}
                      </span>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-extrabold text-xl text-theme-greenDark">${order.total.toLocaleString()}</p>
                      <p className="text-xs font-bold text-theme-textMuted mt-1">🕒 {new Date(order.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-medium mt-3 border-t border-theme-beige pt-3">
                    {(order.items || []).map((item, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-theme-bg border border-theme-beige text-theme-text">
                        <strong className="text-theme-greenDark">{item.quantity}x</strong> {item.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-theme-beige w-full justify-end">
                    {order.status === 'delivered' && order.paymentStatus !== 'paid' && (
                      <>
                        <button onClick={() => handlePay(order, 'cash')} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-green-500 text-white hover:bg-green-600 transition shadow-sm">💵 Cobrar Efectivo</button>
                        <button onClick={() => handlePay(order, 'transfer')} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm">📱 Cobrar Transf.</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(order.id)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition shadow-sm ml-auto">🗑️ Eliminar</button>
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

function DeleteOrderModal({ orderId }) {
  const { state, saveToStorage, logActivity } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const execute = () => {
    if (password !== '726188') { showToast('Contraseña incorrecta', 'error'); return }
    const order = (state.orders || []).find(o => o.id === orderId)
    if (order) {
      if (order.tableId) {
        useAppStore.setState(s => ({
          state: {
            ...s.state,
            tables: s.state.tables.map(t => t.id === order.tableId ? { ...t, status: 'free' } : t),
            orders: s.state.orders.filter(o => o.id !== orderId),
            sales: s.state.sales.filter(s2 => s2.orderId !== orderId),
          }
        }))
      } else {
        useAppStore.setState(s => ({
          state: {
            ...s.state,
            orders: s.state.orders.filter(o => o.id !== orderId),
            sales: s.state.sales.filter(s2 => s2.orderId !== orderId),
          }
        }))
      }
      logActivity('ORDER_DELETED', `Pedido #${orderId.toString().slice(-4)} eliminado`)
      saveToStorage()
      showToast('✅ Pedido eliminado', 'success')
    }
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-red-400 text-center">
      <div className="text-5xl mb-4">🛡️</div>
      <h3 className="text-xl font-extrabold mb-2 text-red-600">Autorización Requerida</h3>
      <p className="text-sm text-theme-text font-medium mb-6">Ingresa la clave de administrador para eliminar este pedido.</p>
      <div className="mb-6 relative">
        <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && execute()}
          className="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-xl text-center text-2xl tracking-widest focus:outline-none focus:border-red-500 font-bold pr-12" placeholder="******" />
        <button type="button" onClick={() => setShowPass(v => !v)} className="absolute inset-y-0 right-0 px-4 flex items-center text-xl text-red-400 hover:text-red-600 transition">
          {showPass ? '🙈' : '👁️'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
        <button onClick={execute} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition">Destruir Pedido</button>
      </div>
    </div>
  )
}
