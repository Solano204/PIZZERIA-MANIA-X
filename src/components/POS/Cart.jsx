import useCartStore from '../../store/useCartStore'
import useModalStore from '../../store/useModalStore'
import useAppStore from '../../store/useAppStore'
import NoteModal from './NoteModal'

export default function Cart({ onPay, showDiscountBtn }) {
  const { cart, updateQtyByIndex, clearCart } = useCartStore()
  const { openModal } = useModalStore()
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const hasItems = cart.length > 0

  return (
    <div className="w-full lg:w-[280px] xl:w-[340px] flex flex-col shrink-0 lg:h-full h-auto glass bg-white/60 rounded-2xl p-4 border border-theme-beige shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black flex items-center gap-2 text-theme-greenDark text-base">🧾 Cuenta</h3>
        <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-600 bg-white/80 px-2.5 py-1 rounded-lg transition shadow-sm border border-red-100 hover:border-red-200">Limpiar</button>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin space-y-2 mb-4 pr-1 min-h-[150px] lg:min-h-0">
        {cart.length === 0
          ? <p className="text-theme-textMuted text-center py-8">El carrito está vacío</p>
          : cart.map((item, index) => (
            <CartItem key={`${item.productId}-${index}`} item={item} index={index}
              onQty={(delta) => updateQtyByIndex(index, delta)}
              onNote={() => openModal(<NoteModal index={index} item={item} />)} />
          ))
        }
      </div>
      <div className="border-t border-theme-beige pt-3 space-y-3 shrink-0">
        {showDiscountBtn && (
          <button className="w-full py-2.5 mb-1 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200 transition shadow-sm flex items-center justify-center gap-1">
            🏷️ Aplicar Descuento
          </button>
        )}
        <div className="flex justify-between text-sm md:text-base font-bold text-theme-textMuted">
          <span>Subtotal:</span><span>${total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xl md:text-2xl font-black text-theme-greenDark">
          <span>Total:</span><span>${total.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => hasItems && onPay('cash')} disabled={!hasItems}
            className="btn-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            💵 Efectivo
          </button>
          <button onClick={() => hasItems && onPay('transfer')} disabled={!hasItems}
            className="bg-blue-400 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            📱 Transf.
          </button>
        </div>
      </div>
    </div>
  )
}

function CartItem({ item, index, onQty, onNote }) {
  return (
    <div className="flex flex-col p-3 rounded-xl bg-white shadow-sm border border-theme-beige gap-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-2">
          <p className="font-bold text-sm text-theme-text line-clamp-1">{item.name}</p>
          <p className="text-theme-greenDark font-bold text-sm">${item.price} c/u</p>
        </div>
        <div className="flex items-center gap-2 bg-theme-bg p-1 rounded-lg border border-theme-beige">
          <button onClick={() => onQty(-1)} className="w-7 h-7 rounded-md bg-white hover:bg-theme-beige transition text-theme-text font-bold">-</button>
          <span className="w-6 text-center font-bold">{item.quantity}</span>
          <button onClick={() => onQty(1)} className="w-7 h-7 rounded-md bg-white hover:bg-theme-beige transition text-theme-text font-bold">+</button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button onClick={onNote} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded hover:bg-yellow-100 transition shadow-sm whitespace-nowrap">✏️ Nota</button>
        {item.note && <p className="text-xs text-red-600 font-medium italic line-clamp-1 flex-1">"{item.note}"</p>}
      </div>
    </div>
  )
}
