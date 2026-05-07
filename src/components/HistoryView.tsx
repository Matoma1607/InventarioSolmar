import React, { useState, useMemo } from "react";
import { HistoryEntry, OperationType } from "../types";
import { Search, Download, Clock, MapPin, User, FileText } from "lucide-react";

interface HistoryViewProps {
  history: HistoryEntry[];
  sucursales: string[];
}

export default function HistoryView({ history, sucursales }: HistoryViewProps) {
  const [sucFilter, setSucFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  const filteredHistory = useMemo(() => {
    return history.filter(ev => 
      (!sucFilter || ev.sucursal === sucFilter) &&
      (!typeFilter || ev.tipo === typeFilter) &&
      (!userFilter || ev.usuario === userFilter)
    );
  }, [history, sucFilter, typeFilter, userFilter]);

  const authors = useMemo(() => {
    return [...new Set(history.map(h => h.usuario).filter(Boolean))].sort();
  }, [history]);

  const getEventStyle = (tipo: OperationType) => {
    switch (tipo) {
      case OperationType.ALTA: return { ic: "＋", cls: "bg-[var(--gs)] text-[var(--green)] border-[rgba(34,197,94,0.25)]" };
      case OperationType.MOVIMIENTO: return { ic: "⇄", cls: "bg-[var(--bs)] text-[var(--blue)] border-[rgba(59,130,246,0.25)]" };
      case OperationType.REEMPLAZO: return { ic: "⟳", cls: "bg-[var(--ys)] text-[var(--yellow)] border-[rgba(245,158,11,0.25)]" };
      case OperationType.REPARACION: return { ic: "⚙", cls: "bg-[var(--os)] text-[var(--orange)] border-[rgba(249,115,22,0.25)]" };
      case OperationType.BAJA: return { ic: "✕", cls: "bg-[var(--rs)] text-[var(--red)] border-[rgba(239,68,68,0.25)]" };
      default: return { ic: "✎", cls: "bg-[var(--bg4)] text-[var(--txt3)] border-[var(--line2)]" };
    }
  };

  const fmtTs = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' ' + 
           d.toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
  };

  const exportCSV = () => {
    const rows = [['Fecha', 'Tipo', 'Artículo', 'Sucursal', 'Usuario', 'Detalle']];
    filteredHistory.forEach(ev => rows.push([
      fmtTs(ev.ts), ev.tipo, ev.item_nombre, ev.sucursal,
      ev.usuario || 'Sistema', ev.detalle
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <select 
          className="h-9 px-3 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] outline-none"
          value={sucFilter}
          onChange={(e) => setSucFilter(e.target.value)}
        >
          <option value="">Todas las sucursales</option>
          {sucursales.sort().map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          className="h-9 px-3 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] outline-none"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Todos los eventos</option>
          {Object.values(OperationType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select 
          className="h-9 px-3 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] outline-none"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">Todos los usuarios</option>
          {authors.map(u => <option key={u} value={u}>{u}</option>)}
        </select>

        <span className="text-[11px] text-[var(--txt3)] font-mono flex-1 text-right">
          {filteredHistory.length} eventos registrados
        </span>

        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 h-9 bg-[var(--bg3)] hover:bg-[var(--bg4)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] transition-all"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-6 space-y-0">
        {filteredHistory.length === 0 ? (
          <div className="py-20 text-center space-y-2 opacity-30">
            <Clock size={32} className="mx-auto" />
            <div className="text-[13px]">Sin eventos registrados para esta selección</div>
          </div>
        ) : (
          filteredHistory.map((ev, idx) => {
            const style = getEventStyle(ev.tipo);
            const isLast = idx === filteredHistory.length - 1;
            return (
              <div key={ev.id} className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0 w-8">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[12px] z-10 ${style.cls}`}>
                    {style.ic}
                  </div>
                  {!isLast && <div className="w-[1px] flex-1 bg-[var(--line)] my-1" />}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-[var(--txt)]">{ev.tipo}</span>
                    <span className="text-[13px] text-[var(--txt3)]">·</span>
                    <span className="text-[13px] text-[var(--txt2)] font-medium">{ev.item_nombre}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[11px] text-[var(--txt3)] mb-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {fmtTs(ev.ts)}</span>
                    {ev.sucursal && <span className="flex items-center gap-1"><MapPin size={12} /> {ev.sucursal}</span>}
                    {ev.usuario && (
                      <span className="flex items-center gap-1 bg-[var(--as)] text-[var(--accent)] px-1.5 py-0.5 rounded">
                        <User size={10} /> {ev.usuario}
                      </span>
                    )}
                  </div>
                  {ev.detalle && (
                    <div className="p-3 bg-[var(--bg3)] border border-[var(--line)] rounded-[var(--r)] text-[12px] text-[var(--txt2)] leading-relaxed flex gap-2">
                       <FileText size={14} className="flex-shrink-0 mt-0.5 opacity-40" />
                       {ev.detalle}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
