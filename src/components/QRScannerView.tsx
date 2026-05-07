import React, { useState, useEffect, useRef } from "react";
import { QrCode, Camera, StopCircle, Search, FileText, MapPin, CheckCircle2 } from "lucide-react";
import { Unit, Item } from "../types";

interface QRScannerViewProps {
  units: Unit[];
  items: Item[];
  onOpenDetail: (id: number) => void;
}

export default function QRScannerView({ units, items, onOpenDetail }: QRScannerViewProps) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [foundUnit, setFoundUnit] = useState<Unit | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<any>(null);

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        setError(null);
        
        // Load jsQR dynamically
        if (!(window as any).jsQR) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
          script.onload = () => initLoop();
          document.head.appendChild(script);
        } else {
          initLoop();
        }
      }
    } catch (err) {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const initLoop = () => {
    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video?.readyState === video?.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code) {
            processScan(code.data);
            stopScan();
          }
        }
      }
    }, 300);
  };

  const stopScan = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setScanning(false);
  };

  const processScan = (data: string) => {
    let matchUnit: Unit | undefined;

    // Check URL pattern /api/units/ID
    const urlMatch = data.match(/\/api\/units\/(\d+)$/);
    if (urlMatch) {
      matchUnit = units.find(u => u.id === parseInt(urlMatch[1]));
    }

    // Check code pattern SOL-XXXXXX
    if (!matchUnit) {
      const codeMatch = data.match(/SOL-(\d+)/i);
      if (codeMatch) {
         const code = `SOL-${codeMatch[1].padStart(6, '0')}`;
         matchUnit = units.find(u => u.unit_code === code);
      }
    }

    if (matchUnit) {
      setFoundUnit(matchUnit);
      setError(null);
    } else {
      setError(`No se encontró registro para: ${data}`);
      setFoundUnit(null);
    }
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) return;
    processScan(manualCode.trim());
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-8">
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="text-[var(--accent)]" />
          <h2 className="text-[17px] font-bold text-[var(--txt)] tracking-tight">Escanear Activo IT</h2>
        </div>
        <p className="text-[12.5px] text-[var(--txt3)] mb-8">
          Cada código QR identifica un dispositivo de forma única. Escaneá para ver su ficha técnica, ubicación e historial completo.
        </p>

        <div className={`relative border-2 border-dashed rounded-[var(--r2)] aspect-video flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${scanning ? 'border-[var(--accent)]' : 'border-[var(--line2)] bg-[var(--bg3)]'}`}>
          <video 
            ref={videoRef} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${scanning ? 'opacity-100' : 'opacity-0'}`} 
            autoPlay 
            playsInline 
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!scanning && !foundUnit && !error && (
             <>
               <div className="text-4xl opacity-20 mb-3">⬚</div>
               <div className="text-[13px] text-[var(--txt3)] font-medium">Activá la cámara para comenzar</div>
             </>
          )}

          {error && (
            <div className="p-6 text-center animate-in fade-in duration-300 z-10">
              <div className="text-[var(--red)] text-3xl mb-2">✕</div>
              <div className="text-[13px] text-[var(--red)] font-medium max-w-xs">{error}</div>
            </div>
          )}

          {foundUnit && (
            <div className="absolute inset-0 bg-[var(--bg2)] flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300 z-20">
               <div className="w-12 h-12 rounded-full bg-[var(--gs)] text-[var(--green)] flex items-center justify-center mb-4">
                 <CheckCircle2 size={24} />
               </div>
               <div className="text-[15px] font-bold text-[var(--txt)] mb-1 text-center">{foundUnit.articulo}</div>
               <div className="text-[12px] text-[var(--txt3)] mb-4 flex items-center gap-1">
                 <MapPin size={10} /> {foundUnit.sucursal} · {foundUnit.estado}
               </div>
               <div className="text-[10px] text-[var(--txt3)] font-mono bg-[var(--bg4)] px-2 py-1 rounded border border-[var(--line2)] mb-6 tracking-wide">
                 {foundUnit.unit_code}
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => onOpenDetail(foundUnit.item_id)}
                   className="h-9 px-4 bg-[var(--accent)] text-white text-[12px] font-semibold rounded-full shadow-[0_8px_16px_var(--ag)]"
                 >
                   Ver Ficha Completa
                 </button>
                 <button 
                   onClick={() => { setFoundUnit(null); setError(null); }}
                   className="h-9 px-4 bg-[var(--bg3)] text-[var(--txt2)] text-[12px] font-semibold rounded-full border border-[var(--line2)]"
                 >
                   Nuevo Escaneo
                 </button>
               </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          {!scanning ? (
            <button 
              onClick={startScan}
              className="flex-1 h-11 bg-[var(--accent)] hover:bg-[var(--accent2)] text-white font-bold rounded-[var(--r)] shadow-[0_8px_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 transition-all"
            >
              <Camera size={18} /> Activar Cámara
            </button>
          ) : (
            <button 
              onClick={stopScan}
              className="flex-1 h-11 bg-[var(--bg4)] text-[var(--txt2)] font-bold rounded-[var(--r)] flex items-center justify-center gap-2 transition-all border border-[var(--line2)]"
            >
              <StopCircle size={18} /> Detener Cámara
            </button>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-[var(--line)]">
          <div className="text-[11px] font-bold text-[var(--txt3)] uppercase tracking-widest mb-4">Búsqueda Manual</div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt3)]" size={14} />
              <input 
                type="text" 
                placeholder="Ingresá código SOL-XXXXXX" 
                className="w-full h-10 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] pl-9 pr-4 text-[13px] outline-none focus:border-[var(--accent)] transition-all"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
            </div>
            <button 
              onClick={handleManualSearch}
              className="w-24 h-10 bg-[var(--bg4)] text-[var(--txt)] text-[12px] font-bold rounded-[var(--r)] border border-[var(--line2)] hover:bg-[var(--bg3)] transition-all"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
