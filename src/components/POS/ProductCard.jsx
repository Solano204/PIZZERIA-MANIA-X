import { hasEnoughStock } from '../../lib/helpers'
import useAppStore from '../../store/useAppStore'

export default function ProductCard({ product, onClick }) {
  const { state } = useAppStore()
  const available = hasEnoughStock(product, state.inventory || [])
  const catObj = (state.productCategories || []).find(c => c.id === product.category)
  const defaultIcon = catObj ? catObj.icon : '🍽️'

  const priceDisplay = product.sizes && product.sizes.length > 0
    ? (
      <p className={`${!available ? 'text-red-600' : 'text-[#F3A70D]'} font-extrabold text-sm shrink-0 leading-none mt-1 mb-1`}>
        <span className="text-[9px] text-theme-textMuted uppercase block mb-0.5">Desde</span>
        ${Math.min(...product.sizes.map(s => s.price))}
      </p>
    )
    : <p className={`${!available ? 'text-red-600' : 'text-[#F3A70D]'} font-extrabold text-base shrink-0 leading-none mt-1 mb-1`}>${product.price}</p>

  return (
    <div
      onClick={available ? onClick : undefined}
      className={`bg-white/80 rounded-xl pt-3 px-2 pb-3 md:pt-4 md:px-3 md:pb-4 flex flex-col items-center text-center relative overflow-hidden transition-all shadow-sm border-2 h-full min-h-[145px] md:min-h-[155px]
        ${available ? 'cursor-pointer card-hover hover:border-theme-green border-transparent' : 'cursor-not-allowed opacity-70 border-red-300 bg-red-50'}`}
    >
      {!available && <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-[9px] font-extrabold py-0.5 tracking-wider z-10">AGOTADO</div>}
      <div className="mt-1 shrink-0">
        {product.image
          ? <img src={product.image} className={`w-14 h-14 md:w-16 md:h-16 object-cover rounded-xl mb-1 shadow-sm shrink-0 ${!available ? 'grayscale opacity-50' : ''}`} alt={product.name} />
          : <div className={`text-4xl md:text-5xl mb-1 drop-shadow-sm shrink-0 ${!available ? 'grayscale opacity-50' : ''}`}>{product.icon || defaultIcon}</div>
        }
      </div>
      <div className="flex flex-col flex-1 justify-between w-full mt-1">
        <h4 className={`font-bold text-[11px] md:text-xs leading-tight flex-1 flex items-center justify-center ${!available ? 'text-red-800' : 'text-theme-text'} line-clamp-2 my-1 px-1`}>{product.name}</h4>
        {priceDisplay}
      </div>
    </div>
  )
}
