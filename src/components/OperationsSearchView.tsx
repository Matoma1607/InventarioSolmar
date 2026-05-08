import React, { useState, useMemo } from "react";
import { Search, ArrowRightLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Item } from "../types";

interface OperationsSearchViewProps {
  items: Item[];
  mode: 'move' | 'replace';
  onAction: (item: Item) => void;
}

export default function OperationsSearchView({ items, mode, onAction }: OperationsSearchViewProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      `${i.articulo} ${i.serie || ''} ${i.sucursal}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-2xl ${mode === 'move' ? 'bg-[var(--bs)] text-[var(--blue)]' : 'bg-[var(--ps)] text-[var(--purple)]'}`}>
          {mode === 'move' ? <ArrowRightLeft size={24} /> : <RefreshCw size={24} />}
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {mode === 'move' ? 'Seleccionar Artículo para Mover' : 'Seleccionar Artículo para Reemplazo'}
          </h2>
          <p className="text-[12px] text-[var(--txt3)]">
            Busque el activo en el inventario para iniciar la operación
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, serie o sucursal..."
            className="w-full h-12 bg-[var(--bg3)] border border-[var(--line2)] rounded-xl pl-12 pr-4 text-[14px] outline-none focus:border-[var(--accent)] transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredItems.map(item => (
            <button 
              key={item.id}
              onClick={() => onAction(item)}
              className="w-full group p-4 bg-[var(--bg3)] border border-[var(--line2)] rounded-xl hover:border-[var(--accent)] hover:bg-[var(--bg4)] transition-all flex items-center justify-between text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] text-[var(--txt)] flex items-center gap-2">
                  {item.articulo}
                  <span className="text-[10px] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--line)] font-mono text-[var(--txt3)] font-normal">
                    {item.serie || 'S/N'}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--txt3)] mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    {item.sucursal}
                  </span>
                  <span>Stock: {item.cantidad}</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${mode === 'move' ? 'bg-[var(--as)] text-[var(--accent)]' : 'bg-[var(--ps)] text-[var(--purple)]'}`}>
                {mode === 'move' ? <ArrowRightLeft size={18} /> : <RefreshCw size={18} />}
              </div>
            </button>
          ))}

          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-[var(--txt3)]">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-[13px]">No se encontraron artículos que coincidan con su búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
