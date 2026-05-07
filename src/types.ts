export enum OperationType {
  ALTA = "ALTA",
  EDICION = "EDICION",
  MOVIMIENTO = "MOVIMIENTO",
  REEMPLAZO = "REEMPLAZO",
  REPARACION = "REPARACION",
  BAJA = "BAJA",
}

export enum UserRole {
  ADMIN = "admin",
  TECNICO = "tecnico",
  VIEWER = "viewer",
}

export interface Item {
  id: number;
  articulo: string;
  sucursal: string;
  cantidad: number;
  categoria: string;
  estado: string;
  serie: string;
  obs: string;
  monto?: number;
  fecha_compra?: string;
  factura?: string;
  minStock?: number;
  tags?: string[];
}

export interface Unit {
  id: number;
  item_id: number;
  unit_code: string;
  sucursal: string;
  estado: string;
  serie: string;
  obs: string;
  articulo: string;
  categoria: string;
}

export interface HistoryEntry {
  id: number;
  ts: string;
  tipo: OperationType;
  item_id: number;
  unit_id?: number | null;
  item_nombre: string;
  sucursal: string;
  detalle: string;
  usuario: string;
  extra?: any;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}
