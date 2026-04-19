import { useState } from 'react'
import useAppStore from '../store/useAppStore'
import useToastStore from '../store/useToastStore'

export default function Login({ onSuccess }) {
  const { login } = useAppStore()
  const { showToast } = useToastStore()
  const [form, setForm] = useState({ username: '', password: '', branch: 'sucursal_principal' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.username.toLowerCase(), form.password, form.branch)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-4 bg-theme-bg">
      <div className="glass rounded-3xl p-8 w-full max-w-md animate-slideIn border border-white shadow-2xl">
        <div className="text-center mb-8">
          <img src="https://chicfkbdfqdrrevtrrby.supabase.co/storage/v1/object/public/PIZZERIA_ADMIN/mania.jpg" alt="Logo" className="w-32 h-32 mx-auto mb-4 object-contain drop-shadow-md rounded-2xl" />
          <h1 className="text-3xl font-bold text-theme-greenDark">PizzaManía</h1>
          <p className="text-theme-textMuted mt-2 leading-tight">
            Sistema de Gestión Integral<br />
            <span className="text-sm">punto de venta, comandas y control de inventarios</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-theme-text">Usuario</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green transition text-theme-text font-medium"
              placeholder="Ingrese su usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-theme-text">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 bg-white/80 border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green transition text-theme-text font-medium pr-12"
                placeholder="Ingrese su contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-xl text-theme-textMuted hover:text-theme-greenDark transition"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-theme-text">Sucursal</label>
            <select
              value={form.branch}
              onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 border border-theme-beige rounded-xl focus:outline-none focus:border-theme-green transition text-theme-text font-bold"
            >
              <option value="sucursal_principal">📍 Sucursal Principal</option>
              <option value="sucursal_centro">🏪 Sucursal Centro</option>
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm font-bold text-center p-3 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary font-bold py-3.5 rounded-xl mt-4 shadow-md text-lg disabled:opacity-50"
          >
            {loading ? '⏳ Conectando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-medium text-theme-textMuted bg-theme-bg p-3 rounded-xl border border-theme-beige">
          Sistema desarrollado por la empresa DY CodeStudio
        </div>
      </div>
    </div>
  )
}
