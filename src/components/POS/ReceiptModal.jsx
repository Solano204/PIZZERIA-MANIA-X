import { useState } from 'react'
import useModalStore from '../../store/useModalStore'
import useAppStore from '../../store/useAppStore'
import { buildWhatsappTicketMessage } from '../../lib/helpers'

export default function ReceiptModal({ sale, onPrintKitchen }) {
  const { closeModal, openModal } = useModalStore()
  const { state } = useAppStore()

  let changeHtml = null
  if (sale.paymentsBreakdown?.length > 0) {
    const last = sale.paymentsBreakdown[sale.paymentsBreakdown.length - 1]
    if (last?.method === 'cash' && last.change > 0) {
      changeHtml = (
        <div className="flex justify-between font-black border-t-2 border-black mt-1 pt-1 text-black text-[12px]">
          <span>SU CAMBIO:</span><span>${last.change.toLocaleString()}</span>
        </div>
      )
    }
  }

  return (
    <div className="glass bg-black/60 p-4 md:p-8 w-full h-full md:h-auto md:max-w-md animate-slideIn flex flex-col items-center justify-center md:rounded-3xl overflow-y-auto scrollbar-thin relative">
      <div className="bg-white text-black font-bold p-5 w-full max-w-[300px] font-mono shadow-2xl relative mx-auto" id="printArea">
        <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4 flex flex-col items-center">
          <img src="https://chicfkbdfqdrrevtrrby.supabase.co/storage/v1/object/public/PIZZERIA_ADMIN/pizza.jpeg" alt="Logo" className="h-20 w-auto mb-2" style={{ display: 'block', margin: '0 auto' }} />
          <p className="text-[10px] uppercase font-bold">Ticket de Venta</p>
          <p className="text-[10px] uppercase font-bold">Roberto Morales Muciño</p>
          <p className="text-[10px] uppercase font-bold">MOMR7707196C1</p>
          <p className="text-[10px] uppercase font-bold">11a. Calle Pte. No 62. C.P 30068</p>
          <p className="text-[10px] uppercase font-bold">Comitán de Domínguez, Chis.</p>
          <p className="text-[10px] mt-1 font-bold">{new Date(sale.timestamp).toLocaleString('es-MX')}</p>
          <p className="text-[12px] mt-1 font-black">TICKET #{sale.orderId?.toString().slice(-4)}</p>
        </div>
        <div className="space-y-2 mb-4 text-[11px] leading-tight">
          <div className="flex justify-between font-black border-b-2 border-black pb-1 mb-2">
            <span>CANT DESCRIPCIÓN</span><span>IMPORTE</span>
          </div>
          {sale.items.map((item, i) => (
            <div key={i} className="flex justify-between items-start mb-1 font-bold text-black">
              <span className="flex-1 pr-2">
                <span className="font-black">{item.quantity}x</span> {item.name.toUpperCase()}
                {item.note && <><br /><span style={{ fontSize: 10, fontWeight: 900 }}>* {item.note.toUpperCase()}</span></>}
              </span>
              <span className="font-black whitespace-nowrap">${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-dashed border-black pt-3 space-y-1 text-[11px] font-bold text-black">
          {sale.discount > 0 && (
            <>
              <div className="flex justify-between mb-1"><span>SUBTOTAL:</span><span>${(sale.total + sale.discount).toLocaleString()}</span></div>
              <div className="flex justify-between mb-1"><span>DESCUENTO:</span><span>-${sale.discount.toLocaleString()}</span></div>
            </>
          )}
          <div className="flex justify-between font-black text-sm mb-2 mt-2">
            <span>TOTAL A PAGAR:</span><span>${sale.total.toLocaleString()}</span>
          </div>
          <div className="border-t-2 border-black pt-2 mt-2">
            <p className="text-[10px] font-black mb-1 uppercase">Detalle de pago:</p>
            {(sale.paymentsBreakdown || []).map((p, i) => (
              <div key={i} className="flex justify-between font-bold text-black">
                <span>{p.method === 'cash' ? 'PAGÓ CON (Efectivo):' : 'TRANSFERENCIA:'}</span>
                <span className="font-black">${(p.method === 'cash' ? (p.received || p.amount) : p.amount).toLocaleString()}</span>
              </div>
            ))}
            {changeHtml}
          </div>
        </div>
        <div className="text-center mt-5 pt-3 border-t-2 border-dashed border-black text-[10px] font-bold text-black">
          <p className="font-black">¡GRACIAS POR SU PREFERENCIA!</p>
          <p className="font-black">¡ESTE COMPROBANTE SERÁ INCLUIDO EN LA FACTURA CDFI GLOBAL!</p>
          <p className="mt-1">Vuelva pronto</p>
          <p className="mt-1 font-black">Tel. 963-632-0837</p>
        </div>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-2 mt-4 print:hidden shrink-0 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition">🖨️ Ticket Venta</button>
          <button onClick={() => openModal(<WhatsappModal sale={sale} />)} className="bg-green-500 hover:bg-green-600 text-white py-3 text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition">💬 WhatsApp</button>
        </div>
        {state.settings?.systemMode !== 'counter' && onPrintKitchen && (
          <button onClick={onPrintKitchen} className="w-full bg-[#F3A70D] hover:bg-orange-500 text-white py-3 text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition">👨‍🍳 Imprimir Comanda de Cocina</button>
        )}
        <button onClick={closeModal} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition shadow-sm border border-gray-300">Cerrar Ventana</button>
      </div>
    </div>
  )
}

function WhatsappModal({ sale }) {
  const { openModal } = useModalStore()
  const [phone, setPhone] = useState('')

  const send = () => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 10) return
    const msg = buildWhatsappTicketMessage(sale)
    window.open(`https://wa.me/52${clean}?text=${encodeURIComponent(msg)}`, '_blank')
    openModal(<ReceiptModal sale={sale} />)
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-sm animate-slideIn shadow-2xl border-2 border-green-500 text-center">
      <h3 className="text-xl font-extrabold mb-2 text-green-600 flex items-center justify-center gap-2">💬 WhatsApp</h3>
      <p className="text-sm text-theme-text font-medium mb-4">Ingresa el número del cliente a 10 dígitos:</p>
      <div className="flex items-center bg-white border-2 border-theme-beige rounded-xl overflow-hidden mb-4 focus-within:border-green-500 transition-colors shadow-inner">
        <span className="bg-gray-100 px-3 py-3 font-bold text-gray-600 border-r border-theme-beige">+52</span>
        <input type="tel" value={phone} autoFocus onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          className="w-full px-3 py-3 focus:outline-none font-extrabold text-xl text-theme-text tracking-widest text-center" placeholder="963 123 4567" maxLength={10} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => openModal(<ReceiptModal sale={sale} />)} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
        <button onClick={send} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition flex justify-center items-center gap-2">Enviar 🚀</button>
      </div>
    </div>
  )
}
