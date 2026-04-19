// ==================== STATUS HELPERS ====================
export function getStatusClass(status) {
  const classes = {
    pending: 'bg-yellow-200 text-yellow-800',
    preparing: 'bg-blue-200 text-blue-800',
    ready: 'bg-green-200 text-green-800',
    delivered: 'bg-purple-200 text-purple-800',
    cancelled: 'bg-gray-300 text-gray-800',
  }
  return classes[status] || 'bg-gray-300'
}

export function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    preparing: 'Preparando',
    ready: 'Listo',
    delivered: 'Finalizado',
    cancelled: 'Cancelado',
  }
  return labels[status] || status
}

// ==================== STOCK HELPERS ====================
export function hasEnoughStock(product, inventory) {
  if (!product.ingredients || product.ingredients.length === 0) return true
  for (const ing of product.ingredients) {
    const invItem = inventory.find(i => i.id === ing.id)
    if (!invItem || invItem.stock < ing.qty) return false
  }
  return true
}

export function canAddToCart(productId, qtyToAdd, currentCart, products, inventory) {
  const product = products.find(p => p.id === productId)
  if (!product || !product.ingredients || product.ingredients.length === 0) return { ok: true }

  const currentUsage = {}
  currentCart.forEach(cartItem => {
    const p = products.find(x => x.id === cartItem.productId)
    if (p && p.ingredients) {
      p.ingredients.forEach(ing => {
        currentUsage[ing.id] = (currentUsage[ing.id] || 0) + ing.qty * cartItem.quantity
      })
    }
  })

  for (const ing of product.ingredients) {
    const invItem = inventory.find(i => i.id === ing.id)
    if (!invItem) return { ok: false, message: `Insumo no encontrado` }

    const alreadyUsed = currentUsage[ing.id] || 0
    const newlyNeeded = ing.qty * qtyToAdd
    const totalNeeded = Number((alreadyUsed + newlyNeeded).toFixed(3))
    const available = Number(invItem.stock.toFixed(3))

    if (available < totalNeeded) {
      const remaining = Number((available - alreadyUsed).toFixed(3))
      return {
        ok: false,
        message: `Stock insuficiente de ${invItem.name}. Solo quedan ${remaining} ${invItem.unit} disponibles.`,
      }
    }
  }
  return { ok: true }
}

// ==================== DATE HELPERS ====================
export function getLocalYYYYMMDD(dateObj) {
  const d = new Date(dateObj)
  if (isNaN(d)) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getTodayLocalStr() {
  return getLocalYYYYMMDD(new Date())
}

// ==================== CART HELPERS ====================
export function calculateCartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// ==================== INVENTORY DEDUCTION ====================
export function deductInventoryForCart(cartItems, products, inventory) {
  const updatedInventory = inventory.map(item => ({ ...item }))

  cartItems.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.productId)
    if (product && product.ingredients) {
      product.ingredients.forEach(ing => {
        const invIndex = updatedInventory.findIndex(i => i.id === ing.id)
        if (invIndex !== -1) {
          updatedInventory[invIndex].stock -= ing.qty * cartItem.quantity
        }
      })
    }
  })

  return updatedInventory
}

// ==================== PRODUCT AVAILABILITY CHECK ====================
export function checkProductAvailability(products, inventory) {
  let changed = false
  const updatedProducts = products.map(product => {
    if (product.active && product.ingredients && product.ingredients.length > 0) {
      let hasStock = true
      for (const ing of product.ingredients) {
        const invItem = inventory.find(i => i.id === ing.id)
        if (!invItem || invItem.stock < ing.qty) {
          hasStock = false
          break
        }
      }
      if (!hasStock) {
        changed = true
        return { ...product, active: false }
      }
    }
    return product
  })
  return { products: updatedProducts, changed }
}

// ==================== IMAGE COMPRESSION ====================
export function compressImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 120
        let { width, height } = img
        if (width > height) {
          if (width > MAX) { height *= MAX / width; width = MAX }
        } else {
          if (height > MAX) { width *= MAX / height; height = MAX }
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.5))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ==================== WHATSAPP TICKET ====================
export function buildWhatsappTicketMessage(sale) {
  let msg = `🍕 *PIZZAMANÍA*\n`
  msg += `Ticket de Venta\n`
  msg += `Roberto Morales Muciño\n`
  msg += `MOMR7707196C1\n`
  msg += `11a. Calle Pte. No 62. C.P 30068\n`
  msg += `Comitán de Domínguez, Chis.\n`
  msg += `--------------------------------------\n`
  msg += `*Ticket #:* ${sale.orderId.toString().slice(-4)}\n`
  msg += `*Fecha:* ${new Date(sale.timestamp).toLocaleString('es-MX')}\n`
  msg += `--------------------------------------\n`

  sale.items.forEach(item => {
    msg += `▪️ ${item.quantity}x ${item.name}\n`
    if (item.note) msg += `   _(Nota: ${item.note})_\n`
    msg += `   *$${(item.price * item.quantity).toLocaleString()}*\n`
  })

  msg += `--------------------------------------\n`
  if (sale.discount > 0) {
    msg += `*Subtotal:* $${(sale.total + sale.discount).toLocaleString()}\n`
    msg += `*Descuento:* -$${sale.discount.toLocaleString()}\n`
  }
  msg += `*TOTAL A PAGAR: $${sale.total.toLocaleString()}*\n`
  msg += `--------------------------------------\n`
  msg += `*DETALLE DE PAGO:*\n`

  if (sale.paymentsBreakdown && sale.paymentsBreakdown.length > 0) {
    sale.paymentsBreakdown.forEach(p => {
      if (p.method === 'cash') {
        msg += `💵 PAGÓ CON (Efectivo): $${(p.received || p.amount).toLocaleString()}\n`
      } else {
        msg += `📱 TRANSFERENCIA: $${p.amount.toLocaleString()}\n`
      }
    })
    const last = sale.paymentsBreakdown[sale.paymentsBreakdown.length - 1]
    if (last && last.method === 'cash') {
      msg += `*SU CAMBIO: $${(last.change || 0).toLocaleString()}*\n`
    }
  }

  msg += `--------------------------------------\n`
  msg += `¡Gracias por tu preferencia! Vuelve pronto. 👋\n`
  msg += `Tel. 963-632-0837\n`
  return msg
}
