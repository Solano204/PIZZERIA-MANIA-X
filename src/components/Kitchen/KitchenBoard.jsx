import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useToastStore from '../../store/useToastStore'
import useModalStore from '../../store/useModalStore'
import { getStatusClass, getStatusLabel } from '../../lib/helpers'
import KitchenTicketModal from '../shared/KitchenTicketModal'

export default function KitchenBoard() {
  const { state, updateOrderStatus } = useAppStore()
  const { showToast } = useToastStore()
  const { openModal } = useModalStore()
  const [tab, setTab] = useState('active')

  const pendingOrders = (state.orders || [])
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const historyOrders = (state.orders || [])
    .filter(o => ['delivered', 'ready', 'cancelled'].includes(o.status) && new Date(o.createdAt) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.statusUpdatedAt || b.createdAt) - new Date(a.statusUpdatedAt || a.createdAt))

  const grouped = {}
  historyOrders.forEach(o => {
    const dateObj = new Date(o.statusUpdatedAt || o.createdAt)
    const key = dateObj.toLocaleDateString('en-CA')
    const label = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
    if (!grouped[key]) grouped[key] = { label, orders: [] }
    grouped[key].orders.push(o)
  })
  const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  const handleStatus = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus)
    showToast(`✅ Pedido: ${getStatusLabel(newStatus)}`, 'success')
  }

  return (
    <div className="animate-slideIn h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">👨‍🍳 Cocina</h2>
          <div className="flex bg-white/60 p-1 rounded-xl border border-white">
            <button onClick={() => setTab('active')} className={`${tab === 'active' ? 'bg-theme-green text-white shadow-md' : 'text-theme-textMuted hover:bg-white/50'} px-4 py-2 rounded-lg text-sm transition font-bold`}>
              🔥 Activos ({pendingOrders.length})
            </button>
            <button onClick={() => setTab('history')} className={`${tab === 'history' ? 'bg-theme-green text-white shadow-md' : 'text-theme-textMuted hover:bg-white/50'} px-4 py-2 rounded-lg text-sm transition font-bold`}>
              📅 Historial Semanal
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto pb-4 scrollbar-thin flex-1 pr-2">
        {tab === 'active' ? (
          pendingOrders.length === 0
            ? <div className="h-full flex items-center justify-center"><p className="text-theme-textMuted py-12 text-xl font-medium">🎉 ¡La cocina está al día!</p></div>
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pendingOrders.map(o => (
                  <OrderCard key={o.id} order={o} isHistory={false} onStatus={handleStatus} onPrint={() => openModal(<KitchenTicketModal order={o} />)} products={state.products || []} />
                ))}
              </div>
            )
        ) : (
          sortedKeys.length === 0
            ? <p className="text-theme-textMuted py-12 text-xl font-medium">No hay pedidos en los últimos 7 días.</p>
            : (
              <div className="space-y-8">
                {sortedKeys.map(key => (
                  <div key={key} className="bg-white/60 rounded-2xl p-5 border border-white animate-slideIn shadow-sm">
                    <h3 className="text-lg font-bold text-theme-greenDark mb-4 border-b border-theme-beige pb-3 capitalize flex items-center gap-3">
                      📅 {grouped[key].label}
                      <span className="text-xs text-white bg-theme-green px-3 py-1 rounded-full font-bold shadow-sm">{grouped[key].orders.length} pedidos</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {grouped[key].orders.map(o => (
                        <OrderCard key={o.id} order={o} isHistory={true} onStatus={handleStatus} onPrint={() => openModal(<KitchenTicketModal order={o} />)} products={state.products || []} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, isHistory, onStatus, onPrint, products }) {
  const endTime = order.statusUpdatedAt ? new Date(order.statusUpdatedAt) : new Date()
  const waitTime = Math.floor((endTime - new Date(order.createdAt)) / 60000)

  const kitchenItems = []
  ;(order.items || []).forEach(item => {
    const prod = products.find(p => p.id === item.productId)
    if (!prod) return
    const cat = prod.category?.toLowerCase() || ''
    if (['drink', 'bebidas', 'bebida'].includes(cat)) return
    const unDelivered = item.quantity - (item.deliveredQty || 0)
    if (isHistory || unDelivered > 0) {
      kitchenItems.push({ ...item, displayQty: isHistory ? item.quantity : unDelivered, isNew: !isHistory && (item.quantity - (item.printedQty || 0)) > 0 })
    }
  })

  const hasNew = kitchenItems.some(i => i.isNew)
  const tableDisplay = order.type === 'table' ? (order.tableName || `Mesa ${order.tableId}`) : 'Mostrador'

  return (
    <div className={`bg-white rounded-2xl p-4 flex flex-col border border-white shadow-sm
      ${isHistory ? 'opacity-80 border-l-4 border-l-green-400 bg-theme-bg' : 'card-hover'}
      ${!isHistory && waitTime > 15 && !hasNew ? 'border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}
      ${!isHistory && waitTime > 10 && waitTime <= 15 && !hasNew ? 'border-2 border-yellow-400' : ''}
      ${hasNew ? 'border-2 border-orange-400 shadow-[0_0_15px_rgba(243,167,13,0.3)]' : ''}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-xl font-extrabold text-theme-text">#{order.id.toString().slice(-4)}</span>
          <span className={`ml-1 px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm ${order.type === 'table' ? 'bg-purple-400' : 'bg-blue-400'}`}>{tableDisplay}</span>
          {hasNew && <span className="ml-1 px-2 py-1 rounded-md text-[10px] font-black bg-orange-100 text-orange-700 border border-orange-300 animate-pulse-custom">(NUEVO)</span>}
        </div>
        <span className={`text-xs ${!isHistory && waitTime > 15 ? 'text-red-600 animate-pulse-custom font-extrabold' : !isHistory && waitTime > 10 ? 'text-yellow-600 font-bold' : 'text-theme-textMuted font-medium'}`}>
          ⏱️ {waitTime} min
        </span>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        {kitchenItems.length > 0
          ? kitchenItems.map((item, i) => (
            <div key={i} className={`flex flex-col text-sm p-2 rounded-lg ${item.isNew ? 'bg-orange-50 border border-orange-300' : 'bg-theme-bg border border-theme-beige'} text-theme-text font-medium transition-colors`}>
              <div className="flex justify-between items-start">
                <div>
                  <strong className={`${item.isNew ? 'text-orange-700' : 'text-theme-greenDark'} mr-1`}>{item.displayQty}x</strong>
                  <span className={item.isNew ? 'text-orange-900 font-bold' : ''}>{item.name}</span>
                </div>
                {item.isNew && <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded shadow-sm">Nuevo</span>}
              </div>
              {item.note && (
                <div className="text-xs text-red-600 font-bold mt-1 bg-red-50 p-1 rounded border border-red-100 flex gap-1">
                  <span>⚠️</span><span>{item.note}</span>
                </div>
              )}
            </div>
          ))
          : <p className="text-xs text-blue-600 font-bold text-center py-3 bg-blue-50 rounded-lg border border-blue-200">🥤 Solo bebidas (Barra)</p>
        }
      </div>

      <div className="flex items-center justify-between mt-auto border-t border-theme-beige pt-3">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span>
          <button onClick={onPrint} className={`p-1.5 ${hasNew ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse-custom' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} border ${hasNew ? 'border-orange-600' : 'border-gray-300'} rounded-lg transition shadow-sm flex items-center justify-center`} title="Imprimir Comanda">
            🖨️
          </button>
        </div>
        {!isHistory && (
          <div className="flex gap-2">
            {order.status === 'pending' && <button onClick={() => onStatus(order.id, 'preparing')} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm font-bold transition shadow-sm">🍳 Preparar</button>}
            {order.status === 'preparing' && <button onClick={() => onStatus(order.id, 'ready')} className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm font-bold transition shadow-sm">✅ Listo</button>}
            {order.status === 'ready' && <button onClick={() => onStatus(order.id, 'delivered')} className="px-3 py-1.5 rounded-lg bg-purple-500 text-white hover:bg-purple-600 text-sm font-bold transition shadow-sm">🚀 Entregar</button>}
          </div>
        )}
        {isHistory && (
          <span className="text-xs text-theme-textMuted bg-white border border-theme-beige px-2 py-1 rounded-lg font-medium">
            ✅ {new Date(order.statusUpdatedAt || order.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}
