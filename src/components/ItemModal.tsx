import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Item } from "../types";
import { Save, AlertTriangle, Upload, Check, Loader2 } from "lucide-react";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<Item>) => Promise<void>;
  item?: Item | null;
  sucursales: string[];
}

export default function ItemModal({ isOpen, onClose, onSave, item, sucursales }: ItemModalProps) {
  const [formData, setFormData] = useState<Partial<Item>>({
    articulo: "",
    sucursal: "Oficina Sistemas",
    cantidad: 1,
    categoria: "Computadoras",
    estado: "Operativo",
    serie: "",
    obs: "",
    minStock: 2,
    tags: []
  });
  
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: limit file size for Base64 (e.g., 2MB to keep Firestore happy)
    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo es demasiado grande (máximo 2MB para esta versión práctica)");
      return;
    }

    setUploading(true);
    setError("");
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({ ...prev, factura: base64 }));
        setUploading(false);
      };
      reader.onerror = () => {
        setError("Error al leer el archivo");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error al procesar el archivo");
      console.error(err);
      setUploading(false);
    }
  };

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        articulo: "",
        sucursal: "Oficina Sistemas",
        cantidad: 1,
        categoria: "Computadoras",
        estado: "Operativo",
        serie: "",
        obs: "",
        minStock: 2,
        tags: []
      });
    }
    setError("");
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.articulo) {
      setError("El nombre del artículo es obligatorio");
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError("Error al guardar el artículo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag)
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? "Editar Artículo" : "Nuevo Artículo"}
      subtitle={item ? `Editando SOL-${String(item.id).padStart(6, '0')}` : "Completa la ficha técnica del activo IT"}
      size="lg"
      footer={
        <>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium text-[var(--txt3)] hover:text-[var(--txt)] transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent2)] text-white text-[12px] font-semibold rounded-full min-w-[120px] justify-center transition-all disabled:opacity-50"
          >
            {loading ? "Guardando..." : (
              <>
                <Save size={16} />
                {item ? "Actualizar" : "Crear Artículo"}
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {error && (
          <div className="col-span-full flex items-center gap-2 p-3 bg-[var(--rs)] border border-[var(--red)]/20 rounded-[var(--r)] text-[var(--red)] text-[12px]">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Nombre del Artículo</label>
            <input 
              type="text" 
              className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)] transition-all"
              placeholder="Ej: Monitor Dell 24' P2422H"
              value={formData.articulo}
              onChange={e => setFormData({...formData, articulo: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Categoría</label>
               <select 
                 className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
                 value={formData.categoria}
                 onChange={e => setFormData({...formData, categoria: e.target.value})}
               >
                 <option>Computadoras</option>
                 <option>Monitores</option>
                 <option>Impresoras</option>
                 <option>Red y Conectividad</option>
                 <option>Cámaras</option>
                 <option>Periféricos</option>
                 <option>Servidores</option>
                 <option>Tablets</option>
                 <option>Cables e Insumos</option>
                 <option>Otros</option>
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Sucursal</label>
               <select 
                 className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
                 value={formData.sucursal}
                 onChange={e => setFormData({...formData, sucursal: e.target.value})}
               >
                 {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Cantidad Inicial</label>
               <input 
                 type="number" 
                 min="0"
                 className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)]"
                 value={formData.cantidad}
                 onChange={e => setFormData({...formData, cantidad: parseInt(e.target.value) || 0})}
               />
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Stock Mínimo</label>
               <input 
                 type="number" 
                 min="0"
                 className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)]"
                 value={formData.minStock}
                 onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
               />
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Número de Serie / Tag</label>
            <input 
              type="text" 
              className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)]"
              placeholder="SN-XXXX-XXXX"
              value={formData.serie}
              onChange={e => setFormData({...formData, serie: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Estado General</label>
            <select 
              className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
              value={formData.estado}
              onChange={e => setFormData({...formData, estado: e.target.value})}
            >
              <option>Operativo</option>
              <option>En reparación</option>
              <option>Dado de baja</option>
              <option>Reservado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Costo ($)</label>
               <input 
                 type="number" 
                 min="0"
                 className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)]"
                 value={formData.monto || ""}
                 onChange={e => setFormData({...formData, monto: parseFloat(e.target.value) || 0})}
               />
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Fecha de Compra</label>
               <input 
                 type="date" 
                 className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)]"
                 value={formData.fecha_compra || ""}
                 onChange={e => setFormData({...formData, fecha_compra: e.target.value})}
               />
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Factura / PDF</label>
            <div className="flex gap-2">
              <div className="relative flex-1 flex gap-1">
                <input 
                  type="text" 
                  className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-4 text-[13px] outline-none focus:border-[var(--accent)]"
                  placeholder="URL o ruta del archivo..."
                  value={formData.factura || ""}
                  onChange={e => setFormData({...formData, factura: e.target.value})}
                />
                {formData.factura && (
                  <button
                    type="button"
                    onClick={() => {
                        const win = window.open();
                        if (win) {
                            if (formData.factura?.startsWith('data:')) {
                                win.document.write(`<iframe src="${formData.factura}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            } else {
                                win.location.href = formData.factura || '';
                            }
                        }
                    }}
                    className="h-10 px-3 bg-[var(--bg4)] border border-[var(--line2)] rounded-[var(--r)] text-[12px] hover:text-[var(--accent)] transition-all"
                    title="Ver archivo"
                  >
                    Ver
                  </button>
                )}
                {(formData.factura?.startsWith('/uploads/') || formData.factura?.startsWith('data:')) && (
                  <div className="absolute right-[45px] top-1/2 -translate-y-1/2 text-[var(--green)]" title="Archivo cargado">
                    <Check size={14} />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 h-10 bg-[var(--bg4)] border border-[var(--line2)] rounded-[var(--r)] text-[var(--txt2)] text-[12px] font-bold hover:bg-[var(--as)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span>Subir</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Observaciones</label>
            <textarea 
              className="w-full h-24 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] p-3 text-[13px] outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Detalles adicionales, ubicación específica, etc."
              value={formData.obs}
              onChange={e => setFormData({...formData, obs: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Etiquetas</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 h-9 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] px-3 text-[12px] outline-none focus:border-[var(--accent)]"
                placeholder="Nueva etiqueta..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button 
                type="button" 
                onClick={addTag}
                className="h-9 px-3 bg-[var(--bg4)] border border-[var(--line2)] rounded-[var(--r)] text-[11px] font-bold"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.tags?.map(t => (
                <span key={t} className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg4)] border border-[var(--line2)] rounded text-[10px] text-[var(--txt2)]">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-[var(--red)]">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
