import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import { hasEnoughStock, compressImageToBase64 } from '../../lib/helpers'
import ConfirmModal from '../shared/ConfirmModal'

export default function Products() {
  const { state, saveProduct, toggleProductActive, deleteProduct, saveToStorage } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()

  const categories = state.productCategories || []
  const products = (state.products || []).filter(p => !p.isVirtual)

  const handleDelete = (product) => {
    openModal(
      <ConfirmModal
        title="¿Eliminar Producto?"
        message={`Eliminarás ${product.name} del menú. Esta acción no se puede deshacer.`}
        danger
        onConfirm={() => { deleteProduct(product.id); showToast(`${product.name} eliminado`, 'success') }}
      />
    )
  }

  return (
    <div className="animate-slideIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">🍴 Productos</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => openModal(<CategoryManagerModal />)} className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md transition">
            🏷️ Categorías
          </button>
          <button onClick={() => openModal(<ProductFormModal />)} className="flex-1 md:flex-none btn-primary px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md transition">
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat.id} className="mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-theme-beige pb-2 text-theme-text">
            {cat.icon} {cat.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.filter(p => p.category === cat.id).map(p => {
              const available = hasEnoughStock(p, state.inventory || [])
              return (
                <div key={p.id} className={`glass border ${!available && p.active ? 'border-red-400 bg-red-50' : 'border-white bg-white/60'} rounded-2xl p-4 shadow-sm ${!p.active ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {p.image
                        ? <img src={p.image} className="w-14 h-14 object-cover rounded-xl shadow-sm border border-theme-beige" alt={p.name} />
                        : <span className="text-4xl drop-shadow-sm">{p.icon || cat.icon}</span>
                      }
                      <div>
                        <h4 className={`font-bold text-theme-text leading-tight ${!available && p.active ? 'text-red-800' : ''}`}>{p.name}</h4>
                        <p className={`${!available && p.active ? 'text-red-600' : 'text-theme-greenDark'} font-extrabold text-lg mt-1`}>${p.price}</p>
                        {p.sizes?.length > 0 && <p className="text-xs text-theme-textMuted">Desde ${Math.min(...p.sizes.map(s => s.price))}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-theme-beige">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-bold inline-block px-2 py-1 rounded-md ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {p.active ? 'Activo' : 'Oculto'}
                      </span>
                      {!available && p.active && <span className="text-[10px] font-bold inline-block px-2 py-1 rounded-md bg-red-500 text-white shadow-md animate-pulse-custom">Faltan insumos</span>}
                    </div>
                    <div className="flex gap-1 bg-theme-bg p-1 rounded-xl border border-theme-beige">
                      <button onClick={() => openModal(<ProductFormModal product={p} />)} className="p-2 hover:bg-white rounded-lg transition text-sm" title="Editar">✏️</button>
                      <button onClick={() => { toggleProductActive(p.id); showToast(`${p.name} ${p.active ? 'ocultado' : 'activado'}`, 'success') }} className="p-2 hover:bg-white rounded-lg transition text-sm">
                        {p.active ? '🟢' : '🔴'}
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition text-sm">🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
            {products.filter(p => p.category === cat.id).length === 0 && (
              <p className="text-theme-textMuted font-medium col-span-full py-4 bg-white/40 text-center rounded-xl border border-dashed border-theme-beige">Sin productos en esta categoría</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ProductFormModal({ product }) {
  const { state, saveProduct } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const isEdit = !!product

  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || state.productCategories?.[0]?.id || 'pizza',
    price: product?.price || '',
    imageUrl: '',
    imageBase64: '',
  })
  const [sizes, setSizes] = useState(product?.sizes ? JSON.parse(JSON.stringify(product.sizes)) : [])
  const [ingredients, setIngredients] = useState(product?.ingredients ? JSON.parse(JSON.stringify(product.ingredients)) : [])
  const [newSize, setNewSize] = useState({ name: '', price: '' })
  const [newIng, setNewIng] = useState({ id: '', qty: '' })

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const b64 = await compressImageToBase64(file)
      setForm(f => ({ ...f, imageBase64: b64 }))
      showToast('✅ Foto optimizada', 'success')
    } catch { showToast('Error al procesar imagen', 'error') }
  }

  const addSize = () => {
    if (!newSize.name || !newSize.price) return
    setSizes(s => [...s, { name: newSize.name, price: parseFloat(newSize.price) }])
    setNewSize({ name: '', price: '' })
  }

  const addIng = () => {
    if (!newIng.id || !newIng.qty) return
    const existing = ingredients.find(i => i.id === parseInt(newIng.id))
    if (existing) return showToast('Ya existe ese insumo', 'warning')
    setIngredients(i => [...i, { id: parseInt(newIng.id), qty: parseFloat(newIng.qty) }])
    setNewIng({ id: '', qty: '' })
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.price) return showToast('Nombre y precio requeridos', 'warning')
    const finalImage = form.imageBase64 || form.imageUrl || product?.image || null
    const p = {
      id: product?.id || Date.now(),
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      image: finalImage,
      icon: product?.icon || null,
      ingredients,
      sizes,
      active: product?.active ?? true,
    }
    saveProduct(p)
    showToast(`✅ Producto ${isEdit ? 'actualizado' : 'creado'}`, 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-5 md:p-6 w-[95%] max-w-lg animate-slideIn shadow-2xl border-2 border-white max-h-[90vh] overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-theme-beige">
        <h3 className="text-xl font-bold text-theme-greenDark">{isEdit ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
        <button onClick={closeModal} className="p-2 bg-white rounded-lg transition text-theme-textMuted hover:bg-theme-beige border border-theme-beige">✕</button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1 text-theme-text">Nombre</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green text-sm font-medium" />
        </div>
        <div className="bg-theme-bg p-3 rounded-xl border border-theme-beige">
          <label className="block text-sm font-bold mb-2 text-theme-text">Imagen (URL o subir foto)</label>
          <input type="text" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Pegar enlace..." className="w-full px-3 py-2 mb-2 bg-white border border-theme-beige rounded-lg text-sm focus:outline-none focus:border-theme-green" />
          <input type="file" accept="image/*" onChange={handleImageFile} className="text-xs w-full text-theme-textMuted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-theme-green file:text-white hover:file:bg-theme-greenDark cursor-pointer" />
          {(form.imageBase64 || form.imageUrl) && <p className="text-xs text-green-600 font-bold mt-1">✅ Imagen lista</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-theme-text">Categoría</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2 bg-white border border-theme-beige rounded-xl text-sm font-medium">
              {(state.productCategories || []).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-theme-text">Precio Base ($)</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2 bg-white border border-theme-beige rounded-xl text-sm font-medium" placeholder="0" />
          </div>
        </div>

        {/* Sizes */}
        <div className="mt-4 border-t border-theme-beige pt-4">
          <h4 className="font-bold text-theme-text mb-1">🍕 Tamaños Múltiples (Opcional)</h4>
          <p className="text-[10px] text-theme-textMuted mb-3 font-medium">Si agregas tamaños, el precio base será ignorado.</p>
          <div className="flex gap-2 mb-3 bg-theme-bg p-2 rounded-xl border border-theme-beige">
            <input type="text" value={newSize.name} onChange={e => setNewSize(s => ({ ...s, name: e.target.value }))} placeholder="Ej. Mediana" className="flex-1 px-3 py-2 bg-white border border-theme-beige rounded-lg text-sm font-bold" />
            <input type="number" value={newSize.price} onChange={e => setNewSize(s => ({ ...s, price: e.target.value }))} placeholder="Precio $" className="w-24 px-2 py-2 bg-white border border-theme-beige rounded-lg text-sm text-center font-bold" />
            <button onClick={addSize} className="bg-[#F3A70D] hover:bg-orange-500 text-white px-3 py-2 rounded-lg font-bold transition shadow-sm">➕</button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin pr-1">
            {sizes.length === 0
              ? <p className="text-xs text-theme-textMuted text-center py-3 italic border border-dashed border-theme-beige rounded-xl">Sin tamaños configurados.</p>
              : sizes.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-theme-beige shadow-sm">
                  <span className="text-sm font-bold text-theme-text">📏 {s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-[#F3A70D]">${s.price}</span>
                    <button onClick={() => setSizes(s2 => s2.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1.5 rounded transition text-lg">🗑️</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Ingredients */}
        <div className="mt-4 border-t border-theme-beige pt-4">
          <h4 className="font-bold text-theme-text mb-3">📝 Receta / Insumos</h4>
          <div className="flex gap-2 mb-3 bg-theme-bg p-2 rounded-xl border border-theme-beige flex-wrap sm:flex-nowrap">
            <select value={newIng.id} onChange={e => setNewIng(i => ({ ...i, id: e.target.value }))} className="flex-1 min-w-[150px] px-2 py-2 bg-white border border-theme-beige rounded-lg text-sm font-medium">
              <option value="">Seleccionar insumo...</option>
              {(state.inventory || []).map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
            <input type="number" value={newIng.qty} onChange={e => setNewIng(i => ({ ...i, qty: e.target.value }))} placeholder="Cant." step="0.01" className="w-20 px-2 py-2 bg-white border border-theme-beige rounded-lg text-sm text-center font-bold" />
            <button onClick={addIng} className="bg-theme-green hover:bg-theme-greenDark text-white px-3 py-2 rounded-lg font-bold transition shadow-sm grow sm:grow-0">➕</button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin pr-1">
            {ingredients.map((ing, i) => {
              const invItem = (state.inventory || []).find(inv => inv.id === ing.id)
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-theme-beige shadow-sm">
                  <span className="text-sm font-bold text-theme-text">{invItem?.name || `ID:${ing.id}`}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-theme-textMuted">{ing.qty} {invItem?.unit}</span>
                    <button onClick={() => setIngredients(ii => ii.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1 rounded text-sm">🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-theme-beige mt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
          <button onClick={handleSave} className="bg-[#F3A70D] text-white hover:bg-orange-500 py-3 rounded-xl font-bold shadow-md">Guardar</button>
        </div>
      </div>
    </div>
  )
}

function CategoryManagerModal() {
  const { state, saveToStorage } = useAppStore()
  const { openModal, closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const cats = state.productCategories || []

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-white max-h-[90vh] overflow-y-auto scrollbar-thin">
      <div className="flex justify-between items-center mb-6 border-b border-theme-beige pb-3">
        <h3 className="text-xl font-bold text-theme-greenDark flex items-center gap-2">🏷️ Gestión de Categorías</h3>
        <button onClick={closeModal} className="p-2 bg-white rounded-lg text-theme-textMuted hover:bg-theme-beige border border-theme-beige font-bold">✕</button>
      </div>
      <div className="space-y-3 mb-6">
        {cats.map(c => (
          <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-theme-beige shadow-sm">
            <span className="font-bold text-theme-text text-lg">{c.icon} {c.name}</span>
            <button onClick={() => openModal(<EditCategoryModal cat={c} />)} className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition font-bold shadow-sm">✏️ Editar</button>
          </div>
        ))}
      </div>
      <button onClick={() => openModal(<EditCategoryModal cat={null} />)} className="w-full py-3.5 border-2 border-dashed border-theme-green text-theme-greenDark rounded-xl font-bold hover:bg-theme-green hover:text-white transition shadow-sm flex items-center justify-center gap-2">
        ➕ Crear Nueva Categoría
      </button>
    </div>
  )
}

function EditCategoryModal({ cat }) {
  const { state, saveToStorage } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()
  const isNew = !cat
  const [form, setForm] = useState({ name: cat?.name || '', icon: cat?.icon || '🍽️', allowHalfAndHalf: cat?.allowHalfAndHalf || false })

  const handleSave = () => {
    if (!form.name.trim()) return showToast('El nombre es obligatorio', 'warning')
    const cats = state.productCategories || []
    let updated
    if (isNew) {
      const newId = form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/, '')
      if (cats.some(c => c.id === newId)) return showToast('Esa categoría ya existe', 'error')
      updated = [...cats, { id: newId, name: form.name.trim(), icon: form.icon, allowHalfAndHalf: form.allowHalfAndHalf }]
    } else {
      updated = cats.map(c => c.id === cat.id ? { ...c, name: form.name.trim(), icon: form.icon, allowHalfAndHalf: form.allowHalfAndHalf } : c)
    }
    useAppStore.setState(s => ({ state: { ...s.state, productCategories: updated } }))
    saveToStorage()
    showToast('Categoría guardada', 'success')
    openModal(<CategoryManagerModal />)
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-sm animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-bold mb-4 text-theme-greenDark">{isNew ? '➕ Nueva Categoría' : '✏️ Editar Categoría'}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1 text-theme-text">Nombre</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green font-bold text-theme-text" placeholder="Ej: Ensaladas" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1 text-theme-text">Icono (Solo 1 Emoji)</label>
          <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green font-bold text-theme-text text-2xl text-center" maxLength={5} placeholder="🥗" />
        </div>
        <div className="flex items-center gap-3 mt-4 bg-orange-50 p-3 rounded-xl border border-orange-200">
          <input type="checkbox" id="catHalf" checked={form.allowHalfAndHalf} onChange={e => setForm(f => ({ ...f, allowHalfAndHalf: e.target.checked }))} className="w-5 h-5 text-[#F3A70D] rounded cursor-pointer" />
          <label htmlFor="catHalf" className="text-sm font-bold text-orange-800 cursor-pointer select-none">Habilitar "Mitad y Mitad" en esta categoría</label>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-theme-beige">
          <button onClick={() => openModal(<CategoryManagerModal />)} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Volver</button>
          <button onClick={handleSave} className="btn-primary py-3 rounded-xl font-bold shadow-md">Guardar</button>
        </div>
      </div>
    </div>
  )
}
