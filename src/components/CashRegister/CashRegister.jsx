import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import { getTodayLocalStr, getLocalYYYYMMDD } from '../../lib/helpers'

export default function CashRegister() {
  const { state, currentUser, saveToStorage } = useAppStore()
  const { openModal } = useModalStore()
  const today = getTodayLocalStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today
  const cr = state.cashRegister || {}

  const movements = (cr.movements || []).filter(m => {
    if (!m.timestamp) return false
    return getLocalYYYYMMDD(m.timestamp) === selectedDate
  })

  const cashSales = movements.filter(m => m.type === 'sale' && m.paymentMethod === 'cash').reduce((s, m) => s + m.amount, 0)
  const transferSales = movements.filter(m => m.type === 'sale' && m.paymentMethod === 'transfer').reduce((s, m) => s + m.amount, 0)
  const totalExpenses = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)
  const openMovement = movements.find(m => m.type === 'open')
  const dayInitial = openMovement ? openMovement.amount : (isToday ? cr.initialAmount || 0 : 0)
  const physicalCash = dayInitial + cashSales - totalExpenses

  return (
    <div className="animate-slideIn h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 shrink-0 border-b border-theme-beige pb-4 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">💵 Caja Registradora</h2>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-theme-beige shadow-sm">
          <span className="text-xl">📅</span>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent font-black text-theme-text focus:outline-none cursor-pointer" />
          {!isToday && (
            <button onClick={() => setSelectedDate(today)} className="ml-2 text-xs bg-theme-bg px-3 py-1.5 rounded-lg text-theme-text font-bold hover:bg-theme-beige transition border border-theme-beige shadow-sm">
              Ir a Hoy
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto scrollbar-thin pb-4">
        <div className="glass bg-white/60 rounded-2xl p-6 border border-white shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-beige">
            <h3 className="font-extrabold text-lg text-theme-text">{isToday ? 'Estado de Caja' : 'Resumen del Día'}</h3>
            {isToday && (
              <span className={`px-4 py-2 rounded-full ${cr.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} font-bold shadow-sm`}>
                {cr.isOpen ? '🟢 Abierta' : '🔴 Cerrada'}
              </span>
            )}
          </div>

          {isToday && !cr.isOpen ? (
            <div className="text-center py-12">
              <p className="text-theme-textMuted mb-6 font-medium text-lg">La caja se encuentra cerrada</p>
              <button onClick={() => openModal(<OpenCashModal />)} className="btn-primary font-bold px-8 py-4 rounded-xl shadow-lg text-lg">
                🔓 Abrir Caja Ahora
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {isToday && (
                  <div className="flex justify-between p-3 rounded-xl bg-white border border-theme-beige shadow-sm">
                    <span className="font-bold text-theme-textMuted">Abierta por:</span>
                    <span className="font-extrabold text-theme-text">{(state.users || []).find(u => u.id === cr.openedBy)?.name || 'Sistema'}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 rounded-xl bg-theme-bg border border-theme-beige shadow-inner">
                  <span className="font-bold text-theme-textMuted">Fondo inicial:</span>
                  <span className="font-extrabold text-theme-text">${dayInitial.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                  <span className="font-bold text-green-700">Ingresos efectivo:</span>
                  <span className="font-extrabold text-green-600">+${cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="font-bold text-blue-700">Ingresos Transferencia:</span>
                  <span className="font-extrabold text-blue-600">+${transferSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-red-50 border border-red-200">
                  <span className="font-bold text-red-700">Gastos / Retiros:</span>
                  <span className="font-extrabold text-red-600">-${totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-5 rounded-2xl bg-white border-2 border-theme-green shadow-sm mt-4">
                  <span className="font-extrabold text-lg text-theme-text">Dinero Físico en Caja:</span>
                  <span className="font-extrabold text-2xl text-theme-greenDark">${physicalCash.toLocaleString()}</span>
                </div>
              </div>
              {isToday && cr.isOpen && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => openModal(<ExpenseModal />)} className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold py-4 rounded-xl shadow-sm transition flex justify-center items-center gap-2">
                    ➖ Registrar Gasto
                  </button>
                  <button onClick={() => openModal(<CloseCashModal expected={physicalCash} ownerPhone={state.settings?.ownerWhatsApp} branchId={useAppStore.getState().currentBranch} cashierName={currentUser?.name} />)} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-md transition flex justify-center items-center gap-2">
                    🔒 Corte de Caja
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="glass bg-white/60 rounded-2xl p-6 border border-white shadow-sm flex flex-col min-h-[400px]">
          <h3 className="font-extrabold text-lg mb-4 text-theme-text border-b border-theme-beige pb-4 shrink-0">Movimientos de la Fecha</h3>
          <div className="space-y-3 flex-1 overflow-auto scrollbar-thin pr-2">
            {[...movements].reverse().map((m, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white border border-theme-beige shadow-sm">
                <div>
                  <p className="font-extrabold text-theme-text">
                    {m.type === 'sale' ? '💰 Venta' : m.type === 'expense' ? '💸 Gasto' : m.type === 'open' ? '🔓 Apertura' : '🔒 Cierre'}
                  </p>
                  <p className="text-xs font-bold text-theme-textMuted mt-1">
                    {new Date(m.timestamp).toLocaleTimeString('es-MX')} {m.description ? `• ${m.description}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-extrabold text-lg ${m.type === 'expense' ? 'text-red-600' : m.amount >= 0 ? 'text-green-600' : 'text-theme-text'}`}>
                    {m.type === 'expense' ? '-' : m.amount >= 0 ? '+' : ''}${Math.abs(m.amount).toLocaleString()}
                  </p>
                  {m.paymentMethod && (
                    <span className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded-md uppercase ${m.paymentMethod === 'cash' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'}`}>
                      {m.paymentMethod === 'cash' ? 'Efectivo' : 'Transf.'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {movements.length === 0 && <p className="text-theme-textMuted font-medium text-center py-12">Sin movimientos en esta fecha</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function OpenCashModal() {
  const { currentUser, saveToStorage } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const [amount, setAmount] = useState('0')

  const open = () => {
    const a = parseFloat(amount) || 0
    useAppStore.setState(s => ({
      state: {
        ...s.state,
        cashRegister: {
          isOpen: true,
          openedBy: currentUser.id,
          openedAt: new Date().toISOString(),
          initialAmount: a,
          movements: [{ type: 'open', amount: a, timestamp: new Date().toISOString(), description: 'Apertura de caja' }],
        }
      }
    }))
    saveToStorage()
    showToast('✅ Caja abierta correctamente', 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-full max-w-md animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-bold mb-4 text-theme-greenDark flex items-center gap-2">🔓 Abrir Caja</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-theme-text">Monto Inicial (Fondo de caja)</label>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)}
            autoFocus onKeyDown={e => e.key === 'Enter' && open()}
            className="w-full px-4 py-3 bg-white border-2 border-theme-beige rounded-xl text-2xl text-center focus:outline-none focus:border-theme-green font-bold text-theme-text shadow-inner"
            placeholder="0.00"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
          <button onClick={open} className="btn-primary py-3 rounded-xl font-bold shadow-md transition">Abrir Caja</button>
        </div>
      </div>
    </div>
  )
}

function ExpenseModal() {
  const { currentUser, saveToStorage } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')

  const save = () => {
    const a = parseFloat(amount)
    if (isNaN(a) || a <= 0) return showToast('Ingresa un monto válido', 'warning')
    if (!desc.trim()) return showToast('Ingresa el motivo del gasto', 'warning')
    const movement = { type: 'expense', amount: a, description: desc.trim(), timestamp: new Date().toISOString() }
    const expense = { id: Date.now(), amount: a, description: desc.trim(), timestamp: new Date().toISOString(), userId: currentUser.id, userName: currentUser.name }
    useAppStore.setState(s => ({
      state: {
        ...s.state,
        cashRegister: { ...s.state.cashRegister, movements: [...(s.state.cashRegister?.movements || []), movement] },
        expenses: [...(s.state.expenses || []), expense],
      }
    }))
    saveToStorage()
    showToast('Gasto registrado y descontado de caja', 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-red-300">
      <h3 className="text-xl font-extrabold mb-4 text-red-600 flex items-center gap-2">💸 Registrar Salida de Dinero</h3>
      <p className="text-sm text-theme-textMuted mb-4 font-medium">Este dinero se restará automáticamente del efectivo físico en caja.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1 text-theme-text">Monto Retirado ($)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} autoFocus className="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 font-extrabold text-2xl text-center text-red-600 shadow-inner" placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1 text-theme-text">Concepto / Descripción</label>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-red-400 font-medium text-sm" placeholder="Ej. Pago de garrafones de agua..." />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-theme-beige mt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
          <button onClick={save} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-md transition">Guardar Gasto</button>
        </div>
      </div>
    </div>
  )
}

function CloseCashModal({ expected, ownerPhone, branchId, cashierName }) {
  const { saveToStorage, logActivity } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const [counted, setCounted] = useState('')

  const diff = (parseFloat(counted) || 0) - expected
  const hasCounted = counted !== ''

  const close = () => {
    const c = parseFloat(counted) || 0
    const d = c - expected
    useAppStore.setState(s => ({
      state: {
        ...s.state,
        cashRegister: {
          ...s.state.cashRegister,
          isOpen: false,
          movements: [...(s.state.cashRegister?.movements || []), { type: 'close', amount: c, expected, difference: d, timestamp: new Date().toISOString() }],
        }
      }
    }))
    logActivity('CASH_CLOSE', `Caja cerrada. Esperado: $${expected}, Contado: $${c}, Diferencia: $${d}`)
    saveToStorage()
    showToast(`Caja cerrada. Diferencia: $${d}`, d === 0 ? 'success' : 'warning')
    closeModal()

    if (ownerPhone) {
      const branchName = branchId === 'sucursal_principal' ? 'Principal' : branchId.replace('sucursal_', '').toUpperCase()
      const today = new Date().toLocaleDateString('es-MX')
      const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      let msg = `*📊 CORTE DE CAJA - PizzaManía*\n`
      msg += `📍 Sucursal: *${branchName}*\n`
      msg += `👤 Cajero: *${cashierName}*\n`
      msg += `📅 Fecha: ${today} a las ${time}\n\n`
      msg += `💵 *Efectivo Esperado:* $${expected.toLocaleString()}\n`
      msg += `🤲 *Efectivo Entregado:* $${c.toLocaleString()}\n\n`
      msg += d === 0 ? `✅ *ESTADO:* Caja Cuadrada Perfecto ($0)\n` : d > 0 ? `⚠️ *ESTADO:* Sobraron $${Math.abs(d).toLocaleString()}\n` : `❌ *ESTADO:* Faltaron $${Math.abs(d).toLocaleString()}\n`
      window.open(`https://wa.me/${ownerPhone}?text=${encodeURIComponent(msg)}`, '_blank')
    }
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-full max-w-md animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-bold mb-4 text-theme-greenDark">🔒 Corte de Caja</h3>
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-theme-bg border border-theme-beige text-center">
          <p className="text-sm font-bold text-theme-textMuted">Efectivo esperado en caja</p>
          <p className="text-3xl font-extrabold text-theme-greenDark mt-1">${expected.toLocaleString()}</p>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-theme-text">Efectivo contado físico</label>
          <input type="number" value={counted} onChange={e => setCounted(e.target.value)} autoFocus className="w-full px-4 py-3 bg-white border-2 border-theme-beige rounded-xl text-2xl text-center focus:outline-none focus:border-theme-green font-bold text-theme-text" placeholder="0" />
        </div>
        {hasCounted && (
          <div className="p-4 rounded-xl bg-theme-bg border border-theme-beige text-center">
            <p className="text-sm font-bold text-theme-textMuted">Diferencia</p>
            <p className={`text-2xl font-extrabold mt-1 ${diff === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diff >= 0 ? '+' : ''}${diff.toLocaleString()}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text">Cancelar</button>
          <button onClick={close} disabled={!hasCounted} className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-md transition disabled:opacity-50">Cerrar Caja</button>
        </div>
      </div>
    </div>
  )
}
