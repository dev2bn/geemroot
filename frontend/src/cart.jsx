import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

function load() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const add = (p, qty = 1) =>
    setItems((cur) => {
      const found = cur.find((i) => i.id === p.id)
      if (found) {
        return cur.map((i) =>
          i.id === p.id ? { ...i, quantity: Math.min(p.stock, i.quantity + qty) } : i
        )
      }
      return [
        ...cur,
        {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          image: p.image_url || '',
          stock: p.stock,
          quantity: Math.min(p.stock, qty),
        },
      ]
    })

  const setQty = (id, q) =>
    setItems((cur) =>
      cur.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(i.stock, q)) } : i))
    )

  const remove = (id) => setItems((cur) => cur.filter((i) => i.id !== id))
  const clear = () => setItems([])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}