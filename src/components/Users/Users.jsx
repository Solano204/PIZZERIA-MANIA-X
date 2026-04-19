import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'

const ROLE_NAMES = { admin: 'Administrador', cashier: 'Cajero', kitchen: 'Cocina', waiter: 'Mesero' }
const ROLE_ICONS = { admin: '👨‍💼', cashier: '💰', kitchen: '👨‍🍳', waiter: '🍽️' }

export default function Users() {
  const { state, currentUser, saveToStorage, logActivity } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()

  const toggle = (userId) => {
    if (userId === currentUser.id) return
    useAppStore.setState(s => ({
      state: { ...s.state, users: s.state.users.map(u => u.id === userId ? { ...u, active: !u.active } : u) }
    }))
    const user = state.users.find(u => u.id === userId)
    logActivity('USER_TOGGLE', `Usuario ${user?.name} ${user?.active ? 'desactivado' : 'activado'}`)
    saveToStorage()
    showToast(`Usuario ${user?.active ? 'desactivado' : 'activado'}`, 'success')
  }

  return (
    <div className="animate-slideIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-theme-greenDark">👥 Usuarios</h2>
        <button onClick={() => openModal(<UserFormModal />)} className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md">➕ Nuevo Usuario</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(state.users || []).map(user => (
          <div key={user.id} className={`glass bg-white/60 border border-white rounded-2xl p-5 shadow-sm ${!user.active ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl bg-theme-beige p-2 rounded-full shadow-inner">{ROLE_ICONS[user.role]}</span>
              <div>
                <h4 className="font-extrabold text-theme-text">{user.name}</h4>
                <p className="text-sm text-theme-greenDark font-bold">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-theme-beige">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-theme-textMuted border border-theme-beige shadow-sm">{ROLE_NAMES[user.role]}</span>
              <div className="flex gap-2">
                <button onClick={() => openModal(<UserFormModal user={user} />)} className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-theme-beige bg-theme-bg">✏️</button>
                {user.id !== currentUser?.id && (
                  <button onClick={() => toggle(user.id)} className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-theme-beige bg-theme-bg">
                    {user.active ? '🟢' : '🔴'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserFormModal({ user }) {
  const { state, currentUser, saveToStorage, logActivity } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()
  const isEdit = !!user

  const [form, setForm] = useState({ name: user?.name || '', username: user?.username || '', password: '', role: user?.role || 'cashier' })
  const [showPass, setShowPass] = useState(false)

  const handleSave = () => {
    if (!form.name.trim() || !form.username.trim()) return showToast('Completa todos los campos', 'warning')
    if (!isEdit && !form.password) return showToast('La contraseña es requerida', 'warning')
    const users = state.users || []
    if (users.some(u => u.username === form.username.toLowerCase() && u.id !== user?.id)) return showToast('El usuario ya existe', 'error')

    if (isEdit) {
      useAppStore.setState(s => ({
        state: {
          ...s.state,
          users: s.state.users.map(u => u.id === user.id ? {
            ...u, name: form.name.trim(), username: form.username.toLowerCase().trim(),
            ...(form.password ? { password: form.password } : {}),
            ...(u.id !== currentUser.id ? { role: form.role } : {}),
          } : u)
        }
      }))
      logActivity('USER_UPDATE', `Usuario actualizado: ${form.name}`)
    } else {
      const newUser = { id: Date.now(), name: form.name.trim(), username: form.username.toLowerCase().trim(), password: form.password, role: form.role, active: true }
      useAppStore.setState(s => ({ state: { ...s.state, users: [...s.state.users, newUser] } }))
      logActivity('USER_ADD', `Nuevo usuario: ${form.name}`)
    }

    saveToStorage()
    showToast(`Usuario ${isEdit ? 'actualizado' : 'creado'}`, 'success')
    closeModal()
  }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-full max-w-md animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-bold mb-4 text-theme-greenDark">{isEdit ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-theme-text">Nombre completo</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green text-sm font-medium" placeholder="Ej: Juan Pérez" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-theme-text">Usuario (Login)</label>
          <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green text-sm font-medium" placeholder="Ej: jperez" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-theme-text">{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green text-sm font-medium pr-12" placeholder="••••••" />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute inset-y-0 right-0 px-4 flex items-center text-lg text-theme-textMuted hover:text-theme-greenDark transition">
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-theme-text">Rol</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={isEdit && user?.id === currentUser?.id} className="w-full px-4 py-3 bg-white border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green text-sm font-medium disabled:opacity-60">
            <option value="cashier">💰 Cajero</option>
            <option value="kitchen">👨‍🍳 Cocina</option>
            <option value="waiter">🍽️ Mesero</option>
            <option value="admin">👨‍💼 Administrador</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text">Cancelar</button>
          <button onClick={handleSave} className="btn-primary py-3 rounded-xl font-bold shadow-md">Guardar</button>
        </div>
      </div>
    </div>
  )
}
