import React from "react";
import Modal from "./Modal";
import { Item } from "../types";
import { QrCode, Download, Printer } from "lucide-react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

export default function QRModal({ isOpen, onClose, item }: QRModalProps) {
  if (!item) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify({ id: item.id, type: 'item', code: `SOL-${String(item.id).padStart(6, '0')}` })
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Etiqueta QR de Activo"
      subtitle={`ID de Inventario: SOL-${String(item.id).padStart(6, '0')}`}
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <button 
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-[var(--bg4)] border border-[var(--line2)] text-[var(--txt)] text-[12px] font-bold rounded-full transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button 
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-[var(--accent)] text-white text-[12px] font-bold rounded-full transition-all"
          >
            <Download size={16} /> Descargar
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center py-6">
        <div className="bg-white p-4 rounded-xl border-4 border-black mb-6 shadow-xl">
           <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
        </div>
        
        <div className="text-center space-y-1">
          <div className="text-[14px] font-bold text-[var(--txt)] uppercase">{item.articulo}</div>
          <div className="text-[11px] text-[var(--txt3)] font-mono">SN: {item.serie || "S/N"}</div>
          <div className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest mt-2">{item.sucursal}</div>
        </div>

        <div className="mt-8 w-full p-4 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r2)] text-[10px] text-[var(--txt3)] leading-relaxed">
          Usa este código para identificar el equipo físicamente. Al escanearlo con la app, accederás instantáneamente a la ficha técnica y registros de mantenimiento.
        </div>
      </div>
    </Modal>
  );
}
