import useModalStore from '../../store/useModalStore'
import useAppStore from '../../store/useAppStore'

export default function SizeModal({ product, onAdd }) {
  const { closeModal } = useModalStore()
  const { state } = useAppStore()

  const productCat = product.category ? product.category.toLowerCase().trim() : 'general'
  const modifiers = (state.modifiers || []).filter(m =>
    !m.categories || m.categories.length === 0 || m.categories.includes(productCat)
  )

  const handleAdd = (size) => {
    const checkboxes = document.querySelectorAll('.mod-checkbox:checked')
    let modsPrice = 0
    const modsNames = []
    checkboxes.forEach(cb => {
      modsPrice += parseFloat(cb.getAttribute('data-price')) || 0
      modsNames.push(cb.getAttribute('data-name'))
    })
    const extraText = modsNames.length > 0 ? ` c/${modsNames.join(', ')}` : ''
    const fullName = `${product.name} (${size.name})${extraText}`
    const finalPrice = size.price + modsPrice
    onAdd({ productId: product.id, name: fullName, price: finalPrice, quantity: 1 })
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-sm animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-black mb-1 text-theme-text flex items-center gap-2">🍕 Opciones del Producto</h3>
      <p className="text-sm font-medium text-theme-textMuted mb-4">Producto: <strong className="text-theme-greenDark">{product.name}</strong></p>

      {modifiers.length > 0 && (
        <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-inner max-h-32 overflow-y-auto scrollbar-thin">
          <p className="text-xs font-bold text-theme-textMuted mb-2 uppercase tracking-wider">Extras y Modificaciones</p>
          <div className="space-y-1">
            {modifiers.map(m => (
              <label key={m.id} className="flex items-center justify-between cursor-pointer group p-1.5 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <input type="checkbox" value={m.id} data-name={m.name} data-price={m.price} className="mod-checkbox w-5 h-5 text-theme-green rounded border-gray-300 cursor-pointer" />
                  <span className="text-sm font-bold text-gray-700">{m.name}</span>
                </div>
                <span className="text-xs font-extrabold text-theme-greenDark">+${m.price}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1 border-t border-theme-beige pt-3">
        <p className="text-xs font-bold text-theme-textMuted mb-2 uppercase tracking-wider">Selecciona el Tamaño:</p>
        {product.sizes.map((size, i) => (
          <button key={i} onClick={() => handleAdd(size)}
            className="w-full p-4 border-2 border-theme-beige rounded-xl hover:border-[#F3A70D] hover:bg-orange-50 transition flex justify-between items-center mb-3 shadow-sm group">
            <span className="font-bold text-theme-text text-lg flex items-center gap-2">📏 {size.name}</span>
            <span className="text-[#F3A70D] font-extrabold text-xl">${size.price}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 mt-2 border-t border-theme-beige">
        <button onClick={closeModal} className="w-full py-3.5 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
      </div>
    </div>
  )
}
