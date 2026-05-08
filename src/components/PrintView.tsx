import React, { useState, useMemo } from "react";
import { Printer, Search, CheckSquare, Square, Download, ExternalLink, QrCode } from "lucide-react";
import { Item } from "../types";

interface PrintViewProps {
  items: Item[];
}

export default function PrintView({ items }: PrintViewProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      `${i.articulo} ${i.serie || ''} ${i.sucursal}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handlePrint = () => {
    if (selectedIds.size === 0) return;
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--bs)] text-[var(--blue)] rounded-2xl">
            <Printer size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Impresión de Etiquetas QR</h2>
            <p className="text-[12px] text-[var(--txt3)]">Seleccione los artículos para generar sus códigos identificadores</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={selectAll}
            className="h-9 px-4 bg-[var(--bg3)] border border-[var(--line2)] rounded-full text-[12px] font-medium hover:bg-[var(--bg4)] transition-all"
          >
            {selectedIds.size === filteredItems.length ? 'Desmarcar todo' : 'Seleccionar todo'}
          </button>
          <button 
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className="h-9 px-6 bg-[var(--accent)] text-white rounded-full text-[12px] font-bold shadow-lg shadow-[var(--ag)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimir ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
          <input 
            type="text" 
            placeholder="Filtrar por nombre, serie, sucursal..."
            className="w-full h-12 bg-[var(--bg3)] border border-[var(--line2)] rounded-xl pl-12 pr-4 text-[14px] outline-none focus:border-[var(--accent)] transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar content-start">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-4 ${
                selectedIds.has(item.id) 
                  ? 'bg-[var(--as)] border-[var(--accent)]' 
                  : 'bg-[var(--bg3)] border-[var(--line2)] hover:border-[var(--line3)]'
              }`}
            >
              <div className="shrink-0 scale-90 origin-top-left">
                <div className="w-16 h-16 bg-white p-1 rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`SOL-${item.id}`)}`}
                    alt="QR"
                    className="w-full h-full"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="text-[13px] font-bold text-[var(--txt)] truncate leading-tight">{item.articulo}</div>
                  <div className="text-[10px] text-[var(--txt3)] font-mono mt-1">SOL-{item.id.slice(-6)}</div>
                  <div className="text-[10px] text-[var(--accent)] mt-1 font-medium">{item.sucursal}</div>
                </div>
                <div className="self-end text-[var(--accent)]">
                   {selectedIds.has(item.id) ? <CheckSquare size={18} /> : <Square size={18} className="opacity-20" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="print:block hidden">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
            .no-print { display: none !important; }
          }
        `}</style>
        <div className="print-area">
          {items.filter(i => selectedIds.has(i.id)).map(item => (
            <div key={item.id} className="border border-black p-4 flex flex-col items-center text-black bg-white rounded-md">
               <div className="text-[10px] font-bold mb-1 uppercase tracking-tighter">Solmar Asset Manager</div>
               <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`SOL-${item.id}`)}`}
                  alt="QR"
                  className="w-32 h-32"
               />
               <div className="text-[12px] font-bold mt-2">{item.articulo}</div>
               <div className="text-[10px] font-mono mt-0.5">ID: SOL-{item.id.slice(-6)}</div>
               <div className="text-[8px] mt-1 opacity-60">SUCURSAL: {item.sucursal}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
