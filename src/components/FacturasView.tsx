import React, { useMemo } from "react";
import { Item } from "../types";
import { FileText, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";

interface InvoicesViewProps {
  items: Item[];
  onOpenEdit: (id: string) => void;
}

export default function InvoicesView({ items, onOpenEdit }: InvoicesViewProps) {
  const stats = useMemo(() => {
    const withInv = items.filter(i => i.factura).length;
    const withoutInv = items.length - withInv;
    const totalValue = items.reduce((acc, i) => acc + (i.monto || 0), 0);
    return { withInv, withoutInv, totalValue };
  }, [items]);

  const itemsWithInvoice = items.filter(i => i.factura);
  const itemsWithoutInvoice = items.filter(i => !i.factura);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold tracking-tight">Repositorio de Facturas Digitales</h2>
         <div className="flex gap-4">
            <div className="text-right">
              <div className="text-[10px] text-[var(--txt3)] uppercase tracking-wider font-bold">Inversión Total</div>
              <div className="text-lg font-bold font-mono text-[var(--accent)]">${stats.totalValue.toLocaleString()}</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Lista con Factura */}
         <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-[var(--green)]" />
                <div className="text-[14px] font-semibold">Artículos con Factura</div>
              </div>
              <span className="bg-[var(--gs)] text-[var(--green)] px-2 py-0.5 rounded text-[10px] font-bold">{stats.withInv}</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
              {itemsWithInvoice.map(item => (
                <div key={item.id} className="p-3 bg-[var(--bg3)] rounded-[var(--r)] border border-[var(--line2)] flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-[var(--txt)] truncate">{item.articulo}</div>
                    <div className="text-[10px] text-[var(--txt3)] font-mono">${item.monto || 0} · {item.fecha_compra || 'Sin fecha'}</div>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={item.factura} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 text-[var(--accent)] hover:bg-[var(--as)] rounded transition-colors"
                      title="Ver PDF"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
              {itemsWithInvoice.length === 0 && (
                <div className="py-10 text-center text-[var(--txt3)] text-[12px] italic">No hay facturas cargadas.</div>
              )}
            </div>
         </div>

         {/* Pendientes */}
         <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-[var(--red)]" />
                <div className="text-[14px] font-semibold">Pendientes de Carga</div>
              </div>
              <span className="bg-[var(--rs)] text-[var(--red)] px-2 py-0.5 rounded text-[10px] font-bold">{stats.withoutInv}</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
              {itemsWithoutInvoice.map(item => (
                <div key={item.id} className="p-3 bg-[var(--bg3)] rounded-[var(--r)] border border-[var(--line2)] flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-[var(--txt)] truncate">{item.articulo}</div>
                    <div className="text-[10px] text-[var(--txt3)] uppercase tracking-tighter">SOL-{String(item.id).padStart(6, '0')}</div>
                  </div>
                  <button 
                    onClick={() => onOpenEdit(item.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-[var(--bg4)] hover:bg-[var(--as)] text-[var(--txt2)] hover:text-[var(--accent)] text-[10px] font-bold rounded border border-[var(--line2)] transition-all"
                  >
                    Adjuntar
                  </button>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
}
