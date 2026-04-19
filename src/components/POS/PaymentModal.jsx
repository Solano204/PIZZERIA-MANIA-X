import { useState } from 'react'
import useModalStore from '../../store/useModalStore'

export default function PaymentModal({ order, method, onConfirm }) {
  const { closeModal } = useModalStore()
  const paidAmount = order.paidAmount || 0
  const remaining = order.total - paidAmount
  const [amountToPay, setAmountToPay] = useState(remaining)
  const [cashReceived, setCashReceived] = useState('')

  const change = method === 'cash' ? (parseFloat(cashReceived) || 0) - amountToPay : 0
  const canConfirm = method === 'cash'
    ? parseFloat(cashReceived) >= amountToPay && amountToPay > 0
    : amountToPay > 0

  const displayId = order.id === 'new_counter' ? 'NUEVA' : order.id?.toString().slice(-4)
  const methodLabel = method === 'cash' ? 'Efectivo 💵' : 'Transferencia 📱'

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({ method, amountToPay: parseFloat(amountToPay), received: method === 'cash' ? parseFloat(cashReceived) : parseFloat(amountToPay), change: Math.max(0, change) })
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-5 md:p-6 w-[95%] max-w-md animate-slideIn border-2 border-white shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-theme-greenDark">💳 Cobrar Pedido #{displayId}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-theme-bg border border-theme-beige shadow-inner">
            <p className="text-[10px] text-theme-textMuted font-bold uppercase tracking-wider">Total Cuenta</p>
            <p className="text-xl font-extrabold text-theme-text mt-1">${order.total.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 shadow-inner">
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Ya pagó</p>
            <p className="text-xl font-extrabold text-blue-600 mt-1">${paidAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-center p-5 rounded-2xl bg-white border-2 border-theme-green shadow-sm">
          <p className="text-sm text-theme-text font-bold mb-1">Restante por pagar:</p>
          <p className="text-4xl font-extrabold text-theme-greenDark">${remaining.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-theme-bg rounded-xl border border-theme-beige mt-2">
          <p className="text-sm font-bold mb-3 text-theme-text text-center border-b border-theme-beige pb-2">
            Método: <span className="text-theme-greenDark">{methodLabel}</span>
          </p>
          <label className="block text-xs font-bold mb-1 text-theme-text">¿Cuánto va a pagar?</label>
          <input type="number" value={amountToPay} max={remaining} onChange={e => setAmountToPay(Math.min(remaining, parseFloat(e.target.value) || 0))}
            className="w-full px-4 py-3 mb-3 bg-white border-2 border-theme-beige rounded-xl text-2xl text-center focus:outline-none focus:border-theme-green font-extrabold text-theme-text shadow-inner" />
          {method === 'cash' && (
            <>
              <label className="block text-xs font-bold mb-1 text-theme-text mt-2">¿Con cuánto efectivo paga?</label>
              <input type="number" value={cashReceived} autoFocus onChange={e => setCashReceived(e.target.value)} placeholder="0"
                className="w-full px-4 py-3 bg-white border-2 border-green-200 rounded-xl text-xl text-center focus:outline-none focus:border-green-500 font-bold text-green-700 shadow-inner" />
            </>
          )}
        </div>
        {method === 'cash' && change > 0 && (
          <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200 shadow-sm">
            <p className="text-sm text-green-700 font-bold">Cambio a entregar</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">${change.toLocaleString()}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={closeModal} className="py-3.5 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
          <button onClick={handleConfirm} disabled={!canConfirm} className="btn-primary py-3.5 rounded-xl font-bold shadow-md disabled:opacity-50">Pagar</button>
        </div>
      </div>
    </div>
  )
}
