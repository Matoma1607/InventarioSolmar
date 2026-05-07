import React, { useMemo } from "react";
import { Item, HistoryEntry, Unit, OperationType } from "../types";
import { 
  BarChart3, TrendingUp, Package, ShieldCheck, Wrench, MapPin, 
  AlertTriangle, Download, PieChart as PieChartIcon, FileText 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';

interface ReportsViewProps {
  items: Item[];
  units: Unit[];
  history: HistoryEntry[];
  sucursales: string[];
}

const COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#fb923c', '#fb7171', '#4ade80'];

export default function ReportsView({ items, units, history, sucursales }: ReportsViewProps) {
  const stats = useMemo(() => {
    const bySuc: Record<string, number> = {};
    const byCat: Record<string, number> = {};
    
    sucursales.forEach(s => { bySuc[s] = 0; });
    items.forEach(i => {
      bySuc[i.sucursal] = (bySuc[i.sucursal] || 0) + i.cantidad;
      const cat = i.categoria || 'Otros';
      byCat[cat] = (byCat[cat] || 0) + i.cantidad;
    });

    const totalItems = items.length;
    const totalUnits = units.length;
    const ops = units.filter(u => u.estado === 'Operativo').length;
    const repairs = units.filter(u => u.estado === 'En reparación').length;

    const lowStockItems = items.filter(i => i.minStock !== undefined && i.cantidad <= i.minStock);

    // Chart Data
    const chartCatData = Object.entries(byCat).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const chartSucData = Object.entries(bySuc).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 branches

    return { bySuc, byCat, totalItems, totalUnits, ops, repairs, lowStockItems, chartCatData, chartSucData };
  }, [items, units, sucursales]);

  const recentActivity = useMemo(() => {
    return history.filter(h => [OperationType.MOVIMIENTO, OperationType.REEMPLAZO, OperationType.REPARACION].includes(h.tipo)).slice(0, 6);
  }, [history]);

  const exportToCSV = () => {
    const headers = ["ID", "Artículo", "Sucursal", "Cantidad", "Categoría", "Estado", "Mínimo", "Etiquetas"];
    const rows = items.map(i => [
      i.id,
      i.articulo,
      i.sucursal,
      i.cantidad,
      i.categoria,
      i.estado,
      i.minStock || 0,
      (i.tags || []).join(";")
    ]);

    const content = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_solmar_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pct = (a: number, b: number) => b ? Math.round((a / b) * 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight px-1">Dashboard Analítico</h2>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 h-9 bg-[var(--bg3)] hover:bg-[var(--bg4)] border border-[var(--line2)] rounded-full text-[12px] font-medium transition-all"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Artículos', value: stats.totalItems, sub: 'Catálogo IT', icon: <Package size={14} />, color: 'text-[var(--txt)]' },
          { label: 'Unidades Físicas', value: stats.totalUnits, sub: 'Activos totales', icon: <TrendingUp size={14} />, color: 'text-[var(--blue)]' },
          { label: 'Operativos', value: stats.ops, sub: `${pct(stats.ops, stats.totalUnits)}% del stock`, icon: <ShieldCheck size={14} />, color: 'text-[var(--green)]' },
          { label: 'En Reparación', value: stats.repairs, sub: 'Service técnico', icon: <Wrench size={14} />, color: 'text-[var(--yellow)]' },
          { label: 'Alertas Stock', value: stats.lowStockItems.length, sub: 'Bajo stock mínimo', icon: <AlertTriangle size={14} />, color: stats.lowStockItems.length > 0 ? 'text-[var(--red)]' : 'text-[var(--txt3)]' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r2)] p-4 group hover:border-[var(--line2)] transition-colors">
            <div className="flex items-center justify-between mb-2 opacity-50">
              <div className="text-[10px] uppercase tracking-widest font-bold">{kpi.label}</div>
              {kpi.icon}
            </div>
            <div className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] text-[var(--txt3)] mt-1 font-medium">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-1 bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[var(--red)]" />
              <div className="text-[14px] font-semibold">Alertas de Stock</div>
            </div>
          </div>
          <div className="space-y-3">
            {stats.lowStockItems.map(item => (
              <div key={item.id} className="p-3 bg-[var(--rs)] border border-[var(--red)]/10 rounded-[var(--r)] flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-[var(--txt)]">{item.articulo}</div>
                  <div className="text-[10px] text-[var(--txt3)] mt-0.5">{item.sucursal}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-mono font-bold text-[var(--red)]">{item.cantidad} / {item.minStock}</div>
                  <div className="text-[9px] uppercase tracking-tighter opacity-50 font-bold">Restante</div>
                </div>
              </div>
            ))}
            {stats.lowStockItems.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <ShieldCheck size={24} className="text-[var(--green)] opacity-20" />
                <span className="text-[12px] text-[var(--txt3)]">Todo el stock está niveles óptimos</span>
              </div>
            )}
          </div>
        </div>

        {/* Categories Chart */}
        <div className="lg:col-span-1 bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={18} className="text-[var(--blue)]" />
            <div className="text-[14px] font-semibold">Distribución por Categoría</div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartCatData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartCatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branches Chart */}
        <div className="lg:col-span-1 bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={18} className="text-[var(--accent)]" />
            <div className="text-[14px] font-semibold">Carga por Sucursal (Top 8)</div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartSucData} layout="vertical" margin={{ left: 0, right: 30 }}>
                <YAxis dataKey="name" type="category" hide />
                <XAxis type="number" hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.chartSucData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--accent)`} opacity={1 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
               {stats.chartSucData.slice(0, 5).map((suc, idx) => (
                 <div key={idx} className="flex justify-between items-center text-[10px]">
                   <span className="text-[var(--txt3)] truncate pr-4">{suc.name}</span>
                   <span className="font-mono font-bold text-[var(--txt2)]">{suc.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--green)]" />
            <div className="text-[14px] font-semibold">Flujo de Activos Reciente</div>
          </div>
          <div className="text-[11px] text-[var(--txt3)] font-mono">Últimas 6 operaciones críticas</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentActivity.map(ev => (
            <div key={ev.id} className="p-4 bg-[var(--bg3)] border border-[var(--line)] rounded-[var(--r2)] hover:border-[var(--line2)] transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  ev.tipo === OperationType.MOVIMIENTO ? 'bg-[var(--bs)] text-[var(--blue)]' :
                  ev.tipo === OperationType.REPARACION ? 'bg-[var(--os)] text-[var(--orange)]' :
                  'bg-[var(--ys)] text-[var(--yellow)]'
                 }`}>
                  {ev.tipo}
                </span>
                <span className="text-[9px] text-[var(--txt3)] font-mono">{new Date(ev.ts).toLocaleDateString()}</span>
              </div>
              <div className="text-[13px] font-medium text-[var(--txt)] line-clamp-1">{ev.item_nombre}</div>
              <div className="text-[11px] text-[var(--txt3)] mt-2 line-clamp-2 leading-relaxed h-[32px]">{ev.detalle}</div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--line)] text-[10px] text-[var(--txt3)]">
                 <FileText size={12} />
                 <span className="capitalize">{ev.usuario}</span>
                 <span className="mx-1 opacity-30">|</span>
                 <span className="truncate">{ev.sucursal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
