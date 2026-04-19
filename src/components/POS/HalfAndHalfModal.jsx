import { useState } from 'react'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import useAppStore from '../../store/useAppStore'

export default function HalfAndHalfModal({ products, onAdd, onCancel }) {
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const { state } = useAppStore()
  const [half1, setHalf1] = useState(products[0]?.id || '')
  const [half2, setHalf2] = useState(products[1]?.id || '')

  const handleCreate = () => {
    if (!half1 || !half2) return showToast('Selecciona dos productos', 'warning')
    if (half1 === half2) return showToast('Debes elegir dos productos diferentes', 'warning')

    const p1 = state.products.find(p => p.id === parseInt(half1))
    const p2 = state.products.find(p => p.id === parseInt(half2))

    const merged = []
    const addHalf = (ingList) => {
      if (!ingList) return
      ingList.forEach(ing => {
        const ex = merged.find(i => i.id === ing.id)
        if (ex) ex.qty += ing.qty / 2
        else merged.push({ id: ing.id, qty: ing.qty / 2 })
      })
    }
    addHalf(p1.ingredients)
    addHalf(p2.ingredients)

    let mergedSizes = []
    if (p1.sizes?.length > 0 && p2.sizes?.length > 0) {
      p1.sizes.forEach(s1 => {
        const s2 = p2.sizes.find(s => s.name === s1.name)
        if (s2) mergedSizes.push({ name: s1.name, price: Math.max(s1.price, s2.price) })
      })
    }

    const virtualId = Date.now()
    const virtualName = `Mitad ${p1.name.replace('Pizza ', '')} / Mitad ${p2.name.replace('Pizza ', '')}`
    const virtualProduct = {
      id: virtualId, name: virtualName, category: 'custom_half',
      price: Math.max(p1.price, p2.price), icon: '🌗',
      ingredients: merged, sizes: mergedSizes, active: false, isVirtual: true,
    }

    state.products.push(virtualProduct)

    if (virtualProduct.sizes?.length > 0) {
      import('./SizeModal').then(({ default: SizeModal }) => {
        const { openModal } = useModalStore.getState()
        openModal(<SizeModal product={virtualProduct} onAdd={(item) => { onAdd(item); closeModal() }} />)
      })
    } else {
      onAdd({ productId: virtualId, name: virtualName, price: virtualProduct.price, quantity: 1 })
      closeModal()
    }
  }

  const opts = products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-[#F3A70D]">
      <h3 className="text-xl font-black mb-1 text-theme-text flex items-center gap-2">🌗 Armar Mitad y Mitad</h3>
      <p className="text-sm font-medium text-theme-textMuted mb-5">El sistema promediará las recetas y cobrará el precio de la mitad más cara.</p>
      <div className="space-y-4">
        <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
          <label className="block text-sm font-bold mb-1 text-orange-800">Primera Mitad (1/2)</label>
          <select value={half1} onChange={e => setHalf1(e.target.value)} className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg focus:outline-none font-bold text-theme-text">{opts}</select>
        </div>
        <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
          <label className="block text-sm font-bold mb-1 text-orange-800">Segunda Mitad (1/2)</label>
          <select value={half2} onChange={e => setHalf2(e.target.value)} className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg focus:outline-none font-bold text-theme-text">{opts}</select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-6 mt-2 border-t border-theme-beige">
        <button onClick={onCancel || closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
        <button onClick={handleCreate} className="bg-[#F3A70D] hover:bg-orange-500 text-white py-3 rounded-xl font-bold shadow-md transition">Fusionar Productos</button>
      </div>
    </div>
  )
}
