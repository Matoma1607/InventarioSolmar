import { User, Item, Unit, HistoryEntry, UserRole, OperationType } from "./types";

export const initialSucursales: string[] = [
  'Oficina Sistemas', 'Casa Central', 'Recinto', 'Anexo B', 
  'Junín', 'Lutz Ferrando', 'Maipú', 'Mendoza'
];

export const initialItems: Item[] = [
  { id: 1, articulo: 'Cable HDMI', sucursal: 'Oficina Sistemas', cantidad: 2, categoria: 'Cables e Insumos', estado: 'Operativo', serie: '', obs: '', minStock: 5, tags: ['Urgente', 'Reposición'] },
  { id: 2, articulo: 'Cable VGA', sucursal: 'Oficina Sistemas', cantidad: 15, categoria: 'Cables e Insumos', estado: 'Operativo', serie: '', obs: '', minStock: 5, tags: ['Básico'] },
  { id: 3, articulo: 'Switch TP-LINK 24 puertos', sucursal: 'Oficina Sistemas', cantidad: 3, categoria: 'Red y Conectividad', estado: 'Operativo', serie: '', obs: '', minStock: 5, tags: ['Crítico'] },
];

export const initialUnits: Unit[] = [
  { id: 1, item_id: 3, unit_code: 'SW-001', sucursal: 'Casa Central', estado: 'Operativo', serie: 'SN12345678', obs: 'Ubicado en rack principal', articulo: 'Switch TP-LINK 24 puertos', categoria: 'Red y Conectividad' },
  { id: 2, item_id: 3, unit_code: 'SW-002', sucursal: 'Recinto', estado: 'Operativo', serie: 'SN87654321', obs: 'Backup', articulo: 'Switch TP-LINK 24 puertos', categoria: 'Red y Conectividad' },
];

export const initialHistory: HistoryEntry[] = [
  { id: 1, ts: new Date().toISOString(), tipo: OperationType.MOVIMIENTO, item_id: 3, item_nombre: 'Switch TP-LINK 24 puertos', sucursal: 'Casa Central', detalle: 'Movimiento de Oficina Sistemas a Casa Central', usuario: 'admin' }
];

export const initialUsers: (User & { password?: string })[] = [
  { id: 1, username: 'admin', role: UserRole.ADMIN, name: 'Administrador', password: 'admin123' },
  { id: 2, username: 'sistemas', role: UserRole.TECNICO, name: 'Técnico Solmar', password: 'sistemas' },
  { id: 3, username: 'gabi', role: UserRole.VIEWER, name: 'Gabi Solmar', password: 'solmar2026' }
];
