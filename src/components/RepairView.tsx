import React, { useState, useMemo } from "react";
import { Wrench, CheckCircle, Search, ArrowRight, History as HistoryIcon, AlertTriangle } from "lucide-react";
import { Item, OperationType, User, UserRole } from "../types";

interface RepairReturnViewProps {
  items: Item[];
  mode: 'repair' | 'return';
  onUpdateStatus: (itemId: string, newStatus: string, detail: string) => Promise<void>;
  user: User;
}

export default function RepairReturnView({ items, mode, onUpdateStatus, user }: RepairReturnViewProps) {
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [obs, setObs] = useState("");

  const filteredItems = useMemo(() => {
    const targetStatus = mode === 'repair' ? 'Operativo' : 'En reparación';
    return items.filter(i => {
      const matchStatus = (i.estado || 'Operativo') === targetStatus;
      const txt = `${i.articulo} ${i.serie || ''} ${i.sucursal}`.toLowerCase();
      const matchSearch = txt.includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [items, mode, search]);

  const handleAction = async (item: Item) => {
    const newStatus = mode === 'repair' ? 'En reparación' : 'Operativo';
    const detail = mode === 'repair' 
      ? `Enviado a reparación técnico. Nota: ${obs || 'Sin detalles'}`
      : `Regresado de reparación. Nota: ${obs || 'Sin detalles'}`;

    setLoadingId(item.id);
    try {
      await onUpdateStatus(item.id, newStatus, detail);
      setObs("");
    } catch (err) {
      console.error(err);
      alert("Error al procesar la operación");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${mode === 'repair' ? 'bg-[var(--ys)] text-[var(--yellow)]' : 'bg-[var(--gs)] text-[var(--green)]'}`}>
            {mode === 'repair' ? <Wrench size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'repair' ? 'Enviar a Reparación' : 'Volver de Reparación'}
            </h2>
            <p className="text-[12px] text-[var(--txt3)]">
              {mode === 'repair' 
                ? 'Solicita asistencia técnica para un activo fuera de servicio' 
                : 'Marca como operativo un artículo retornado de soporte técnico'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6 space-y-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
          <input 
            type="text" 
            placeholder="Buscar artículo por nombre, serie o sucursal..."
            className="w-full h-12 bg-[var(--bg3)] border border-[var(--line2)] rounded-xl pl-12 pr-4 text-[14px] outline-none focus:border-[var(--accent)] transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredItems.map(item => (
            <div key={item.id} className="group p-4 bg-[var(--bg3)] border border-[var(--line2)] rounded-xl hover:border-[var(--accent)] transition-all flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-[var(--txt)] truncate">{item.articulo}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg)] text-[var(--txt3)] border border-[var(--line)] rounded font-mono">
                    {item.serie || 'S/N'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--txt3)]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    {item.sucursal}
                  </span>
                  <span>ID: {item.id.slice(-6)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {loadingId === item.id ? (
                  <div className="flex items-center gap-2 px-4 h-9 bg-[var(--bg4)] rounded-full text-[12px] text-[var(--txt3)]">
                    <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input 
                      type="text"
                      placeholder="Observaciones..."
                      className="h-9 px-3 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[12px] outline-none focus:border-[var(--accent)] w-48 hidden md:block"
                      value={loadingId === null ? obs : ""}
                      onChange={e => setObs(e.target.value)}
                    />
                    <button 
                      onClick={() => handleAction(item)}
                      className={`flex items-center gap-2 px-4 h-9 rounded-full text-[12px] font-bold transition-all ${
                        mode === 'repair' 
                          ? 'bg-[var(--yellow)] text-black hover:opacity-90' 
                          : 'bg-[var(--green)] text-black hover:opacity-90'
                      }`}
                    >
                      {mode === 'repair' ? 'Enviar' : 'Marcar Listo'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && search && (
            <div className="p-12 text-center border-2 border-dashed border-[var(--line2)] rounded-xl">
              <AlertTriangle size={32} className="mx-auto text-[var(--txt3)] mb-2 opacity-20" />
              <p className="text-[13px] text-[var(--txt3)] font-medium">No se encontraron artículos {mode === 'repair' ? 'operativos' : 'en reparación'} que coincidan con la búsqueda.</p>
            </div>
          )}
          
          {filteredItems.length === 0 && !search && (
            <div className="p-12 text-center border-2 border-dashed border-[var(--line2)] rounded-xl">
              <HistoryIcon size={32} className="mx-auto text-[var(--txt3)] mb-2 opacity-20" />
              <p className="text-[13px] text-[var(--txt3)] font-medium">No hay activos {mode === 'repair' ? 'disponibles para enviar' : 'pendientes de reparación'} en esta lista.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--rs)] border border-[rgba(239,68,68,0.1)] rounded-[var(--r2)] p-4 flex gap-3 items-start">
        <AlertTriangle size={16} className="text-[var(--red)] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[var(--txt3)] leading-relaxed">
          <strong>Aviso importante:</strong> Cambiar el estado de un activo afectará los indicadores de disponibilidad en tiempo real. 
          Asegúrese de documentar las fallas técnicas en las observaciones para mantener la trazabilidad del historial del equipo.
        </p>
      </div>
    </div>
  );
}
