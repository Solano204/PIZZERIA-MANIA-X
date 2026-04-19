import { useRef, useState, useCallback } from 'react'
import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'

export default function FloorPlanEditor() {
  const { state, saveToStorage } = useAppStore()
  const { closeModal } = useModalStore()
  const { showToast } = useToastStore()

  const [tables, setTables] = useState(
    (state.tables || []).map(t => ({ ...t, xP: t.xP ?? 50, yP: t.yP ?? 50 }))
  )

  const dragging = useRef(null)
  const startOffset = useRef({ x: 0, y: 0 })
  const canvasRef = useRef(null)

  const getPos = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  const startDrag = useCallback((e, tableId) => {
    if (e.target.closest('.delete-btn')) return
    e.preventDefault()
    dragging.current = tableId
    const table = tables.find(t => t.id === tableId)
    const pos = getPos(e)
    startOffset.current = { x: pos.x - (table?.xP || 50), y: pos.y - (table?.yP || 50) }
  }, [tables])

  const onDrag = useCallback((e) => {
    if (!dragging.current) return
    e.preventDefault()
    const pos = getPos(e)
    const newX = Math.max(8, Math.min(92, pos.x - startOffset.current.x))
    const newY = Math.max(8, Math.min(92, pos.y - startOffset.current.y))
    setTables(ts => ts.map(t => t.id === dragging.current ? { ...t, xP: newX, yP: newY } : t))
  }, [])

  const stopDrag = useCallback(() => { dragging.current = null }, [])

  const deleteTable = (id) => setTables(ts => ts.filter(t => t.id !== id))

  const addTable = () => {
    const nextNum = tables.length + 1
    setTables(ts => [...ts, { id: Date.now(), name: `Mesa ${nextNum}`, capacity: 4, status: 'free', xP: 50, yP: 50 }])
  }

  const save = () => {
    useAppStore.setState(s => ({ state: { ...s.state, tables } }))
    saveToStorage()
    showToast('✅ Plano guardado en Firebase', 'success')
    document.body.style.overflow = ''
    closeModal()
  }

  const cancel = () => {
    document.body.style.overflow = ''
    closeModal()
  }

  return (
    <div className="glass bg-white w-full h-[100dvh] md:w-[95%] md:h-[95vh] md:rounded-3xl p-3 md:p-6 flex flex-col shadow-2xl border-0 md:border-4 border-blue-400 fixed md:relative inset-0 z-[99999]">
      <div className="flex justify-between items-center mb-3 shrink-0 bg-blue-600 text-white p-3 md:p-4 rounded-xl shadow-md">
        <div>
          <h3 className="text-base md:text-xl font-extrabold flex items-center gap-2">🏗️ Editor de Plano</h3>
          <p className="text-[10px] md:text-xs font-medium opacity-90">Desliza las mesas. 🗑️ para borrar.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addTable} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition text-xs shadow-sm">➕ Mesa</button>
          <button onClick={save} className="px-3 py-2 bg-green-400 hover:bg-green-500 text-black rounded-lg font-extrabold shadow-md transition text-xs">💾 Guardar</button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 bg-theme-bg rounded-xl shadow-inner border-2 border-dashed border-gray-400 relative overflow-hidden select-none"
        onMouseMove={onDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}
        onTouchMove={onDrag} onTouchEnd={stopDrag}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-400 text-white px-6 py-1 rounded-b-lg font-black text-[10px] uppercase tracking-widest z-0 opacity-50">
          Barra / Cocina
        </div>
        {tables.map(table => (
          <div
            key={table.id}
            onMouseDown={(e) => startDrag(e, table.id)}
            onTouchStart={(e) => startDrag(e, table.id)}
            className="absolute w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-gray-500 bg-white flex flex-col items-center justify-center cursor-move shadow-lg hover:border-blue-500 transition-colors duration-150 will-change-transform"
            style={{ left: `${table.xP}%`, top: `${table.yP}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
          >
            <span className="font-black text-gray-800 text-sm md:text-xl pointer-events-none leading-tight">{table.name}</span>
            <span className="text-[9px] md:text-xs font-bold text-gray-500 pointer-events-none">{table.capacity} pers.</span>
            <button
              onClick={() => deleteTable(table.id)}
              className="delete-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 text-xs font-bold shadow-md hover:bg-red-600 flex items-center justify-center z-10 transition-transform hover:scale-110"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <button onClick={cancel} className="mt-3 w-full py-3.5 rounded-xl bg-red-50 text-red-600 font-bold border border-red-200 transition text-sm shadow-sm md:hidden">❌ Cancelar y Salir</button>
      <button onClick={cancel} className="hidden md:block mt-3 w-full py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition text-sm">Cancelar y Cerrar</button>
    </div>
  )
}
