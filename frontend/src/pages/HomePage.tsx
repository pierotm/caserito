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

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    api<Product[]>('/products')
      .then(setProducts)
      .catch(() => setProducts([]));
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

  return (
    <main className="screen">
      <div className="connection online">Conectado</div>
      <h2>Anotar venta</h2>
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
        <h3>Carrito actual</h3>
        {cart.length === 0 ? <p>Sin productos</p> : null}
        {cart.map((item) => (
          <div key={item.product.id} className="cart-row">
            <span>{item.product.name}</span>
            <strong>x{item.qty}</strong>
          </div>
        ))}
        <p>Total: S/ {total.toFixed(2)}</p>
        <button className="primary" disabled>
          Guardar venta (próximo paso)
        </button>
      </section>
    </main>
  );
}
