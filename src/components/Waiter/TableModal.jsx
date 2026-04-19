import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useCartStore from '../../store/useCartStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import { hasEnoughStock, canAddToCart, getStatusClass, getStatusLabel } from '../../lib/helpers'
import SizeModal from '../POS/SizeModal'
import KitchenTicketModal from '../shared/KitchenTicketModal'

export default function TableModal({ tableId }) {
  const { state, currentUser, sendTableOrder, freeTable } = useAppStore()
  const { cart, addCustomItem, updateQtyByIndex, clearCart } = useCartStore()
  const { closeModal, openModal } = useModalStore()
  const { showToast } = useToastStore()
  const [category, setCategory] = useState('all')
  const [cartOpen, setCartOpen] = useState(false)

  const table = (state.tables || []).find(t => t.id === tableId)
  const activeOrder = (state.orders || []).find(
    o => o.tableId === tableId && o.paymentStatus !== 'paid' && o.status !== 'cancelled'
  )

  const categories = [{ id: 'all', name: 'Todo', icon: '🍽️' }, ...(state.productCategories || [])]
  const filtered = category === 'all'
    ? (state.products || []).filter(p => p.active && !p.isVirtual)
    : (state.products || []).filter(p => p.active && !p.isVirtual && p.category === category)

  const handleProductClick = (product) => {
    const check = canAddToCart(product.id, 1, cart, state.products, state.inventory)
    if (!check.ok) return showToast(check.message, 'error')
    if (product.sizes?.length > 0) {
      openModal(<SizeModal product={product} onAdd={(item) => { addCustomItem(item); openModal(<TableModal tableId={tableId} />) }} />)
    } else {
      addCustomItem({ productId: product.id, name: product.name, price: product.price, quantity: 1 })
    }
  }

  const handleSend = () => {
    if (cart.length === 0) return showToast('Agrega al menos un producto', 'warning')
    sendTableOrder(tableId, cart, currentUser)
    clearCart()
    setCartOpen(false)
    showToast('✅ Orden enviada a cocina', 'success')
    closeModal()
  }

  const handleFreeTable = () => {
    const ok = freeTable(tableId)
    if (!ok) return showToast('⚠️ Hay una cuenta sin pagar', 'error')
    showToast(`${table?.name} desocupada`, 'success')
    closeModal()
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

  const showHalfBtn = (() => {
    if (category === 'all') return (state.productCategories || []).some(c => c.allowHalfAndHalf)
    return (state.productCategories || []).find(c => c.id === category)?.allowHalfAndHalf === true
  })()

  return (
    <div className="glass bg-white/90 rounded-3xl p-3 md:p-6 w-[98%] max-w-6xl animate-slideIn h-[95vh] md:h-[90vh] flex flex-col shadow-2xl border-2 border-white overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-theme-beige pb-2 shrink-0 px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold flex items-center gap-2 text-theme-greenDark">🍽️ {table?.name}</h3>
          {table?.status !== 'free' && (
            <button onClick={handleFreeTable} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition shadow-sm">🧹 Desocupar</button>
          )}
        </div>
        <button onClick={() => { clearCart(); closeModal() }} className="p-2 bg-white rounded-lg transition text-theme-textMuted hover:bg-theme-beige border border-theme-beige font-bold shadow-sm">✕</button>
      </div>

      {/* Active Order Summary */}
      {activeOrder && (
        <ActiveOrderSummary order={activeOrder} onPrintKitchen={() => openModal(<KitchenTicketModal order={activeOrder} onBack={() => openModal(<TableModal tableId={tableId} />)} />)} />
      )}

      {/* Main Content */}
      <div className="flex gap-4 flex-col lg:flex-row flex-1 min-h-0 min-w-0 pb-1 w-full overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white/50 rounded-2xl p-2 md:p-4 border border-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 shrink-0">
            <h4 className="font-bold text-theme-text text-sm md:text-base">Menú</h4>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 w-full sm:w-auto">
              {categories.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] transition font-bold border border-white whitespace-nowrap shrink-0
                    ${c.id === category ? 'bg-theme-green text-white shadow-md' : 'bg-white/60 hover:bg-white/90 text-theme-textMuted'}`}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin pr-1 pb-2 content-start w-full">
            {filtered.map(p => {
              const avail = hasEnoughStock(p, state.inventory || [])
              const catObj = (state.productCategories || []).find(c => c.id === p.category)
              return (
                <div
                  key={p.id}
                  onClick={avail ? () => handleProductClick(p) : undefined}
                  className={`p-2 md:p-3 rounded-xl ${avail ? 'bg-white border-theme-beige hover:border-theme-green cursor-pointer' : 'bg-red-50 border-red-300 opacity-70 cursor-not-allowed'} border-2 shadow-sm transition text-center flex flex-col items-center justify-between gap-1 relative overflow-hidden min-h-[120px]`}
                >
                  {!avail && <div className="absolute top-0 w-full bg-red-500 text-white text-[9px] font-extrabold py-0.5">AGOTADO</div>}
                  {p.image
                    ? <img src={p.image} className="w-12 h-12 object-cover rounded-xl shadow-sm" alt={p.name} />
                    : <span className="text-3xl drop-shadow-sm">{p.icon || catObj?.icon || '🍽️'}</span>
                  }
                  <div className="w-full">
                    <p className="text-[11px] md:text-xs font-bold text-theme-text leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-[#F3A70D] font-extrabold text-sm mt-0.5">
                      {p.sizes?.length > 0 ? `Desde $${Math.min(...p.sizes.map(s => s.price))}` : `$${p.price}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cart Panel */}
        <div className={`fixed lg:static inset-x-0 bottom-0 h-[80vh] lg:h-full w-full lg:w-[320px] bg-white lg:bg-white/80 rounded-t-3xl lg:rounded-2xl p-5 lg:p-4 border border-theme-beige shadow-[0_-20px_50px_rgba(0,0,0,0.25)] lg:shadow-sm flex flex-col shrink-0 transition-transform duration-300 ${cartOpen ? 'translate-y-0' : 'translate-y-full'} lg:translate-y-0 z-50 lg:z-auto`}>
          <div className="flex justify-between items-center mb-4 lg:mb-3 shrink-0">
            <h4 className="font-extrabold text-theme-text text-lg lg:text-base">📝 Nueva Comanda</h4>
            <button onClick={() => setCartOpen(false)} className="lg:hidden p-2 bg-theme-bg text-theme-textMuted rounded-full font-bold text-xs border border-theme-beige">⬇️ Ocultar</button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin pr-2 mb-3 min-h-0">
            {cart.length === 0
              ? <div className="h-full flex items-center justify-center"><p className="text-theme-textMuted text-sm font-medium">Sin productos seleccionados</p></div>
              : cart.map((item, i) => (
                <div key={`${item.productId}-${i}`} className="flex flex-col text-sm font-medium border-b border-theme-bg pb-3 last:border-0 gap-1.5">
                  <div className="flex justify-between">
                    <span className="line-clamp-2 flex-1 pr-2 leading-tight"><strong className="text-theme-greenDark">{item.quantity}x</strong> {item.name}</span>
                    <span className="font-bold shrink-0">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-md font-bold">✏️ {item.note ? 'Con nota' : 'Sin nota'}</span>
                    <div className="flex gap-1 bg-theme-bg rounded-lg border border-theme-beige p-1">
                      <button onClick={() => updateQtyByIndex(i, -1)} className="w-6 h-5 rounded hover:bg-white font-extrabold text-theme-text flex items-center justify-center">-</button>
                      <button onClick={() => updateQtyByIndex(i, 1)} className="w-6 h-5 rounded hover:bg-white font-extrabold text-theme-text flex items-center justify-center">+</button>
                    </div>
                  </div>
                  {item.note && <span className="text-[11px] text-red-500 italic mt-1 leading-tight bg-red-50 p-1.5 rounded-md border border-red-100">"{item.note}"</span>}
                </div>
              ))
            }
          </div>

          <div className="border-t border-theme-beige pt-4 shrink-0">
            <div className="flex justify-between font-black text-xl text-theme-greenDark mb-4">
              <span>Total:</span><span>${total.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <button onClick={handleSend} disabled={cart.length === 0} className="w-full btn-primary py-3.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50">
                📤 Enviar a Cocina
              </button>
              {cart.length > 0 && (
                <button onClick={() => { clearCart(); setCartOpen(false) }} className="w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs transition font-bold shadow-sm">
                  🗑️ Vaciar Comanda
                </button>
              )}
              {activeOrder && (
                <button onClick={() => openModal(<KitchenTicketModal order={activeOrder} onBack={() => openModal(<TableModal tableId={tableId} />)} />)}
                  className="w-full bg-[#F3A70D] hover:bg-orange-500 text-white py-3.5 rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 mt-2">
                  👨‍🍳 Imprimir Comanda de Cocina
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile cart toggle */}
      <div className="lg:hidden shrink-0 pt-2 border-t border-theme-beige mt-1 px-1">
        <button onClick={() => setCartOpen(v => !v)} className="w-full btn-primary py-3.5 rounded-xl font-bold shadow-lg flex justify-between items-center px-5 border border-white">
          <span className="flex items-center gap-2 text-base">🛒 <span className="bg-white/20 px-2 py-0.5 rounded-md">{itemCount} items</span></span>
          <span className="bg-white text-theme-greenDark px-3 py-1 rounded-lg text-sm font-black shadow-sm flex items-center gap-1">Ver Comanda ⬆️</span>
        </button>
      </div>
    </div>
  )
}

function ActiveOrderSummary({ order, onPrintKitchen }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-3 p-3 rounded-xl bg-theme-bg border border-theme-beige shadow-inner shrink-0">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <h4 className="font-bold text-theme-text flex items-center gap-2 text-sm md:text-base">
          🛒 Pedido Actual #{order.id.toString().slice(-4)}
          <span className="text-[10px] text-blue-500 bg-blue-100 px-2 py-0.5 rounded">(Toca para expandir)</span>
        </h4>
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold shadow-sm ${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-theme-beige">
          <div className="space-y-2 mb-2 max-h-24 overflow-y-auto scrollbar-thin pr-2">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex flex-col text-sm font-medium border-b border-white pb-1">
                <div className="flex justify-between">
                  <span><strong className="text-theme-greenDark">{item.quantity}x</strong> {item.name}</span>
                  <span className="font-bold">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
                {item.note && <span className="text-xs text-red-500 italic mt-0.5">Nota: {item.note}</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-between font-extrabold border-t border-theme-beige pt-2 text-theme-greenDark text-sm">
            <span>Total consumido:</span><span>${order.total.toLocaleString()}</span>
          </div>
          <button onClick={onPrintKitchen} className="mt-3 w-full py-2 bg-gray-200 hover:bg-gray-300 text-black font-bold rounded-lg shadow-sm border border-gray-400 flex justify-center items-center gap-2 transition">
            🖨️ Imprimir Pre-Cuenta
          </button>
        </div>
      )}
    </div>
  )
}
