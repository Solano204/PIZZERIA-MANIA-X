import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useCartStore from '../../store/useCartStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import { canAddToCart } from '../../lib/helpers'
import ProductCard from './ProductCard'
import Cart from './Cart'
import SizeModal from './SizeModal'
import HalfAndHalfModal from './HalfAndHalfModal'
import PaymentModal from './PaymentModal'
import ReceiptModal from './ReceiptModal'

export default function POS() {
  const { state, currentUser, processPayment } = useAppStore()
  const { cart, addCustomItem, clearCart } = useCartStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()
  const [category, setCategory] = useState('all')

  const categories = [{ id: 'all', name: 'Todo', icon: '🍽️' }, ...(state.productCategories || [])]
  const filtered = category === 'all'
    ? (state.products || []).filter(p => p.active && !p.isVirtual)
    : (state.products || []).filter(p => p.active && !p.isVirtual && p.category === category)

  const handleProductClick = (product) => {
    const check = canAddToCart(product.id, 1, cart, state.products, state.inventory)
    if (!check.ok) return showToast(check.message, 'error')
    if (product.sizes?.length > 0) {
      openModal(<SizeModal product={product} onAdd={(item) => { addCustomItem(item); showToast(`${item.name} agregado`, 'success') }} />)
    } else {
      addCustomItem({ productId: product.id, name: product.name, price: product.price, quantity: 1 })
    }
  }

  const showHalfAndHalf = () => {
    let productsList = []
    if (category === 'all') {
      const allowed = (state.productCategories || []).filter(c => c.allowHalfAndHalf).map(c => c.id)
      productsList = (state.products || []).filter(p => allowed.includes(p.category) && p.active && !p.isVirtual)
    } else {
      productsList = (state.products || []).filter(p => p.category === category && p.active && !p.isVirtual)
    }
    if (productsList.length < 2) return showToast('Necesitas al menos 2 productos para combinar', 'warning')
    openModal(<HalfAndHalfModal products={productsList} onAdd={(item) => { addCustomItem(item); showToast('Pizza mitad y mitad agregada', 'success') }} />)
  }

  const handlePay = (method) => {
    if (!state.cashRegister?.isOpen && currentUser.role !== 'admin') return showToast('La caja no está abierta', 'error')
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    const dummyOrder = { id: 'new_counter', total, paidAmount: 0, items: [...cart] }
    openModal(
      <PaymentModal order={dummyOrder} method={method}
        onConfirm={({ method: m, amountToPay, received, change }) => {
          const result = processPayment({ order: dummyOrder, method: m, amountToPay, received, change, currentUser })
          if (result?.sale) { clearCart(); openModal(<ReceiptModal sale={result.sale} />) }
          else if (result?.order) showToast(`Abono guardado. Restan: $${(result.order.total - result.order.paidAmount).toLocaleString()}`, 'info')
        }}
      />
    )
  }

  const showHalfBtn = (() => {
    if (category === 'all') return (state.productCategories || []).some(c => c.allowHalfAndHalf)
    const cat = (state.productCategories || []).find(c => c.id === category)
    return cat?.allowHalfAndHalf === true
  })()

  return (
    <div className="animate-slideIn h-full flex flex-col lg:flex-row gap-4 w-full">
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 shrink-0 w-full">
          <h2 className="text-lg md:text-xl font-black flex items-center gap-2 text-theme-greenDark shrink-0">🛒 Punto de Venta</h2>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 w-full flex-1 min-w-0 pr-2">
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`px-3 py-2 rounded-xl text-xs md:text-sm transition font-bold border border-white whitespace-nowrap shrink-0
                  ${c.id === category ? 'bg-theme-green text-white shadow-md' : 'bg-white/60 hover:bg-white/90 text-theme-textMuted'}`}>
                {c.icon} {c.name}
              </button>
            ))}
            {showHalfBtn && (
              <div className="flex items-center shrink-0">
                <div className="w-px h-6 bg-theme-beige mx-1" />
                <button onClick={showHalfAndHalf}
                  className="px-3 py-2 rounded-xl text-xs md:text-sm transition font-bold border-2 border-[#F3A70D] text-[#F3A70D] hover:bg-[#F3A70D] hover:text-white whitespace-nowrap shrink-0 shadow-sm">
                  🌗 Mitad y Mitad
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-y-auto scrollbar-thin pb-4 pr-2 content-start flex-1 w-full min-h-0">
          {filtered.length === 0
            ? <p className="col-span-full text-center text-theme-textMuted py-8 text-sm font-medium bg-white/40 rounded-xl border border-dashed border-theme-beige">No hay productos en esta categoría</p>
            : filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p)} />)
          }
        </div>
      </div>
      <Cart onPay={handlePay} showDiscountBtn={currentUser?.canDiscount || currentUser?.role === 'admin'} />
    </div>
  )
}
