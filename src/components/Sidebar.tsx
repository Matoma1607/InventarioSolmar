import { 
  Grid3X3, 
  History, 
  PieChart, 
  Move, 
  RefreshCw, 
  Wrench, 
  CheckCircle, 
  QrCode, 
  Printer, 
  MapPin, 
  Users, 
  LogOut 
} from "lucide-react";
import { User, UserRole } from "../types";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  itemCount: number;
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ activeView, setActiveView, itemCount, user, onLogout }: SidebarProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const menuItems = [
    { id: 'inventory', label: 'Inventario', icon: <Grid3X3 size={18} />, badge: itemCount },
    { id: 'history', label: 'Historial', icon: <History size={18} /> },
    { id: 'reports', label: 'Reportes', icon: <PieChart size={18} /> },
  ];

  const operationsItems = [
    { id: 'move', label: 'Mover artículo', icon: <Move size={18} />, roles: [UserRole.ADMIN, UserRole.TECNICO] },
    { id: 'replace', label: 'Reemplazar', icon: <RefreshCw size={18} />, roles: [UserRole.ADMIN, UserRole.TECNICO] },
    { id: 'repair', label: 'Enviar a reparación', icon: <Wrench size={18} />, roles: [UserRole.ADMIN, UserRole.TECNICO] },
    { id: 'return', label: 'Volver de reparación', icon: <CheckCircle size={18} />, roles: [UserRole.ADMIN, UserRole.TECNICO] },
    { id: 'scan', label: 'Escanear QR', icon: <QrCode size={18} />, roles: [UserRole.ADMIN, UserRole.TECNICO, UserRole.VIEWER] },
    { id: 'print', label: 'Imprimir QRs', icon: <Printer size={18} />, roles: [UserRole.ADMIN, UserRole.TECNICO, UserRole.VIEWER] },
  ];

  const canShowItem = (roles?: UserRole[]) => {
    if (!roles || !user) return true;
    return roles.includes(user.role);
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-[var(--sidebar-w)] bg-[var(--bg2)] border-r border-[var(--line)] flex flex-col z-50 overflow-y-auto">
      <div className="p-6 border-b border-[var(--line)]">
        <div className="flex items-center gap-2 text-[var(--txt)] font-semibold text-[13px] tracking-tight">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
          Óptica Solmar
        </div>
        <div className="text-[10px] text-[var(--txt3)] mt-1 uppercase tracking-widest pl-4">
          IT Asset Manager
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="px-5 mb-2 text-[9px] uppercase tracking-widest text-[var(--txt3)] font-medium">
          Principal
        </div>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors border-l-2 ${
              activeView === item.id 
                ? "text-[var(--txt)] bg-[var(--as)] border-[var(--accent)] font-medium" 
                : "text-[var(--txt2)] border-transparent hover:text-[var(--txt)] hover:bg-[var(--bg3)]"
            }`}
          >
            <span className={activeView === item.id ? "opacity-100" : "opacity-70"}>{item.icon}</span>
            {item.label}
            {item.badge !== undefined && (
              <span className="ml-auto bg-[var(--as)] text-[var(--accent)] border border-[var(--line2)] rounded-full text-[10px] px-2 py-0.5 font-mono font-semibold">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="px-5 mt-6 mb-2 text-[9px] uppercase tracking-widest text-[var(--txt3)] font-medium">
          Operaciones
        </div>
        {operationsItems.filter(item => canShowItem(item.roles)).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors border-l-2 ${
              activeView === item.id 
                ? "text-[var(--txt)] bg-[var(--as)] border-[var(--accent)] font-medium" 
                : "text-[var(--txt2)] border-transparent hover:text-[var(--txt)] hover:bg-[var(--bg3)]"
            }`}
          >
            <span className={activeView === item.id ? "opacity-100" : "opacity-70"}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="px-5 mt-6 mb-2 text-[9px] uppercase tracking-widest text-[var(--txt3)] font-medium">
          Configuración
        </div>
        <button
          onClick={() => setActiveView('branches')}
          className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors border-l-2 ${
            activeView === 'branches' 
              ? "text-[var(--txt)] bg-[var(--as)] border-[var(--accent)] font-medium" 
              : "text-[var(--txt2)] border-transparent hover:text-[var(--txt)] hover:bg-[var(--bg3)]"
          }`}
        >
          <span className={activeView === 'branches' ? "opacity-100" : "opacity-70"}><MapPin size={18} /></span>
          Sucursales
        </button>
        {user?.role === UserRole.ADMIN && (
          <button
            onClick={() => setActiveView('users')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors border-l-2 ${
              activeView === 'users' 
                ? "text-[var(--txt)] bg-[var(--as)] border-[var(--accent)] font-medium" 
                : "text-[var(--txt2)] border-transparent hover:text-[var(--txt)] hover:bg-[var(--bg3)]"
            }`}
          >
            <span className={activeView === 'users' ? "opacity-100" : "opacity-70"}><Users size={18} /></span>
            Usuarios
          </button>
        )}
      </nav>

      {user && (
        <div className="border-t border-[var(--line)] p-4 bg-[var(--bg2)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--as)] border border-[var(--accent)] flex items-center justify-center text-[11px] font-bold text-[var(--accent)]">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[var(--txt)] truncate">{user.name}</div>
              <div className="text-[10px] text-[var(--txt3)] uppercase tracking-tight">
                {user.role === UserRole.ADMIN ? 'Administrador' : user.role === UserRole.TECNICO ? 'Técnico IT' : 'Solo lectura'}
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-[var(--txt3)] hover:text-[var(--red)] transition-colors p-1"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
      
      <div className="px-5 py-3 text-[10px] text-[var(--txt3)] border-t border-[var(--line)]">
        Sistema v4.0 · IT Asset Manager
      </div>
    </aside>
  );
}
