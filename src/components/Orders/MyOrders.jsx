import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import { getStatusClass, getStatusLabel } from '../../lib/helpers'
import ConfirmModal from '../shared/ConfirmModal'

export default function MyOrders() {
  const { state, currentUser, saveToStorage } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()

  const myOrders = (state.orders || [])
    .filter(o => o.createdBy === currentUser?.id && !o.hiddenFromWaiter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const handleClear = () => {
    openModal(
      <ConfirmModal
        title="🧹 Limpiar mi Historial"
        message="Se ocultarán de tu lista todos los pedidos ya Entregados, Cobrados o Cancelados. Los pedidos en cocina seguirán visibles."
        onConfirm={() => {
          let count = 0
          useAppStore.setState(s => ({
            state: {
              ...s.state,
              orders: s.state.orders.map(o => {
                if (o.createdBy === currentUser.id && !o.hiddenFromWaiter) {
                  if (['delivered', 'cancelled'].includes(o.status) || o.paymentStatus === 'paid') {
                    count++
                    return { ...o, hiddenFromWaiter: true }
                  }
                }
                return o
              })
            }
          }))
          saveToStorage()
          showToast(count > 0 ? `✅ Se limpiaron ${count} pedidos` : 'Solo se limpian pedidos terminados', count > 0 ? 'success' : 'info')
        }}
        danger
      />
    )
  }

  return (
    <div className="animate-slideIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-theme-beige pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">📋 Mis Pedidos</h2>
        <button onClick={handleClear} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2">
          🧹 Limpiar Historial
        </button>
      </div>
      <div className="space-y-4">
        {myOrders.slice(0, 20).map(order => {
          const tableDisplay = order.type === 'table' ? (order.tableName || `Mesa ${order.tableId}`) : 'Mostrador'
          return (
            <div key={order.id} className="bg-white/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-white">
              <div className="mb-3 md:mb-0">
                <p className="font-extrabold text-theme-text text-lg">#{order.id.toString().slice(-4)} - <span className="text-theme-greenDark">{tableDisplay}</span></p>
                <p className="text-sm text-theme-textMuted font-medium mt-1">{(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                <p className="text-xs text-theme-textMuted mt-1">🕒 {new Date(order.createdAt).toLocaleString('es-MX')}</p>
              </div>
              <div className="text-left md:text-right flex flex-col justify-between items-start md:items-end h-full">
                <p className="font-extrabold text-xl text-theme-greenDark mb-2">${order.total.toLocaleString()}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span>
              </div>
            </div>
          )
        })}
        {myOrders.length === 0 && <p className="text-theme-textMuted text-center py-8 font-medium">No tienes pedidos activos en tu lista</p>}
      </div>
    </div>
  )
}
