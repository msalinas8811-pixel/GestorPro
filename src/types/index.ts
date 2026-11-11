export type Priority = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export type OrderStatus =
  | 'Pendiente'
  | 'En Diagnóstico'
  | 'En Proceso'
  | 'En Espera'
  | 'En Pruebas'
  | 'Completada'
  | 'Cancelada';

export type TaskStatus =
  | 'Pendiente'
  | 'En Progreso'
  | 'En Revisión'
  | 'Finalizada';

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface ProgressLog {
  id: string;
  timestamp: string;
  author: string;
  note: string;
  progressPercent?: number;
  photos: string[]; // Base64 data URLs or asset URLs
  type: 'nota' | 'foto' | 'estado' | 'material';
}

export interface MaterialUsage {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  assignedAt: string;
}

export interface Order {
  id: string;
  code: string; // Ej: OT-2026-001
  title: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  category: string;
  priority: Priority;
  status: OrderStatus;
  progress: number; // 0 - 100
  estimatedBudget: number;
  actualCost: number;
  assignedTo: string;
  location: string;
  description: string;
  createdAt: string;
  deadline: string;
  completedAt?: string;
  updates: ProgressLog[];
  materialsUsed: MaterialUsage[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  code: string; // Ej: TSK-101
  orderId?: string; // Vinculación opcional con una orden
  orderCode?: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: Priority;
  status: TaskStatus;
  progress: number; // 0 - 100
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  checklist: ChecklistItem[];
  updates: ProgressLog[];
  createdAt: string;
  completedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  costPrice: number;
  location: string; // Pasillo / Estante
  unit: string; // 'unidad' | 'metro' | 'litro' | 'kit' | 'caja'
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  orderCode?: string;
  referenceDoc?: string;
  user: string;
}

export type UserRole = 'administrador' | 'supervisor' | 'tecnico' | 'bodeguero';

export interface TechnicianUser {
  id: string;
  username: string;
  pin: string;
  fullName: string;
  email?: string;
  specialty: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  avatarColor?: string;
}

export interface AppData {
  version: number;
  lastUpdated: string;
  orders: Order[];
  tasks: Task[];
  products: Product[];
  movements: StockMovement[];
  categories: string[];
  teamMembers: string[];
  technicians: TechnicianUser[];
}

