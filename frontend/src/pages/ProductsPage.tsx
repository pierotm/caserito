import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';

type Product = {
  id: string;
  name: string;
  price: string;
  unitMeasure: 'UNIDAD' | 'KG';
  stock: string;
  isFrequent: boolean;
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unitMeasure, setUnitMeasure] = useState<'UNIDAD' | 'KG'>('UNIDAD');
  const [stock, setStock] = useState('0');

  async function loadProducts() {
    const data = await api<Product[]>('/products');
    setProducts(data);
  }

  useEffect(() => {
    loadProducts().catch(() => undefined);
  }, []);

  async function createProduct(event: FormEvent) {
    event.preventDefault();
    await api('/products', {
      method: 'POST',
      body: JSON.stringify({ name, price, unitMeasure, stock, isFrequent: false })
    });
    setName('');
    setPrice('');
    setStock('0');
    await loadProducts();
  }

  return (
    <main className="screen">
      <h2>Productos</h2>
      <form className="card" onSubmit={createProduct}>
        <h3>Nuevo producto</h3>
        <label>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Precio
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" required />
        </label>
        <label>
          Unidad
          <select value={unitMeasure} onChange={(e) => setUnitMeasure(e.target.value as 'UNIDAD' | 'KG')}>
            <option value="UNIDAD">UNIDAD</option>
            <option value="KG">KG</option>
          </select>
        </label>
        <label>
          Stock
          <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" step="0.001" required />
        </label>
        <button type="submit">Guardar producto</button>
      </form>

      <section className="card">
        <h3>Listado</h3>
        {products.map((product) => (
          <div key={product.id} className="cart-row">
            <span>{product.name} ({product.unitMeasure})</span>
            <strong>S/ {product.price} | stock: {product.stock}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}
