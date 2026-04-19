import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reports() {
  const { state } = useAppStore()
  const { openModal } = useModalStore()
  const [mode, setMode] = useState('weekly')
  const [selMonth, setSelMonth] = useState(new Date().getMonth())
  const [selYear, setSelYear] = useState(new Date().getFullYear())

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const sales = state.sales || []
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today.toDateString())
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0)
  const weekSales = sales.filter(s => new Date(s.timestamp) >= last7[0])
  const weekTotal = weekSales.reduce((sum, s) => sum + s.total, 0)

  let labels = [], chartData = []
  if (mode === 'weekly') {
    labels = last7.map(d => d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }))
    chartData = last7.map(d =>
      sales.filter(s => new Date(s.timestamp).toDateString() === d.toDateString()).reduce((sum, s) => sum + s.total, 0)
    )
  } else {
    const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      labels.push(String(i))
      chartData.push(
        sales.filter(s => {
          const sd = new Date(s.timestamp)
          return sd.getFullYear() === selYear && sd.getMonth() === selMonth && sd.getDate() === i
        }).reduce((sum, s) => sum + s.total, 0)
      )
    }
  }

  const chartConfig = {
    labels,
    datasets: [{
      label: 'Ingresos por día ($)', data: chartData,
      borderColor: '#7A9E7E', backgroundColor: 'rgba(167, 196, 170, 0.4)',
      borderWidth: 3, fill: true, tension: 0.3,
      pointBackgroundColor: '#4A504A', pointRadius: mode === 'monthly' ? 2 : 4,
    }],
  }

  const navigateMonth = (dir) => {
    let m = selMonth + dir, y = selYear
    if (m < 0) { m = 11; y-- } else if (m > 11) { m = 0; y++ }
    setSelMonth(m); setSelYear(y)
  }

  const generateDailyReport = () => {
    const total = todaySales.reduce((s, sale) => s + sale.total, 0)
    const cash = todaySales.filter(s => s.paymentMethod === 'cash').reduce((s, sale) => s + sale.total, 0)
    const transfer = todaySales.filter(s => s.paymentMethod === 'transfer').reduce((s, sale) => s + sale.total, 0)
    openModal(<SimpleReportModal title="Corte de Ventas Diario" sales={todaySales} total={total} cash={cash} transfer={transfer}
      dateStr={today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />)
  }

  const generateWeeklyReport = () => {
    const total = weekSales.reduce((s, sale) => s + sale.total, 0)
    const cash = weekSales.filter(s => s.paymentMethod === 'cash').reduce((s, sale) => s + sale.total, 0)
    const transfer = weekSales.filter(s => s.paymentMethod === 'transfer').reduce((s, sale) => s + sale.total, 0)
    const dateStr = `Del ${last7[0].toLocaleDateString('es-MX')} al ${today.toLocaleDateString('es-MX')}`
    openModal(<SimpleReportModal title="Reporte de Ventas Semanal" sales={weekSales} total={total} cash={cash} transfer={transfer} dateStr={dateStr} />)
  }

  return (
    <div className="animate-slideIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">📈 Estadísticas y Reportes</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={generateDailyReport} className="flex-1 md:flex-none btn-primary px-4 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2">📄 Ventas Hoy</button>
          <button onClick={generateWeeklyReport} className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition">📅 Ventas Semana</button>
          <button onClick={() => openModal(<InventoryReportModal />)} className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition">📦 Inventario</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <p className="text-theme-textMuted text-sm font-bold mb-1">Ventas del Día (Hoy)</p>
          <p className="text-4xl font-extrabold text-green-600">${todayTotal.toLocaleString()}</p>
          <p className="text-xs text-theme-textMuted font-medium mt-3 bg-theme-bg inline-block px-3 py-1.5 rounded-md border border-theme-beige">{todaySales.length} tickets procesados hoy</p>
        </div>
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <p className="text-theme-textMuted text-sm font-bold mb-1">Ventas de la Semana</p>
          <p className="text-4xl font-extrabold text-blue-600">${weekTotal.toLocaleString()}</p>
          <p className="text-xs text-theme-textMuted font-medium mt-3 bg-theme-bg inline-block px-3 py-1.5 rounded-md border border-theme-beige">{weekSales.length} tickets en total</p>
        </div>
      </div>

      <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-theme-beige pb-3 gap-3">
          <h3 className="font-extrabold text-lg text-theme-text">📊 Tendencia de Ingresos</h3>
          <div className="flex items-center gap-2">
            <select value={mode} onChange={e => setMode(e.target.value)} className="bg-white border border-theme-beige rounded-lg px-3 py-1.5 text-sm font-bold text-theme-text outline-none focus:border-theme-green shadow-sm">
              <option value="weekly">Últimos 7 días</option>
              <option value="monthly">Por Mes</option>
            </select>
            {mode === 'monthly' && (
              <div className="flex items-center gap-1 bg-white border border-theme-beige rounded-lg px-2 py-1 shadow-sm">
                <button onClick={() => navigateMonth(-1)} className="hover:bg-theme-beige px-2 py-0.5 rounded transition font-bold text-theme-text">&lt;</button>
                <span className="text-sm font-bold w-28 text-center text-theme-greenDark">{MONTHS[selMonth]} {selYear}</span>
                <button onClick={() => navigateMonth(1)} className="hover:bg-theme-beige px-2 py-0.5 rounded transition font-bold text-theme-text">&gt;</button>
              </div>
            )}
          </div>
        </div>
        <div className="w-full h-72">
          <Line data={chartConfig} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#EAE5D9' }, ticks: { callback: v => '$' + v } }, x: { grid: { display: false } } } }} />
        </div>
      </div>
    </div>
  )
}

