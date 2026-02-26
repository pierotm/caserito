import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

type Product = {
  id: string;
  name: string;
  price: string;
  stock: string;
  isFrequent: boolean;
};

type CartItem = {
  product: Product;
  qty: number;
};

function generateClientSaleId() {
  return crypto.randomUUID();
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState('');

  async function loadProducts() {
    const data = await api<Product[]>('/products');
    setProducts(data);
  }

  useEffect(() => {
    loadProducts().catch(() => setProducts([]));
  }, []);

  const total = useMemo(
    () => cart.reduce((acc, item) => acc + Number(item.product.price) * item.qty, 0),
    [cart]
  );

  function addProduct(product: Product) {
    setCart((prev) => {
      const current = prev.find((item) => item.product.id === product.id);
      if (current) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  }

  async function saveSale() {
    if (!cart.length) return;

    await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        clientSaleId: generateClientSaleId(),
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.qty, packApplied: false }))
      })
    });

    setCart([]);
    setMessage('Venta guardada correctamente');
    await loadProducts();
  }

  return (
    <main className="screen">
      <div className="connection online">Conectado</div>
      <h2>Anotar venta</h2>
      {message ? <p className="success">{message}</p> : null}
      <section className="card">
        <h3>Productos frecuentes</h3>
        <div className="grid">
          {products
            .filter((p) => p.isFrequent)
            .slice(0, 8)
            .map((product) => (
              <button key={product.id} onClick={() => addProduct(product)}>
                {product.name}
              </button>
            ))}
        </div>
      </section>

      <section className="card">
        <h3>Otros productos</h3>
        <div className="grid">
          {products
            .filter((p) => !p.isFrequent)
            .slice(0, 6)
            .map((product) => (
              <button key={product.id} onClick={() => addProduct(product)}>
                {product.name}
              </button>
            ))}
        </div>
      </section>

      <section className="card">
        <h3>Carrito actual</h3>
        {cart.length === 0 ? <p>Sin productos</p> : null}
        {cart.map((item) => (
          <div key={item.product.id} className="sale-row">
            <span>{item.product.name}</span>
            <div className="qty-controls">
              <button onClick={() => updateQty(item.product.id, -1)}>-</button>
              <strong>{item.qty}</strong>
              <button onClick={() => updateQty(item.product.id, 1)}>+</button>
            </div>
          </div>
        ))}
        <p>Total: S/ {total.toFixed(2)}</p>
        <button className="primary" onClick={saveSale} disabled={!cart.length}>
          Guardar venta
        </button>
      </section>
    </main>
  );
}
