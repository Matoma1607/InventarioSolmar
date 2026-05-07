import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Item, OperationType } from "../types";
import { ArrowRightLeft, AlertTriangle } from "lucide-react";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (itemId: string, sucursalOrigen: string, sucursalDestino: string, cantidad: number, obs: string) => Promise<void>;
  item: Item | null;
  sucursales: string[];
}

export default function MoveModal({ isOpen, onClose, onMove, item, sucursales }: MoveModalProps) {
  const [destino, setDestino] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item && sucursales.length > 0) {
      // Pick first branch that isn't the current one
      const other = sucursales.find(s => s !== item.sucursal) || sucursales[0];
      setDestino(other);
      setCantidad(1);
      setObs("");
    }
    setError("");
  }, [item, sucursales, isOpen]);

  const handleSubmit = async () => {
    if (!item) return;
    if (cantidad > item.cantidad) {
      setError("La cantidad excede el stock disponible");
      return;
    }
    if (destino === item.sucursal) {
      setError("La sucursal de destino debe ser diferente a la origen");
      return;
    }

    setLoading(true);
    try {
      await onMove(item.id, item.sucursal, destino, cantidad, obs);
      onClose();
    } catch (err) {
      setError("Error al realizar el movimiento");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mover Activos"
      subtitle={`Traslado de ${item.articulo}`}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-[12px] font-medium text-[var(--txt3)] hover:text-[var(--txt)] transition-colors">Cancelar</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-white text-[12px] font-semibold rounded-full disabled:opacity-50 transition-all font-mono tracking-tight"
          >
            {loading ? "PROCESANDO..." : <><ArrowRightLeft size={16} /> CONFIRMAR TRASLADO</>}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-[var(--rs)] border border-[var(--red)]/20 rounded-[var(--r)] text-[var(--red)] text-[12px]">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="p-4 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r2)] flex items-center justify-between gap-6">
          <div className="flex-1 text-center">
            <div className="text-[10px] text-[var(--txt3)] uppercase font-bold mb-1">Origen</div>
            <div className="text-[14px] font-bold text-[var(--accent)]">{item.sucursal}</div>
            <div className="text-[11px] text-[var(--txt3)] mt-1 font-mono">Stock: {item.cantidad}</div>
          </div>
          <ArrowRightLeft className="text-[var(--line3)]" size={24} />
          <div className="flex-1 text-center">
            <div className="text-[10px] text-[var(--txt3)] uppercase font-bold mb-1">Destino</div>
            <select 
              className="w-full bg-transparent text-[14px] font-bold text-center outline-none focus:text-[var(--txt)]"
              value={destino}
              onChange={e => setDestino(e.target.value)}
            >
              {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="w-full h-0.5 bg-[var(--line2)] mt-1"></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Cantidad</label>
            <input 
              type="number" 
              min="1" 
              max={item.cantidad}
              className="w-full h-11 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-center text-[16px] font-bold outline-none focus:border-[var(--accent)]"
              value={cantidad}
              onChange={e => setCantidad(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Nota de Movimiento</label>
            <input 
              type="text" 
              className="w-full h-11 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)]"
              placeholder="Ej: Requerimiento de mantenimiento"
              value={obs}
              onChange={e => setObs(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 bg-[var(--as)] border border-[rgba(99,102,241,0.2)] rounded-[var(--r2)]">
          <div className="text-[11px] text-[var(--txt2)] leading-relaxed italic">
            * Al confirmar, se restarán {cantidad} unidades de <b>{item.sucursal}</b> y se sumarán (o se creará un nuevo registro) en <b>{destino}</b>. 
            Este movimiento quedará registrado en el historial de auditoría.
          </div>
        </div>
      </div>
    </Modal>
  );
}
