import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import ConfirmModal from '../shared/ConfirmModal'
import FloorPlanEditor from '../Waiter/FloorPlanEditor'
import { DEFAULT_DATA } from '../../lib/defaultData'

export default function Settings() {
  const { state, currentUser, saveToStorage, logActivity } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()

  const settings = state.settings || {}
  const modifiers = (state.modifiers || []).filter(m => m && m.name && m.name.trim() !== '')
  const allCategories = [...new Set((state.products || []).map(p => p.category?.toLowerCase().trim() || 'general'))]

  const saveWhatsapp = () => {
    const num = document.getElementById('ownerWhatsapp')?.value?.replace(/\D/g, '') || ''
    useAppStore.setState(s => ({ state: { ...s.state, settings: { ...s.state.settings, ownerWhatsApp: num } } }))
    saveToStorage()
    showToast('✅ Número de WhatsApp vinculado', 'success')
  }

  const addModifier = () => {
    const name = document.getElementById('newModName')?.value?.trim()
    const price = parseFloat(document.getElementById('newModPrice')?.value) || 0
    if (!name) return showToast('Ingresa el nombre del extra', 'warning')
    useAppStore.setState(s => ({
      state: { ...s.state, modifiers: [...(s.state.modifiers || []), { id: Date.now(), name, price, categories: [] }] }
    }))
    saveToStorage()
    showToast('✅ Extra creado', 'success')
    document.getElementById('newModName').value = ''
    document.getElementById('newModPrice').value = ''
  }

  const deleteModifier = (id) => {
    useAppStore.setState(s => ({ state: { ...s.state, modifiers: (s.state.modifiers || []).filter(m => m.id !== id) } }))
    saveToStorage()
    showToast('Modificador eliminado', 'success')
  }

  const updateModCats = (id) => {
    const checkboxes = document.querySelectorAll(`.mod-cat-${id}:checked`)
    const cats = Array.from(checkboxes).map(cb => cb.value)
    useAppStore.setState(s => ({
      state: { ...s.state, modifiers: (s.state.modifiers || []).map(m => m.id === id ? { ...m, categories: cats } : m) }
    }))
    saveToStorage()
    showToast('✅ Categorías actualizadas', 'success')
  }

  const handleModeChange = (targetMode) => openModal(<ModePasswordModal targetMode={targetMode} />)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pizzamania_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Datos exportados', 'success')
  }

  const addTable = () => {
    const nextNum = (state.tables || []).length + 1
    useAppStore.setState(s => ({
      state: { ...s.state, tables: [...s.state.tables, { id: Date.now(), name: `Mesa ${nextNum}`, capacity: 4, status: 'free', xP: 50, yP: 50 }] }
    }))
    saveToStorage()
    showToast('Mesa agregada', 'success')
  }

  return (
    <div className="animate-slideIn">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-theme-greenDark">⚙️ Configuración</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Mode */}
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-lg mb-5 text-theme-text border-b border-theme-beige pb-3">🏪 Modo de Operación</h3>
          <div className="space-y-4">
            {[
              { val: 'full', label: '🍽️ Restaurante Completo (Pro)', desc: 'Incluye Punto de Venta, plano de Mesas, Meseros y pantalla de Cocina.' },
              { val: 'counter', label: '🏪 Solo Mostrador (Lite)', desc: 'Oculta Mesas y Cocina. Ideal para cobro rápido y venta directa.' },
            ].map(opt => (
              <label key={opt.val} className={`flex items-center gap-3 p-4 bg-white rounded-xl border ${settings.systemMode === opt.val || (opt.val === 'full' && !settings.systemMode) ? 'border-theme-green bg-green-50/30' : 'border-theme-beige'} cursor-pointer transition hover:shadow-md`}>
                <input type="radio" name="sysMode" value={opt.val} checked={settings.systemMode === opt.val || (opt.val === 'full' && !settings.systemMode)} onChange={() => handleModeChange(opt.val)} className="w-5 h-5 text-theme-green focus:ring-theme-green cursor-pointer" />
                <div>
                  <p className="font-bold text-theme-text">{opt.label}</p>
                  <p className="text-xs text-theme-textMuted font-medium mt-1">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Modifiers */}
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-lg mb-5 text-theme-text border-b border-theme-beige pb-3">✨ Extras y Modificadores</h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin pr-2 mb-4">
            {modifiers.length === 0
              ? <p className="text-xs text-center text-gray-400 font-bold py-4 border border-dashed border-gray-300 rounded-xl">No hay extras registrados</p>
              : modifiers.map(m => (
                <div key={m.id} className="p-4 bg-white rounded-xl border border-theme-beige shadow-sm">
                  <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-3">
                    <span className="text-sm font-extrabold text-theme-text">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-theme-greenDark font-black text-sm">+${m.price}</span>
                      <button onClick={() => deleteModifier(m.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition">🗑️</button>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-theme-textMuted mb-2 uppercase">Mostrar en:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded text-[11px] cursor-pointer hover:bg-gray-100 transition">
                        <input type="checkbox" value={cat} defaultChecked={m.categories?.includes(cat)} className={`mod-cat-${m.id} w-3 h-3 text-theme-green rounded cursor-pointer`} />
                        <span className="capitalize font-bold text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={() => updateModCats(m.id)} className="w-full py-2 bg-theme-bg hover:bg-theme-beige text-theme-text font-bold text-xs rounded-lg transition border border-theme-beige flex items-center justify-center gap-2">
                    💾 Guardar Categorías
                  </button>
                </div>
              ))
            }
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-xs font-extrabold text-theme-greenDark mb-3 uppercase tracking-wider">➕ Crear Nuevo Extra</p>
            <div className="flex gap-2">
              <input id="newModName" type="text" placeholder="Ej. Extra Queso" className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-theme-green text-sm font-bold shadow-inner" />
              <input id="newModPrice" type="number" placeholder="$0" className="w-20 px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-center shadow-inner" />
              <button onClick={addModifier} className="bg-theme-green text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-theme-greenDark transition">Crear</button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-lg mb-5 text-theme-text border-b border-theme-beige pb-3">☁️ Gestión de Datos (Firebase)</h3>
          <div className="space-y-3">
            <button onClick={exportData} className="w-full py-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition flex items-center justify-center gap-2 shadow-sm">
              📥 Descargar Copia de Seguridad (JSON)
            </button>
            <button
              onClick={() => openModal(
                <ConfirmModal title="⚠️ Restaurar Datos" message="¿Estás seguro? Esto eliminará todos los datos de manera permanente y los reemplazará con los valores de fábrica en Firebase." danger
                  onConfirm={() => {
                    useAppStore.setState(() => ({ state: JSON.parse(JSON.stringify(DEFAULT_DATA)) }))
                    saveToStorage()
                    showToast('Datos restaurados en Firebase', 'success')
                  }} />
              )}
              className="w-full py-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 transition flex items-center justify-center gap-2 shadow-sm mt-6"
            >
              ⚠️ Restaurar Sistema de Fábrica
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-lg mb-5 text-theme-text border-b border-theme-beige pb-3">ℹ️ Información del Sistema</h3>
          <div className="space-y-3 text-sm font-medium">
            {[
              { label: 'Base de Datos:', value: 'Firebase Firestore (En Vivo)', cls: 'text-theme-greenDark' },
              { label: 'Usuarios registrados:', value: (state.users || []).length },
              { label: 'Productos en menú:', value: (state.products || []).filter(p => !p.isVirtual).length },
              { label: 'Insumos en inventario:', value: (state.inventory || []).length },
            ].map((row, i) => (
              <div key={i} className="flex justify-between p-4 rounded-xl bg-white shadow-sm border border-theme-beige">
                <span className="text-theme-textMuted font-bold">{row.label}</span>
                <span className={`font-extrabold text-base ${row.cls || 'text-theme-text'}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="glass bg-green-50/50 border-2 border-green-200 rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
          <h3 className="font-extrabold text-lg mb-3 text-green-800 flex items-center gap-2">📱 Alertas por WhatsApp</h3>
          <p className="text-sm text-theme-text font-medium mb-4">Envía el Corte de Caja automáticamente al dueño o gerente.</p>
          <div className="flex gap-2">
            <input id="ownerWhatsapp" type="text" defaultValue={settings.ownerWhatsApp || ''} className="w-full px-4 py-2.5 bg-white border border-green-200 rounded-xl focus:outline-none focus:border-green-500 font-bold" placeholder="Ej: 521963..." />
            <button onClick={saveWhatsapp} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold transition shadow-sm">Guardar</button>
          </div>
        </div>

        {/* Floor Plan */}
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-lg mb-2 text-theme-text">🗺️ Diseño de Plano</h3>
          <p className="text-sm text-theme-textMuted mb-5">Diseña la distribución arrastrando las mesas a su posición real.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => openModal(<FloorPlanEditor />)} className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition flex items-center justify-center gap-2 shadow-md">
              🏗️ Abrir Editor de Mesas
            </button>
            <button onClick={addTable} className="w-full py-3 rounded-xl bg-theme-bg hover:bg-theme-beige border border-theme-beige font-bold text-theme-text transition shadow-sm text-sm">
              ➕ Agregar Nueva Mesa Rápida
            </button>
          </div>
        </div>

        {/* Suppliers */}
        <div className="glass bg-white/60 border border-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5 border-b border-theme-beige pb-3">
            <h3 className="font-extrabold text-lg text-theme-text">📞 Catálogo de Proveedores</h3>
            <button onClick={() => openModal(<SupplierModal />)} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold shadow-md">➕ Nuevo</button>
          </div>
          <div className="space-y-3 max-h-80 overflow-auto scrollbar-thin pr-2">
            {(state.suppliers || []).map(s => (
              <div key={s.id} className="p-4 rounded-xl bg-white shadow-sm border border-theme-beige flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-theme-greenDark text-lg mb-1">{s.name}</p>
                  <p className="text-sm font-medium text-theme-textMuted">📞 {s.contact || 'N/A'}</p>
                  <p className="text-sm font-medium text-theme-textMuted">✉️ {s.email || 'N/A'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(<SupplierModal supplier={s} />)} className="p-2 hover:bg-theme-beige rounded-lg transition text-sm">✏️</button>
                  <button onClick={() => {
                    useAppStore.setState(s2 => ({ state: { ...s2.state, suppliers: s2.state.suppliers.filter(sup => sup.id !== s.id) } }))
                    saveToStorage()
                    showToast('Proveedor eliminado', 'success')
                  }} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition text-sm">🗑️</button>
                </div>
              </div>
            ))}
            {(state.suppliers || []).length === 0 && <p className="text-center text-sm font-bold text-gray-400 py-6">No hay proveedores registrados</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModePasswordModal({ targetMode }) {
  const { saveToStorage } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const [password, setPassword] = useState('')

  const verify = () => {
    if (password !== '2310') { showToast('❌ Contraseña incorrecta', 'error'); return }
    useAppStore.setState(s => ({ state: { ...s.state, settings: { ...s.state.settings, systemMode: targetMode } } }))
    saveToStorage()
    showToast('✅ Modo de operación actualizado', 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-sm animate-slideIn shadow-2xl border-2 border-theme-green text-center">
      <div className="text-5xl mb-4">🔐</div>
      <h3 className="text-xl font-extrabold mb-2 text-theme-text">Cambio de Configuración</h3>
      <p className="text-sm text-theme-textMuted mb-4 font-medium">Ingresa la contraseña maestra:</p>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && verify()}
        className="w-full px-4 py-3 mb-6 bg-white border-2 border-theme-beige rounded-xl text-2xl text-center focus:outline-none focus:border-theme-green font-bold text-theme-text shadow-inner" placeholder="****" />
      <div className="grid grid-cols-2 gap-3">
        <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
        <button onClick={verify} className="btn-primary py-3 rounded-xl font-bold shadow-md transition">Confirmar</button>
      </div>
    </div>
  )
}

function SupplierModal({ supplier }) {
  const { saveToStorage } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const isEdit = !!supplier
  const [form, setForm] = useState({ name: supplier?.name || '', contact: supplier?.contact || '', email: supplier?.email || '' })

  const handleSave = () => {
    if (!form.name.trim()) return showToast('El nombre es obligatorio', 'warning')
    if (isEdit) {
      useAppStore.setState(s => ({ state: { ...s.state, suppliers: s.state.suppliers.map(s2 => s2.id === supplier.id ? { ...s2, ...form } : s2) } }))
    } else {
      useAppStore.setState(s => ({ state: { ...s.state, suppliers: [...(s.state.suppliers || []), { id: Date.now(), ...form }] } }))
    }
    saveToStorage()
    showToast('Proveedor guardado', 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-bold mb-4 text-theme-greenDark flex items-center gap-2">{isEdit ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}</h3>
      <div className="space-y-4">
        {[
          { label: 'Nombre de la Empresa', key: 'name', placeholder: 'Ej: Carnes Selectas S.A.', type: 'text' },
          { label: 'Teléfono', key: 'contact', placeholder: '963 123 4567', type: 'tel' },
          { label: 'Correo Electrónico', key: 'email', placeholder: 'ventas@empresa.com', type: 'email' },
        ].map(field => (
          <div key={field.key}>
            <label className="block text-sm font-bold mb-1 text-theme-text">{field.label}</label>
            <input type={field.type} value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green font-medium text-sm shadow-inner" placeholder={field.placeholder} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-theme-beige mt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
          <button onClick={handleSave} className="btn-primary py-3 rounded-xl font-bold shadow-md">Guardar</button>
        </div>
      </div>
    </div>
  )
}
