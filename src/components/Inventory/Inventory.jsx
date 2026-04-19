import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import ConfirmModal from '../shared/ConfirmModal'

export default function Inventory() {
  const { state, addInventoryEntry, saveToStorage } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()
  const [filter, setFilter] = useState('all')

  const inventory = state.inventory || []

  const baseCategories = [
    { id: 'all', name: 'Todos', icon: '📦' },
    { id: 'basicos', name: 'Básicos', icon: '🧀' },
    { id: 'carnes', name: 'Carnes', icon: '🥩' },
    { id: 'verduras', name: 'Verduras', icon: '🍅' },
    { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
    { id: 'general', name: 'Otros', icon: '🏷️' },
  ]
  const baseIds = baseCategories.map(c => c.id)
  const customCats = [...new Set(inventory.map(i => i.category))].filter(c => c && !baseIds.includes(c))
  const categories = [...baseCategories, ...customCats.map(c => ({ id: c, name: c.charAt(0).toUpperCase() + c.slice(1), icon: '✨' }))]

  const filtered = filter === 'all' ? inventory : inventory.filter(i => i.category === filter)
  const lowStock = inventory.filter(i => i.stock <= i.minStock)

  const handleDelete = (item) => {
    openModal(
      <ConfirmModal
        title="¿Eliminar Insumo?"
        message={`Eliminarás ${item.name} del inventario. Los productos con esta receta se marcarán como agotados.`}
        danger
        onConfirm={() => {
          useAppStore.setState(s => ({ state: { ...s.state, inventory: s.state.inventory.filter(i => i.id !== item.id) } }))
          saveToStorage()
          showToast(`${item.name} eliminado`, 'success')
        }}
      />
    )
  }

  return (
    <div className="animate-slideIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">📦 Inventario Clasificado</h2>
        <button onClick={() => openModal(<AddInventoryModal />)} className="btn-primary px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md w-full sm:w-auto">
          ➕ Agregar Insumo
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-4">
        {categories.map(c => (
          <button
            key={c.id} onClick={() => setFilter(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap transition-all border border-transparent
              ${filter === c.id ? 'bg-theme-green text-white' : 'bg-white/60 hover:bg-white text-theme-textMuted hover:border-theme-beige'}`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm flex items-center gap-4 overflow-x-auto scrollbar-thin">
          <h3 className="font-bold text-red-600 flex items-center gap-2 whitespace-nowrap">⚠️ Alertas críticas:</h3>
          <div className="flex gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-extrabold shadow-sm whitespace-nowrap border border-red-200">
                {i.name}: {i.stock} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 pb-8">
        {filtered.length === 0
          ? <div className="text-center py-12 bg-white/40 rounded-xl border border-dashed border-theme-beige"><p className="text-theme-textMuted font-medium text-lg">No hay insumos en esta categoría</p></div>
          : filtered.map(item => {
            let convText = ''
            if (item.unit === 'kg') convText = `(${Number((item.stock * 1000).toFixed(0)).toLocaleString()} g)`
            else if (item.unit === 'lt') convText = `(${Number((item.stock * 1000).toFixed(0)).toLocaleString()} ml)`

            const statusBadge = item.stock <= item.minStock
              ? <span className="px-2 py-0.5 rounded-md text-[10px] bg-red-100 text-red-700 font-bold border border-red-200">Bajo</span>
              : item.stock <= item.minStock * 2
                ? <span className="px-2 py-0.5 rounded-md text-[10px] bg-yellow-100 text-yellow-800 font-bold border border-yellow-200">Medio</span>
                : <span className="px-2 py-0.5 rounded-md text-[10px] bg-green-100 text-green-700 font-bold border border-green-200">Óptimo</span>

            return (
              <div key={item.id} className={`bg-white/90 rounded-2xl p-4 shadow-sm border ${item.stock <= item.minStock ? 'border-red-300' : 'border-theme-beige'} flex flex-col md:flex-row md:items-center justify-between gap-3 transition hover:shadow-md`}>
                <div className="flex-1 flex justify-between md:justify-start items-start md:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-theme-text text-base leading-tight">{item.name}</h4>
                      {statusBadge}
                    </div>
                    <p className="text-[11px] font-bold text-theme-textMuted uppercase mt-1 tracking-wider">
                      {item.category} • ${item.cost}/u
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 w-full md:w-auto border-t md:border-0 border-theme-beige pt-3 md:pt-0">
                  <div className="flex justify-between sm:justify-center items-center w-full sm:w-auto bg-theme-bg px-4 py-2 rounded-xl border border-theme-beige">
                    <div className="text-right sm:text-center">
                      <p className={`text-lg font-extrabold ${item.stock <= item.minStock ? 'text-red-600' : 'text-theme-greenDark'} leading-none`}>
                        {item.stock.toFixed(2)} <span className="text-xs font-bold text-theme-text">{item.unit}</span>
                      </p>
                      {convText && <span className="block text-[10px] text-theme-textMuted font-bold mt-0.5">{convText}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => openModal(<EntryModal item={item} />)} className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm font-bold shadow-sm flex items-center justify-center gap-1 transition">
                      ➕ <span className="md:hidden lg:inline">Entrada</span>
                    </button>
                    <button onClick={() => openModal(<EditInventoryModal item={item} />)} className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 text-sm font-bold shadow-sm flex items-center justify-center transition">✏️</button>
                    <button onClick={() => handleDelete(item)} className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-sm font-bold shadow-sm flex items-center justify-center transition">🗑️</button>
                  </div>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

function EntryModal({ item }) {
  const { closeModal } = useModalStore()
  const { addInventoryEntry, currentUser } = useAppStore()
  const { showToast } = useToastStore()
  const [qty, setQty] = useState('')

  const handleSave = () => {
    const q = parseFloat(qty)
    if (isNaN(q) || q <= 0) return showToast('Ingresa una cantidad mayor a 0', 'warning')
    addInventoryEntry(item.id, q, currentUser?.name, currentUser?.id)
    showToast(`✅ Se agregaron ${q} ${item.unit}`, 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-sm animate-slideIn shadow-2xl border-2 border-blue-300">
      <h3 className="text-xl font-bold mb-3 text-blue-700 flex items-center gap-2">📥 Registrar Entrada</h3>
      <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-4">
        <p className="font-extrabold text-theme-text text-lg">{item.name}</p>
        <p className="text-sm font-medium text-blue-600 mt-1">Stock actual: <strong>{item.stock.toFixed(2)} {item.unit}</strong></p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1 text-theme-text">Cantidad ({item.unit})</label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} step="0.01"
            className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 font-extrabold text-theme-text text-2xl text-center shadow-inner" placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-theme-beige mt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md transition">Guardar</button>
        </div>
      </div>
    </div>
  )
}

function AddInventoryModal() {
  const { closeModal } = useModalStore()
  const { saveToStorage } = useAppStore()
  const { showToast } = useToastStore()
  const [form, setForm] = useState({ name: '', unit: 'kg', minStock: '', stock: '', cost: '' })

  const handleSave = () => {
    if (!form.name.trim()) return showToast('Nombre requerido', 'warning')
    const newItem = {
      id: Date.now(), name: form.name.trim().toUpperCase(), unit: form.unit,
      minStock: parseFloat(form.minStock) || 0, stock: parseFloat(form.stock) || 0,
      cost: parseFloat(form.cost) || 0, category: 'general', supplier: '',
    }
    useAppStore.setState(s => ({ state: { ...s.state, inventory: [...s.state.inventory, newItem] } }))
    saveToStorage()
    showToast('✅ Insumo agregado', 'success')
    closeModal()
  }

  const totalCost = (parseFloat(form.stock) || 0) * (parseFloat(form.cost) || 0)

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-full max-w-md animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-bold mb-4 text-theme-greenDark">➕ Nuevo Insumo</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1 text-theme-text">Nombre del Insumo</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green text-sm font-bold uppercase" placeholder="Ej: Harina de Trigo" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-1 text-theme-text">Unidad</label>
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl text-sm font-bold">
              <option value="kg">kg</option><option value="gr">gr</option><option value="lt">lt</option>
              <option value="ml">ml</option><option value="pza">pza</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-theme-text">Stock Mínimo</label>
            <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl text-sm font-bold" placeholder="5" />
          </div>
        </div>
        <div className="bg-theme-bg p-3 rounded-xl border border-theme-beige space-y-3">
          <div>
            <label className="block text-sm font-bold mb-1 text-theme-greenDark">Cantidad (Stock)</label>
            <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-black text-blue-600" placeholder="44" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1 text-theme-textMuted">Costo x Unidad ($)</label>
              <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-black mb-1 text-orange-600">Total Calculado</label>
              <div className="w-full px-3 py-2 bg-white border-2 border-orange-300 rounded-xl text-sm font-black text-orange-700">${totalCost.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-theme-beige">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text">Cancelar</button>
          <button onClick={handleSave} className="btn-primary py-3 rounded-xl font-bold shadow-md">Guardar</button>
        </div>
      </div>
    </div>
  )
}

function EditInventoryModal({ item }) {
  const { closeModal } = useModalStore()
  const { saveToStorage } = useAppStore()
  const { showToast } = useToastStore()
  const [form, setForm] = useState({ name: item.name, minStock: item.minStock, cost: item.cost, supplier: item.supplier || '' })

  const handleSave = () => {
    if (!form.name.trim()) return showToast('Nombre requerido', 'warning')
    useAppStore.setState(s => ({
      state: {
        ...s.state,
        inventory: s.state.inventory.map(i => i.id === item.id ? { ...i, ...form, minStock: parseFloat(form.minStock) || 0, cost: parseFloat(form.cost) || 0 } : i),
      },
    }))
    saveToStorage()
    showToast('✅ Insumo actualizado', 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-white max-h-[90vh] overflow-y-auto scrollbar-thin">
      <h3 className="text-xl font-bold mb-4 text-theme-greenDark">✏️ Editar Insumo</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Nombre</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green font-medium text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Stock Mínimo</label>
            <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} step="0.01" className="w-full px-4 py-2.5 bg-white border border-theme-beige rounded-xl font-medium text-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Costo Unitario ($)</label>
            <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} step="0.01" className="w-full px-4 py-2.5 bg-white border border-theme-beige rounded-xl font-medium text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Proveedor</label>
          <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="w-full px-4 py-2.5 bg-white border border-theme-beige rounded-xl font-medium text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-theme-beige mt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
          <button onClick={handleSave} className="btn-primary py-3 rounded-xl font-bold shadow-md">Guardar</button>
        </div>
      </div>
    </div>
  )
}
