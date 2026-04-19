import useModalStore from '../../store/useModalStore'

export default function ConfirmModal({ title, message, onConfirm, danger = false }) {
  const { closeModal } = useModalStore()

  const handleConfirm = () => {
    onConfirm()
    closeModal()
  }

  return (
    <div className={`glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 ${danger ? 'border-red-300' : 'border-white'} text-center`}>
      <div className="text-5xl mb-4 drop-shadow-md">⚠️</div>
      <h3 className={`text-xl font-extrabold mb-2 ${danger ? 'text-red-600' : 'text-theme-text'}`}>{title}</h3>
      <p className="text-sm text-theme-text font-medium mb-6">{message}</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={closeModal} className="py-3 rounded-xl bg-white hover:bg-theme-beige border border-theme-beige transition font-bold text-theme-text shadow-sm">
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className={`${danger ? 'bg-red-500 hover:bg-red-600' : 'btn-primary'} text-white py-3 rounded-xl font-bold shadow-md transition`}
        >
          Confirmar
        </button>
      </div>
    </div>
  )
}
