import { useState } from 'react'
import useCartStore from '../../store/useCartStore'
import useModalStore from '../../store/useModalStore'

export default function NoteModal({ index, item }) {
  const [note, setNote] = useState(item.note || '')
  const { setNote: saveNote } = useCartStore()
  const { closeModal } = useModalStore()

  const handleSave = () => { saveNote(index, note.trim()); closeModal() }
  const handleDelete = () => { saveNote(index, ''); closeModal() }

  return (
    <div className="glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-sm animate-slideIn shadow-2xl border-2 border-white">
      <h3 className="text-xl font-bold mb-2 text-theme-greenDark flex items-center gap-2">
        ✏️ {item.note ? 'Editar Nota' : 'Nota Especial'}
      </h3>
      <p className="text-sm font-medium text-theme-textMuted mb-4">Instrucciones para: <strong className="text-theme-text">{item.name}</strong></p>
      <input type="text" value={note} onChange={e => setNote(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()}
        className="w-full px-4 py-3 bg-white border-2 border-theme-beige rounded-xl focus:outline-none focus:border-theme-green font-medium text-theme-text shadow-inner"
        placeholder="Ej: Sin cebolla, extra queso..." />
      {item.note && (
        <button onClick={handleDelete} className="w-full py-2.5 mt-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition font-bold text-sm shadow-sm">
          🗑️ Eliminar Nota
        </button>
      )}
      <div className="grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-theme-beige">
        <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">Cancelar</button>
        <button onClick={handleSave} className="btn-primary py-3 rounded-xl font-bold shadow-md">Guardar</button>
      </div>
    </div>
  )
}
