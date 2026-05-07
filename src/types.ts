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
  id: string;
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
  id: string;
  item_id: string;
  unit_code: string;
  sucursal: string;
  estado: string;
  serie: string;
  obs: string;
  articulo: string;
  categoria: string;
}

export interface HistoryEntry {
  id: string;
  ts: string;
  tipo: OperationType;
  item_id: string;
  unit_id?: string | null;
  item_nombre: string;
  sucursal: string;
  detalle: string;
  usuario: string;
  extra?: any;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}
