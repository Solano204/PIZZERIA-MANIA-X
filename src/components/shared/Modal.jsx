import useModalStore from '../../store/useModalStore'

export default function ModalContainer() {
  const { modal, closeModal } = useModalStore()
  if (!modal) return null

  return (
    <div
      className="fixed inset-0 bg-[#4A504A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      {modal.component}
    </div>
  )
}

export function ModalWrapper({ children, className = '' }) {
  return (
    <div
      className={`glass bg-white/90 rounded-3xl p-6 w-[95%] max-w-md animate-slideIn shadow-2xl border-2 border-white ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
