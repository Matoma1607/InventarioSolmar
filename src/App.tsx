import { useState, useEffect, useCallback, useRef } from "react";
import { User, Item, Unit, HistoryEntry, UserRole } from "./types";
import Sidebar from "./components/Sidebar";
import { initialItems, initialUnits, initialSucursales, initialHistory, initialUsers } from "./data";
import Inventory from "./components/Inventory";
import HistoryView from "./components/HistoryView";
import ReportsView from "./components/ReportsView";
import FacturasView from "./components/FacturasView";
import QRScannerView from "./components/QRScannerView";
import Login from "./components/Login";
import ItemModal from "./components/ItemModal";
import MoveModal from "./components/MoveModal";
import QRModal from "./components/QRModal";
import { Menu, Search, Plus, MapPin, Users } from "lucide-react";
import { firestoreService } from "./services/firestoreService";
import { collection, doc, setDoc, getCountFromServer, getDocs, where, query } from "firebase/firestore";
import { db } from "./lib/firebase";
import { OperationType } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState("inventory");
  const [activeTab, setActiveTab] = useState("Todas");
  
  const [items, setItems] = useState<Item[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [sucursales, setSucursales] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const seeded = useRef(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Auth initialization
  useEffect(() => {
    const saved = sessionStorage.getItem("solmar_session");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const seedDatabase = async () => {
    console.log("Seeding database with initial values...");
    try {
      // Seed Sucursales
      for (const s of initialSucursales) {
        await setDoc(doc(db, 'sucursales', s), { nombre: s });
      }
      // Seed Items
      for (const item of initialItems) {
        await firestoreService.saveItem(item);
      }
      // Seed Units
      for (const unit of initialUnits) {
        await firestoreService.saveUnit(unit);
      }
      // Seed History
      for (const h of initialHistory) {
        await firestoreService.addHistory(h);
      }
      // Seed Users
      for (const u of initialUsers) {
        const { password, ...userData } = u;
        await setDoc(doc(db, 'users', userData.username), { ...userData, password });
      }
    } catch (err) {
      console.error("Error seeding:", err);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we need to seed
      const itemsCount = await getCountFromServer(collection(db, 'items'));
      if (itemsCount.data().count === 0 && !seeded.current) {
        seeded.current = true;
        await seedDatabase();
      }

      const [dataItems, dataUnits, dataSuc, dataHist] = await Promise.all([
        firestoreService.getItems(),
        firestoreService.getUnits(),
        firestoreService.getSucursales(),
        firestoreService.getHistory()
      ]);

      setItems(dataItems);
      setUnits(dataUnits);
      setSucursales(dataSuc);
      setHistory(dataHist);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem("solmar_session", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("solmar_session");
  };

  const handleSaveItem = async (data: Partial<Item>) => {
    const id = await firestoreService.saveItem(data);
    if (!id) return;

    // Log history
    await firestoreService.addHistory({
      tipo: data.id ? OperationType.EDICION : OperationType.ALTA,
      item_id: id,
      item_nombre: data.articulo || "",
      sucursal: data.sucursal || "",
      detalle: data.id ? `Edición de datos del artículo` : `Alta de nuevo artículo en ${data.sucursal}`,
      usuario: user?.username || "sistema"
    });

    await fetchData();
  };

  const handleMoveItem = async (itemId: string, origen: string, destino: string, cant: number, obs: string) => {
    // 1. Get original item
    const originalItem = items.find(i => i.id === itemId);
    if (!originalItem) return;

    // 2. Reduce original stock
    await firestoreService.saveItem({
      ...originalItem,
      cantidad: originalItem.cantidad - cant
    });

    // 3. Increment or create destination stock
    const destQuery = query(collection(db, 'items'), where('articulo', '==', originalItem.articulo), where('sucursal', '==', destino));
    const destSnap = await getDocs(destQuery);

    if (!destSnap.empty) {
      const destDoc = destSnap.docs[0];
      const destId = destDoc.id;
      const destData = destDoc.data();
      await firestoreService.saveItem({
        id: destId,
        cantidad: (destData.cantidad || 0) + cant
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...rest } = originalItem;
      await firestoreService.saveItem({
        ...rest,
        sucursal: destino,
        cantidad: cant,
        obs: `Trasladado desde ${origen}. ${obs}`
      });
    }

    // 4. Log history
    await firestoreService.addHistory({
      tipo: OperationType.MOVIMIENTO,
      item_id: itemId,
      item_nombre: originalItem.articulo,
      sucursal: destino,
      detalle: `Traslado de ${cant} unidad(es) desde ${origen} a ${destino}. ${obs}`,
      usuario: user?.username || "sistema"
    });

    await fetchData();
  };

  const handleRetireItem = async (itemId: string) => {
    if (!confirm("¿Está seguro de querer dar de baja este artículo?")) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    await firestoreService.saveItem({
      ...item,
      estado: "Dado de baja",
      cantidad: 0
    });

    await firestoreService.addHistory({
      tipo: OperationType.BAJA,
      item_id: itemId,
      item_nombre: item.articulo,
      sucursal: item.sucursal,
      detalle: `Artículo dado de baja del sistema`,
      usuario: user?.username || "sin_usuario"
    });

    await fetchData();
  };

  const handleAddSucursal = async () => {
    const nombre = prompt("Ingrese el nombre de la nueva sucursal:");
    if (!nombre) return;
    
    await firestoreService.saveSucursal(nombre.trim());
    await fetchData();
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)] text-[var(--txt3)] font-mono text-[12px]">
        INICIALIZANDO SISTEMA...
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case "inventory":
        return (
          <Inventory 
            items={items}
            units={units}
            sucursales={sucursales}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            onOpenAdd={() => { setSelectedItem(null); setIsItemModalOpen(true); }}
            onOpenEdit={(id) => { setSelectedItem(items.find(i => i.id === id) || null); setIsItemModalOpen(true); }}
            onOpenDetail={(id) => { setSelectedItem(items.find(i => i.id === id) || null); setIsItemModalOpen(true); }}
            onOpenMove={(id) => { setSelectedItem(items.find(i => i.id === id) || null); setIsMoveModalOpen(true); }}
            onOpenQR={(id) => { setSelectedItem(items.find(i => i.id === id) || null); setIsQRModalOpen(true); }}
            onRetire={handleRetireItem}
            externalSearch={searchTerm}
          />
        );
      case "history":
        return <HistoryView history={history} sucursales={sucursales} />;
      case "invoices":
        return <FacturasView 
          items={items} 
          onOpenEdit={(id) => { setSelectedItem(items.find(i => i.id === id) || null); setIsItemModalOpen(true); }} 
          onUpdateItem={async (id, data) => { await handleSaveItem({ ...items.find(i => i.id === id), ...data, id }); }}
        />;
      case "reports":
        return <ReportsView items={items} units={units} history={history} sucursales={sucursales} />;
      case "scan":
        return <QRScannerView items={items} units={units} onOpenDetail={(id) => { setActiveView('inventory'); console.log('open', id); }} />;
      case "branches":
        return (
          <div className="max-w-2xl mx-auto py-10 space-y-4">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                   <MapPin className="text-[var(--accent)]" />
                   <h2 className="text-xl font-bold tracking-tight">Sucursales Activas</h2>
                </div>
                {user.role === UserRole.ADMIN && (
                  <button 
                    onClick={handleAddSucursal}
                    className="h-9 px-4 bg-[var(--accent)] text-white text-[12px] font-bold rounded-full"
                  >
                    Nueva Sucursal
                  </button>
                )}
             </div>
             <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] divide-y divide-[var(--line)]">
                {sucursales.sort().map(s => (
                   <div key={s} className="px-6 py-4 flex items-center justify-between">
                      <div className="font-medium text-[14px]">{s}</div>
                      <div className="text-[11px] text-[var(--txt3)] font-mono">{items.filter(i => i.sucursal === s).length} ítems</div>
                   </div>
                ))}
             </div>
          </div>
        );
      case "users":
        return (
          <div className="max-w-2xl mx-auto py-10 space-y-4">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                   <Users className="text-[var(--accent)]" />
                   <h2 className="text-xl font-bold tracking-tight">Gestión de Usuarios</h2>
                </div>
                {user.role === UserRole.ADMIN && (
                  <button className="h-9 px-4 bg-[var(--accent)] text-white text-[12px] font-bold rounded-full">Nuevo Usuario</button>
                )}
             </div>
             <div className="bg-[var(--bg2)] border border-[var(--line)] rounded-[var(--r3)] p-12 text-center text-[var(--txt3)] font-mono text-[11px]">
                USUARIOS_MODULE_UNDER_CONSTRUCTION
             </div>
          </div>
        );
      default:
        return <div className="p-12 text-center text-[var(--txt3)] lowercase font-mono">module_not_ready</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--txt)] font-sans selection:bg-[var(--as)] selection:text-[var(--accent)]">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        itemCount={items.length} 
        user={user}
        onLogout={handleLogout}
      />

      <main className="ml-[var(--sidebar-w)] flex-1 min-w-0 flex flex-col relative">
        <header className="sticky top-0 z-40 h-[var(--topbar-h)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl border-b border-[var(--line)] px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="block lg:hidden p-2 hover:bg-[var(--bg3)] rounded-md cursor-pointer">
               <Menu size={20} />
             </div>
             <h1 className="text-[14px] font-semibold tracking-tight whitespace-nowrap">
               {activeView === 'inventory' ? 'Inventario Central' : 
                activeView === 'history' ? 'Historial de Movimientos' : 
                activeView === 'reports' ? 'Análisis de Activos' : 
                activeView === 'branches' ? 'Gestión de Sucursales' : 
                activeView === 'scan' ? 'Escanear QR' :
                activeView === 'print' ? 'Impresión de Etiquetas' :
                'IT Asset Manager'}
             </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:flex items-center">
               <Search size={14} className="absolute left-3 text-[var(--txt3)]" />
               <input 
                 type="text" 
                 placeholder="Búsqueda rápida..."
                 className="h-9 pl-10 pr-4 bg-[var(--bg3)] hover:bg-[var(--bg4)] border border-[var(--line2)] rounded-full text-[12px] text-[var(--txt2)] placeholder:text-[var(--txt3)] outline-none focus:border-[var(--accent)] transition-all"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 onFocus={() => setActiveView('inventory')}
               />
               <kbd className="absolute right-3 h-5 px-1.5 rounded bg-[var(--bg2)] border border-[var(--line3)] text-[9px] font-mono text-[var(--txt3)] flex items-center justify-center pointer-events-none">⌘K</kbd>
            </div>
            
            {(user.role === UserRole.ADMIN || user.role === UserRole.TECNICO) && (
              <button 
                onClick={() => { setSelectedItem(null); setIsItemModalOpen(true); }}
                className="flex items-center gap-2 px-4 h-9 bg-[var(--accent)] hover:bg-[var(--accent2)] text-white font-semibold rounded-full text-[12px] shadow-[0_8px_16px_var(--ag)] transition-all"
              >
                <Plus size={16} />
                <span className="hidden md:inline">Nuevo Artículo</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {renderView()}
        </div>

        {/* Modals */}
        <ItemModal 
          isOpen={isItemModalOpen} 
          onClose={() => { setIsItemModalOpen(false); setSelectedItem(null); }}
          onSave={handleSaveItem}
          item={selectedItem}
          sucursales={sucursales}
        />

        <MoveModal 
          isOpen={isMoveModalOpen} 
          onClose={() => { setIsMoveModalOpen(false); setSelectedItem(null); }}
          onMove={handleMoveItem}
          item={selectedItem}
          sucursales={sucursales}
        />

        <QRModal 
          isOpen={isQRModalOpen}
          onClose={() => { setIsQRModalOpen(false); setSelectedItem(null); }}
          item={selectedItem}
        />
      </main>
    </div>
  );
}
