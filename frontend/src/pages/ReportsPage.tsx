import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

type MonthlyReport = {
  month: string;
  totalSold: number;
  totalUnits: number;
  totalKg: number;
  topProduct: { name: string; quantity: number; type: 'UNIDAD' | 'KG' } | null;
  voidedSales: number;
};

type Sale = {
  id: string;
  total: string;
  status: 'COMPLETED' | 'VOIDED';
  date: string;
};

export function ReportsPage() {
  const initialMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  async function load() {
    const [reportData, salesData] = await Promise.all([
      api<MonthlyReport>(`/reports/monthly?month=${month}`),
      api<Sale[]>(`/sales?month=${month}`)
    ]);
    setReport(reportData);
    setSales(salesData);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [month]);

  async function voidSale(id: string) {
    await api(`/sales/${id}/void`, { method: 'POST' });
    await load();
  }

  return (
    <main className="screen">
      <h2>Reporte mensual</h2>
      <section className="card">
        <label>
          Mes
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <p>Total vendido: <strong>S/ {report?.totalSold.toFixed(2) ?? '0.00'}</strong></p>
        <p>Unidades vendidas: <strong>{report?.totalUnits ?? 0}</strong></p>
        <p>Kg vendidos: <strong>{report?.totalKg ?? 0}</strong></p>
        <p>Producto top: <strong>{report?.topProduct ? `${report.topProduct.name} (${report.topProduct.quantity})` : '-'}</strong></p>
        <p>Ventas anuladas: <strong>{report?.voidedSales ?? 0}</strong></p>
      </section>

      <section className="card">
        <h3>Ventas del mes</h3>
        {sales.map((sale) => (
          <div key={sale.id} className="sale-row">
            <span>{new Date(sale.date).toLocaleDateString()} - S/ {sale.total}</span>
            {sale.status === 'VOIDED' ? (
              <strong>Anulada</strong>
            ) : (
              <button onClick={() => voidSale(sale.id)}>Anular</button>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
