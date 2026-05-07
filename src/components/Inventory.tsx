import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Maximize2, 
  QrCode, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Item, Unit, User, UserRole } from "../types";

interface InventoryProps {
  items: Item[];
  units: Unit[];
  sucursales: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdd: () => void;
  onOpenEdit: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onOpenMove: (id: string) => void;
  onOpenQR: (id: string) => void;
  onRetire: (id: string) => void;
  user: User | null;
  externalSearch?: string;
}

export default function Inventory({ 
  items, 
  units, 
  sucursales, 
  activeTab, 
  setActiveTab, 
  onOpenAdd, 
  onOpenEdit, 
  onOpenDetail, 
  onOpenMove, 
  onOpenQR, 
  onRetire,
  user,
  externalSearch = ""
}: InventoryProps) {
  const [search, setSearch] = useState("");

  // Sync external search
  React.useEffect(() => {
    if (externalSearch) {
      setSearch(externalSearch);
    }
  }, [externalSearch]);
  const [sort, setSort] = useState("name");
  const [catFilter, setCatFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const filteredItems = useMemo(() => {
    let result = items.filter(i => {
      const tagsTxt = (i.tags || []).join(" ");
      const txt = `${i.articulo} ${i.sucursal} ${i.obs || ''} ${i.serie || ''} ${i.categoria || ''} ${tagsTxt}`.toLowerCase();
      const matchSearch = search.toLowerCase().split(/\s+/).every(t => txt.includes(t));
      const matchTab = activeTab === "Todas" || i.sucursal === activeTab;
      const matchCat = !catFilter || i.categoria === catFilter;
      const matchState = !stateFilter || (i.estado || 'Operativo') === stateFilter;
      return matchSearch && matchTab && matchCat && matchState;
    });

    result.sort((a, b) => {
      if (sort === "name") return a.articulo.localeCompare(b.articulo);
      if (sort === "qty-d") return b.cantidad - a.cantidad;
      if (sort === "qty-a") return a.cantidad - b.cantidad;
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [items, search, activeTab, catFilter, stateFilter, sort]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalUnits = units.length;
    const ops = units.filter(u => u.estado === 'Operativo').length;
    const repair = units.filter(u => u.estado === 'En reparación').length;
    return { totalItems, totalUnits, ops, repair };
  }, [items, units]);

  const categories = [
    'Computadoras', 'Monitores', 'Impresoras', 'Red y Conectividad', 
    'Cámaras', 'Periféricos', 'Servidores', 'Tablets', 'Cables e Insumos', 'Otros'
  ];

  const getBadgeClass = (state: string) => {
    switch (state) {
      case 'Operativo': return 'bg-[var(--gs)] text-[var(--green)] border-[rgba(34,197,94,0.2)]';
      case 'En reparación': return 'bg-[var(--ys)] text-[var(--yellow)] border-[rgba(245,158,11,0.2)]';
      case 'Dado de baja': return 'bg-[var(--rs)] text-[var(--red)] border-[rgba(239,68,68,0.2)]';
      case 'Reservado': return 'bg-[var(--bs)] text-[var(--blue)] border-[rgba(59,130,246,0.2)]';
      default: return 'bg-[var(--bg4)] text-[var(--txt3)] border-[var(--line2)]';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Artículos únicos', value: stats.totalItems, sub: `${stats.totalUnits} unidades fís.`, color: 'text-[var(--txt)]' },
          { label: 'Operativas', value: stats.ops, sub: `${Math.round((stats.ops/stats.totalUnits)*100) || 0}% del total`, color: 'text-[var(--green)]' },
          { label: 'En reparación', value: stats.repair, sub: 'Fuera de servicio', color: 'text-[var(--yellow)]' },
          { label: 'Sucursales', value: sucursales.length, sub: 'Activas', color: 'text-[var(--accent)]' },
          { label: 'Unidades Totales', value: stats.totalUnits, sub: 'Activos físicos', color: 'text-[var(--txt)]' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r2)] p-4 hover:border-[var(--line2)] transition-all">
            <div className="text-[10px] text-[var(--txt3)] uppercase tracking-widest font-medium mb-2">{kpi.label}</div>
            <div className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] text-[var(--txt3)] mt-1 flex items-center gap-1.5 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--line)] overflow-x-auto no-scrollbar">
        {['Todas', ...sucursales].map(tab => {
          const count = tab === "Todas" ? items.length : items.filter(i => i.sucursal === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[13px] border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab 
                  ? "text-[var(--accent)] border-[var(--accent)] font-medium" 
                  : "text-[var(--txt3)] border-transparent hover:text-[var(--txt2)]"
              }`}
            >
              {tab}
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                activeTab === tab ? "bg-[var(--as)] text-[var(--accent)]" : "bg-[var(--bg3)] text-[var(--txt3)]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt3)]" size={16} />
          <input 
            type="text" 
            placeholder="Buscar artículo, código..." 
            className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-full pl-10 pr-4 text-[13px] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ag)] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <select 
            className="h-9 px-3 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] outline-none"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">A → Z</option>
            <option value="qty-d">Mayor stock</option>
            <option value="qty-a">Menor stock</option>
            <option value="recent">Más reciente</option>
          </select>
          <select 
            className="h-9 px-3 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] outline-none"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select 
            className="h-9 px-3 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] outline-none"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option>Operativo</option>
            <option>En reparación</option>
            <option>Dado de baja</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg3)] text-[10px] uppercase tracking-widest text-[var(--txt3)] font-bold border-b border-[var(--line)]">
                <th className="px-5 py-3">Artículo</th>
                <th className="px-5 py-3">Sucursal</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Observaciones</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-[var(--bg3)] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-medium text-[var(--txt)]">{item.articulo}</div>
                    <div className="text-[10px] text-[var(--txt3)] font-mono mt-0.5 tracking-tight">
                      SOL-{String(item.id).padStart(6, '0')} {item.serie && `· ${item.serie}`}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.map(t => (
                          <span key={t} className="text-[8px] px-1.5 py-0.5 bg-[var(--bg4)] text-[var(--txt2)] border border-[var(--line2)] rounded-md font-bold uppercase tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-[var(--as)] text-[var(--accent)] border border-[rgba(99,102,241,0.2)]">
                      {item.sucursal}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                       <span className="qty-chip">{item.cantidad}</span>
                       {item.minStock !== undefined && item.cantidad <= item.minStock && (
                         <div className="group/alert relative">
                           <AlertCircle size={14} className="text-[var(--red)] animate-pulse" />
                           <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-[var(--bg4)] border border-[var(--red)]/20 text-[9px] text-[var(--txt)] rounded whitespace-nowrap opacity-0 group-hover/alert:opacity-100 transition-opacity">
                             Stock bajo (Mín: {item.minStock})
                           </div>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${getBadgeClass(item.estado || 'Operativo')}`}>
                      {item.estado || 'Operativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-[12px] text-[var(--txt3)] max-w-[200px] truncate" title={item.obs}>
                      {item.obs || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onOpenDetail(item.id)} className="p-1.5 text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg4)] rounded-md transition-colors" title="Detalle"><Maximize2 size={14} /></button>
                      <button onClick={() => onOpenQR(item.id)} className="p-1.5 text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg4)] rounded-md transition-colors" title="QR"><QrCode size={14} /></button>
                      
                      {(user?.role === UserRole.ADMIN || user?.role === UserRole.TECNICO) && (
                        <>
                          <button onClick={() => onOpenMove(item.id)} className="p-1.5 text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg4)] rounded-md transition-colors" title="Mover"><ArrowRightLeft size={14} /></button>
                          <button onClick={() => onOpenEdit(item.id)} className="p-1.5 text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg4)] rounded-md transition-colors" title="Editar"><Edit3 size={14} /></button>
                        </>
                      )}
                      
                      {user?.role === UserRole.ADMIN && (
                        <button onClick={() => onRetire(item.id)} className="p-1.5 text-[var(--txt3)] hover:text-[var(--red)] hover:bg-[var(--rs)] rounded-md transition-colors" title="Dar de baja"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="p-20 text-center space-y-3">
              <div className="text-4xl opacity-20">▦</div>
              <div className="text-[13px] text-[var(--txt3)]">No se encontraron artículos para esta búsqueda</div>
              <button 
                onClick={() => { setSearch(""); setCatFilter(""); setStateFilter(""); setActiveTab("Todas"); }}
                className="text-[var(--accent)] text-[12px] font-medium hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
        
        <div className="px-5 py-3 bg-[var(--bg3)] border-t border-[var(--line)] text-[11px] text-[var(--txt3)] font-medium tracking-tight">
          Mostrando {filteredItems.length} artículos · {filteredItems.reduce((a,i) => a + i.cantidad, 0)} unidades totales
        </div>
      </div>
    </div>
  );
}
