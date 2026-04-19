import { useState } from 'react'
import useModalStore from '../../store/useModalStore'
import useAppStore from '../../store/useAppStore'
import useToastStore from '../../store/useToastStore'

export default function KitchenTicketModal({ order, onBack }) {
  const { closeModal } = useModalStore()
  const { state, saveToStorage } = useAppStore()
  const { showToast } = useToastStore()
  const [printed, setPrinted] = useState(false)

  const itemsToPrint = []
  ;(order.items || []).forEach(item => {
    const prod = (state.products || []).find(p => p.id === item.productId)
    const cat = prod?.category?.toLowerCase() || ''
    if (['drink', 'bebidas', 'bebida'].includes(cat)) return
    const unprinted = item.quantity - (item.printedQty || 0)
    if (unprinted > 0) itemsToPrint.push({ ...item, quantity: unprinted })
  })

  if (itemsToPrint.length === 0) {
    return (
      <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-sm text-center animate-slideIn shadow-2xl border-2 border-white">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold mb-4 text-theme-greenDark">No hay platillos nuevos pendientes</h3>
        <button onClick={closeModal} className="w-full py-3 bg-white border border-theme-beige rounded-xl font-bold text-theme-text">Cerrar</button>
      </div>
    )
  }

  const isAgregado = (order.items || []).some(i => (i.printedQty || 0) > 0)
  const headerTitle = isAgregado ? 'NUEVO AGREGADO' : 'COCINA'
  const tableDisplay = order.type === 'table' ? (order.tableName || `Mesa ${order.tableId}`).toUpperCase() : 'MOSTRADOR'

  const handlePrint = () => {
    window.print()
    const updatedOrders = (state.orders || []).map(o => {
      if (o.id !== order.id) return o
      return { ...o, items: o.items.map(item => ({ ...item, printedQty: item.quantity })) }
    })
    useAppStore.setState(s => ({ state: { ...s.state, orders: updatedOrders } }))
    saveToStorage()
    setPrinted(true)
    showToast('Comanda enviada a impresora', 'success')
  }

  return (
    <div className="glass bg-black/60 p-4 md:p-8 w-full h-full md:h-auto md:max-w-md animate-slideIn flex flex-col items-center justify-center md:rounded-3xl overflow-y-auto scrollbar-thin relative z-[99999]">
      <div className="bg-white text-black font-bold p-5 w-full max-w-[300px] font-mono shadow-2xl mx-auto" id="printArea">
        <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
          <h3 className="text-2xl font-black uppercase tracking-widest mb-2">{headerTitle}</h3>
          <p className="text-xl font-black uppercase border-2 border-black py-1 px-2 inline-block">{tableDisplay}</p>
          <p className="text-[12px] mt-2 font-bold">{new Date().toLocaleString('es-MX')}</p>
          <p className="text-[14px] mt-1 font-black">COMANDA #{order.id.toString().slice(-4)}</p>
        </div>
        <div className="space-y-3 mb-4 text-[12px] leading-tight w-full">
          <div className="font-black border-b-2 border-black pb-1 mb-2 text-center text-[14px]">CANT. / DESCRIPCIÓN</div>
          {itemsToPrint.map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center mb-2 font-bold text-black border-b border-gray-300 pb-3 text-center w-full">
              <span className="font-black text-xl leading-tight">{item.quantity}x {item.name.toUpperCase()}</span>
              {item.note && (
                <span style={{ fontSize: 14, fontWeight: 900, padding: '2px 6px', display: 'inline-block', border: '2px solid black', marginTop: 6, borderRadius: 4 }}>
                  ⚠️ {item.note.toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-5 pt-3 border-t-2 border-dashed border-black text-[12px] font-black">
          <p>*** FIN DE COMANDA ***</p>
        </div>
      </div>
      <div className="w-full max-w-[320px] flex flex-col gap-2 mt-4 print:hidden shrink-0 pb-4">
        <button onClick={handlePrint} className="w-full bg-[#F3A70D] hover:bg-orange-500 text-white py-3 text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition">
          🖨️ Imprimir Comanda
        </button>
        <button onClick={onBack || closeModal} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition shadow-sm border border-gray-300">
          {onBack ? '⬅️ Volver' : 'Cerrar'}
        </button>
      </div>
    </div>
  )
}
