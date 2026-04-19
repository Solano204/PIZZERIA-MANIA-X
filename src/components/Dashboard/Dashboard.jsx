import useAppStore from '../../store/useAppStore'
import { getStatusClass, getStatusLabel } from '../../lib/helpers'

export default function Dashboard() {
  const { state } = useAppStore()

  const today = new Date().toDateString()
  const todaySales = (state.sales || []).filter(s => new Date(s.timestamp).toDateString() === today)
  const totalToday = todaySales.reduce((sum, s) => sum + s.total, 0)
  const ordersToday = (state.orders || []).filter(o => new Date(o.createdAt).toDateString() === today).length
  const pendingOrders = (state.orders || []).filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length
  const lowStockItems = (state.inventory || []).filter(i => i.stock <= i.minStock).length

  return (
    <div className="animate-slideIn">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-theme-greenDark">
        📊 Dashboard <span className="text-sm font-normal text-theme-textMuted">Resumen del día</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Ventas Hoy" value={`$${totalToday.toLocaleString()}`} icon="💰" sub={`${todaySales.length} transacciones`} valueClass="text-green-600" />
        <StatCard label="Pedidos Hoy" value={ordersToday} icon="📋" sub={`${pendingOrders} pendientes`} valueClass="text-blue-600" />
        <StatCard label="Productos" value={(state.products || []).filter(p => p.active).length} icon="🍕" sub="activos en menú" valueClass="text-purple-600" />
        <StatCard label="Stock Bajo" value={lowStockItems} icon={lowStockItems > 0 ? '⚠️' : '✅'} sub="insumos por reabastecer" valueClass={lowStockItems > 0 ? 'text-red-600' : 'text-green-600'} alert={lowStockItems > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 bg-white/60">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-theme-greenDark">🔥 Pedidos Activos</h3>
          <div className="space-y-3 max-h-80 overflow-auto scrollbar-thin pr-2">
            {(state.orders || [])
              .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
              .slice(0, 10)
              .map(o => {
                const tableNameDisplay = o.type === 'table' ? (o.tableName || `Mesa ${o.tableId}`) : 'Mostrador'
                return (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-white/50 shadow-sm">
                    <div>
                      <p className="font-bold text-theme-text">#{o.id.toString().slice(-4)} - {tableNameDisplay}</p>
                      <p className="text-xs text-theme-textMuted font-medium">
                        {o.items.length} productos • <span className="text-theme-greenDark font-bold">${o.total}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusClass(o.status)}`}>
                      {getStatusLabel(o.status)}
                    </span>
                  </div>
                )
              })}
            {pendingOrders === 0 && <p className="text-theme-textMuted text-center py-4">Sin pedidos activos</p>}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 bg-white/60">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-theme-greenDark">📦 Alertas de Inventario</h3>
          <div className="space-y-3 max-h-80 overflow-auto scrollbar-thin pr-2">
            {(state.inventory || []).filter(i => i.stock <= i.minStock).map(i => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
                <div>
                  <p className="font-bold text-theme-text">{i.name}</p>
                  <p className="text-xs text-theme-textMuted">Proveedor: {i.supplier}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-bold">{i.stock} {i.unit}</p>
                  <p className="text-xs text-red-400">Mín: {i.minStock}</p>
                </div>
              </div>
            ))}
            {lowStockItems === 0 && <p className="text-green-600 font-medium text-center py-4">✅ Todo el inventario está bien</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, sub, valueClass, alert }) {
  return (
    <div className={`glass rounded-2xl p-5 card-hover bg-white/60 ${alert ? 'border-2 border-red-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-theme-textMuted text-sm font-medium">{label}</p>
          <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
      <p className="text-xs text-theme-textMuted mt-2">{sub}</p>
    </div>
  )
}