function SimpleReportModal({ title, sales, total, cash, transfer, dateStr }) {
  const { closeModal } = useModalStore()
  const { currentUser } = useAppStore()
  const totalItems = sales.reduce((s, sale) => s + (sale.items || []).reduce((ss, i) => ss + i.quantity, 0), 0)

  return (
    <div className="bg-white text-theme-text rounded-3xl p-6 md:p-8 w-[95%] max-w-lg animate-slideIn shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin" id="printArea">
      <div className="text-center border-b-2 border-dashed border-theme-beige pb-6 mb-6">
        <p className="text-4xl mb-3">📈</p>
        <h3 className="text-2xl font-extrabold text-theme-greenDark">SISTEMA POS</h3>
        <p className="text-lg font-bold text-theme-text mt-2 uppercase">{title}</p>
        <p className="text-sm text-theme-textMuted mt-1 capitalize">{dateStr}</p>
      </div>
      <div className="space-y-4 mb-8">
        <div className="flex justify-between p-4 bg-theme-bg rounded-xl border border-theme-beige">
          <span className="font-bold text-theme-textMuted">Tickets Procesados:</span>
          <span className="font-extrabold text-theme-text">{sales.length}</span>
        </div>
        <div className="flex justify-between p-4 bg-theme-bg rounded-xl border border-theme-beige">
          <span className="font-bold text-theme-textMuted">Artículos Vendidos:</span>
          <span className="font-extrabold text-theme-text">{totalItems}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
            <p className="text-xs font-bold text-green-700">En Efectivo</p>
            <p className="text-xl font-extrabold text-green-600 mt-1">${cash.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <p className="text-xs font-bold text-blue-700">En Transferencia</p>
            <p className="text-xl font-extrabold text-blue-600 mt-1">${transfer.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-between items-center p-5 bg-white rounded-xl border-2 border-theme-green shadow-sm mt-4">
          <span className="font-extrabold text-lg text-theme-text">INGRESOS TOTALES:</span>
          <span className="font-extrabold text-2xl text-theme-greenDark">${total.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-center pt-6 border-t border-theme-beige text-xs font-medium text-theme-textMuted">
        <p>Reporte generado por: {currentUser?.name} ({currentUser?.role})</p>
        <p>Fecha de impresión: {new Date().toLocaleString('es-MX')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-8 print:hidden">
        <button onClick={closeModal} className="py-3.5 bg-theme-bg text-theme-text font-bold rounded-xl border border-theme-beige hover:bg-theme-beige transition">Cerrar</button>
        <button onClick={() => window.print()} className="btn-primary py-3.5 font-bold rounded-xl shadow-md flex items-center justify-center gap-2">🖨️ Imprimir</button>
      </div>
    </div>
  )
}

function InventoryReportModal() {
  const { state, currentUser } = useAppStore()
  const { closeModal } = useModalStore()
  const inventory = state.inventory || []
  const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.cost, 0)
  const lowStock = inventory.filter(i => i.stock <= i.minStock)

  const byCategory = {}
  inventory.forEach(item => {
    const cat = item.category || 'general'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  })

  return (
    <div className="bg-white rounded-3xl w-[95%] max-w-2xl animate-slideIn shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
      <div id="printArea" className="bg-white text-black p-6 md:p-8 pb-2 w-full">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h2 className="text-2xl font-extrabold uppercase tracking-widest">Reporte de Inventario</h2>
          <p className="text-sm font-bold mt-1 text-gray-600">Generado el: {new Date().toLocaleString('es-MX')} por {currentUser?.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 text-center">
            <p className="text-xs font-bold text-gray-600 uppercase">Capital en Insumos</p>
            <p className="text-xl font-extrabold text-black mt-1">${totalValue.toLocaleString()}</p>
          </div>
          <div className={`p-4 ${lowStock.length > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} rounded-lg border text-center`}>
            <p className="text-xs font-bold uppercase">Alertas de Stock</p>
            <p className="text-xl font-extrabold mt-1">{lowStock.length} insumos bajos</p>
          </div>
        </div>
        {Object.keys(byCategory).sort().map(cat => (
          <div key={cat} className="mb-4">
            <h4 className="text-sm font-extrabold text-gray-800 bg-gray-100 px-3 py-1.5 border-l-4 border-gray-500 uppercase tracking-wider mb-2">
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </h4>
            <table className="w-full text-sm text-left border-collapse mb-2">
              <thead>
                <tr className="border-b-2 border-gray-300 text-gray-600">
                  <th className="py-1.5 px-2 font-bold">Insumo</th>
                  <th className="py-1.5 px-2 font-bold text-right">Stock</th>
                  <th className="py-1.5 px-2 font-bold text-right hidden sm:table-cell">Valuación</th>
                </tr>
              </thead>
              <tbody>
                {byCategory[cat].map(item => (
                  <tr key={item.id} className={`border-b border-gray-200 ${item.stock <= item.minStock ? 'bg-red-50 text-red-800' : ''}`}>
                    <td className="py-1.5 px-2 font-medium">{item.name} {item.stock <= item.minStock ? '⚠️' : ''}</td>
                    <td className="py-1.5 px-2 text-right font-bold">{item.stock.toFixed(2)} <span className="text-[10px] font-normal text-gray-500 uppercase">{item.unit}</span></td>
                    <td className="py-1.5 px-2 text-right hidden sm:table-cell text-gray-600">${(item.stock * item.cost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <div className="px-6 md:px-8 pb-6 pt-4 bg-white rounded-b-3xl">
        <div className="flex gap-3 border-t border-gray-200 pt-6">
          <button onClick={closeModal} className="flex-1 py-3 bg-gray-200 text-black font-bold rounded-xl hover:bg-gray-300 transition">Cerrar</button>
          <button onClick={() => window.print()} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition">🖨️ Imprimir</button>
        </div>
      </div>
    </div>
  )
}
