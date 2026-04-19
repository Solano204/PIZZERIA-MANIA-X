import useToastStore from '../../store/useToastStore'

const COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
}
const ICONS = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`${COLORS[toast.type]} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-medium cursor-pointer animate-slideIn`}
        >
          <span>{ICONS[toast.type]}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
