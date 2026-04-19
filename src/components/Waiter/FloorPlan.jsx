import useAppStore from '../../store/useAppStore'
import useModalStore from '../../store/useModalStore'
import useToastStore from '../../store/useToastStore'
import { getStatusClass, getStatusLabel } from '../../lib/helpers'
import TableModal from './TableModal'
import ConfirmModal from '../shared/ConfirmModal'

export default function FloorPlan() {
  const { state, freeTable, saveToStorage } = useAppStore()
  const { openModal } = useModalStore()
  const { showToast } = useToastStore()

  const tables = state.tables || []

  const confirmDelete = (tableId, e) => {
    e.stopPropagation()
    const table = tables.find(t => t.id === tableId)
    if (table?.status === 'occupied') return showToast('No puedes eliminar una mesa ocupada', 'error')
    openModal(
      <ConfirmModal
        title="¿Eliminar Mesa?"
        message={`Eliminarás ${table?.name} permanentemente.`}
        onConfirm={() => {
          useAppStore.setState(s => ({ state: { ...s.state, tables: s.state.tables.filter(t => t.id !== tableId) } }))
          saveToStorage()
          showToast('Mesa eliminada', 'success')
        }}
        danger
      />
    )
  }

  return (
    <div className="animate-slideIn h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-theme-greenDark">🍽️ Plano de Mesas</h2>
        <span className="bg-white px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold text-theme-textMuted border border-theme-beige shadow-sm">{tables.length} mesas</span>
      </div>

      <div className="flex-1 w-full glass rounded-2xl md:rounded-3xl border border-white shadow-sm p-1.5 md:p-4 bg-[#f8fafc] flex flex-col min-h-0">
        <div className="flex-1 w-full relative bg-white/80 rounded-xl md:rounded-2xl shadow-inner border border-gray-300 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-600 px-4 md:px-6 py-1 rounded-b-lg font-bold text-[9px] md:text-xs uppercase tracking-wider z-0">
            Cocina / Barra
          </div>

          {tables.map(table => {
            const activeOrder = (state.orders || []).find(
              o => o.tableId === table.id && o.paymentStatus !== 'paid' && o.status !== 'cancelled'
            )

            let bgColor = 'bg-green-50 border-green-400 hover:bg-green-100'
            let textColor = 'text-green-700'
            let pulseEffect = ''
            let badge = null

            if (table.status !== 'free') {
              if (activeOrder) {
                if (activeOrder.status === 'ready') {
                  bgColor = 'bg-blue-100 border-blue-500'
                  textColor = 'text-blue-800'
                  pulseEffect = 'shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse-custom'
                } else {
                  bgColor = 'bg-orange-50 border-orange-400 hover:bg-orange-100'
                  textColor = 'text-orange-800'
                }
                badge = (
                  <span className={`px-1.5 md:px-2.5 py-0.5 rounded-full text-[8px] md:text-[10px] font-black bg-white/95 ${textColor} shadow-sm border border-white text-center leading-tight truncate w-14 sm:w-16 md:w-auto`}>
                    {getStatusLabel(activeOrder.status)}
                  </span>
                )
              } else {
                bgColor = 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                textColor = 'text-gray-600'
                badge = <span className={`px-1.5 md:px-2.5 py-0.5 rounded-full text-[8px] md:text-[10px] font-black bg-white/95 ${textColor} shadow-sm border border-white`}>POR LIMPIAR</span>
              }
            } else {
              badge = <span className={`md:hidden text-[9px] opacity-70 font-bold ${textColor}`}>{table.capacity} p.</span>
            }

            return (
              <div
                key={table.id}
                onClick={() => openModal(<TableModal tableId={table.id} />)}
                className={`absolute w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full border-2 md:border-4 flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 shadow-md ${bgColor} ${pulseEffect}`}
                style={{ left: `${table.xP || 50}%`, top: `${table.yP || 50}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
              >
                <span className={`font-black text-sm sm:text-base md:text-xl ${textColor} leading-none mb-0.5 text-center px-1 truncate w-full`}>{table.name}</span>
                <span className={`hidden md:inline-block text-[10px] font-bold ${textColor} opacity-70 mb-1`}>{table.capacity} sillas</span>
                {badge}
                <button
                  onClick={(e) => confirmDelete(table.id, e)}
                  className="delete-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 text-xs font-bold shadow-md hover:bg-red-600 flex items-center justify-center z-10 transition-transform hover:scale-110"
                >
                  🗑️
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
