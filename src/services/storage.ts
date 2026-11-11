import { AppData, Order, Task, Product, StockMovement, TechnicianUser } from '../types';

const STORAGE_KEY = 'IMPORTOYSV_DATA_V2';

// Clean SVG previews for technical evidence
const SAMPLE_PHOTO_BEFORE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><circle cx="300" cy="200" r="80" fill="%23dc2626" opacity="0.2"/><path d="M220 200 L380 200 M300 120 L300 280" stroke="%23ef4444" stroke-width="8"/><text x="300" y="330" fill="%23f8fafc" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Diagn%C3%B3stico: Carburador PZ19 Obstruido</text><text x="300" y="360" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">Cuadrimoto ATV 110cc - Falla de encendido y ahogo</text></svg>';
const SAMPLE_PHOTO_PROCESS = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="150" y="100" width="300" height="200" rx="12" fill="%2316a34a" opacity="0.2"/><circle cx="300" cy="200" r="50" fill="%2322c55e"/><text x="300" y="330" fill="%23f8fafc" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Instalaci%C3%B3n de Bater%C3%ADa Litio 36V 10Ah</text><text x="300" y="360" fill="%2386efac" font-family="sans-serif" font-size="14" text-anchor="middle">Moto Cross El%C3%A9ctrica - Voltaje nominal 41.8V OK</text></svg>';

export const INITIAL_TECHNICIANS: TechnicianUser[] = [
  {
    id: 'tech-1',
    username: 'tecnico.demo1',
    pin: '0000',
    fullName: 'Técnico Demo 1',
    specialty: 'Mecánica Motores 2T & 4T (Motos, Cuadrimotos, Go Karts)',
    phone: '00000000',
    role: 'tecnico',
    active: true,
    createdAt: '2026-11-01T08:00:00Z',
    avatarColor: 'bg-red-500'
  },
  {
    id: 'tech-2',
    username: 'tecnico.demo2',
    pin: '0000',
    fullName: 'Técnico Demo 2',
    specialty: 'Especialista Eléctrico (36V/48V, Baterías, Controladores & Motores Brushless)',
    phone: '00000000',
    role: 'tecnico',
    active: true,
    createdAt: '2026-11-01T08:30:00Z',
    avatarColor: 'bg-blue-500'
  },
  {
    id: 'tech-3',
    username: 'bodega.demo',
    pin: '0000',
    fullName: 'Bodega Demo',
    specialty: 'Encargada de Bodega & Despacho de Repuestos',
    phone: '00000000',
    role: 'bodeguero',
    active: true,
    createdAt: '2026-11-02T09:00:00Z',
    avatarColor: 'bg-amber-500'
  },
  {
    id: 'tech-4',
    username: 'supervisor.demo',
    pin: '0000',
    fullName: 'Supervisor Demo',
    specialty: 'Supervisor General de Taller & Pruebas en Pista',
    phone: '00000000',
    role: 'supervisor',
    active: true,
    createdAt: '2026-11-01T07:45:00Z',
    avatarColor: 'bg-emerald-500'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'BAT-LIT-36V10A',
    name: 'Batería de Litio 36V 10Ah para Moto Cross Eléctrica / Drift Trike',
    category: 'Baterías & Eléctrico',
    description: 'Paquete de celdas de litio grado A con BMS integrado de 25A y conector XT60.',
    stock: 8,
    minStock: 4,
    unitPrice: 145.00,
    costPrice: 95.00,
    location: 'Bodega Eléctrica - Estante A1',
    unit: 'unidad',
    lastUpdated: '2026-11-09'
  },
  {
    id: 'prod-2',
    sku: 'BAT-AGM-12V12A',
    name: 'Batería Plomo-Ácido AGM 12V 12Ah Ciclo Profundo (Set x3 para 36V)',
    category: 'Baterías & Eléctrico',
    description: 'Batería sellada libre de mantenimiento para cuatrimotos y motos eléctricas infantiles.',
    stock: 5,
    minStock: 8, // Stock bajo
    unitPrice: 28.50,
    costPrice: 18.00,
    location: 'Bodega Eléctrica - Tarima Suelo',
    unit: 'unidad',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'prod-3',
    sku: 'CTR-BRUSH-36V500',
    name: 'Controlador Brushless Inteligente 36V 500W con Reversa',
    category: 'Baterías & Eléctrico',
    description: 'Controlador de onda sinusoidal para motor sin escobillas con corte de freno e indicador de carga.',
    stock: 6,
    minStock: 3,
    unitPrice: 42.00,
    costPrice: 25.00,
    location: 'Bodega Eléctrica - Gaveta C3',
    unit: 'unidad',
    lastUpdated: '2026-11-08'
  },
  {
    id: 'prod-4',
    sku: 'CARB-PZ19-ATV',
    name: 'Carburador Deportivo PZ19 19mm para Cuadrimoto 110cc / Pit Bike',
    category: 'Motores & Carburación',
    description: 'Carburador con ahogador manual por palanca, chicler de alta calibrado para motor 4 tiempos horizontal.',
    stock: 12,
    minStock: 5,
    unitPrice: 24.00,
    costPrice: 14.50,
    location: 'Repuestos Gasolina - Estante G2',
    unit: 'unidad',
    lastUpdated: '2026-11-09'
  },
  {
    id: 'prod-5',
    sku: 'CARB-MINI-49CC',
    name: 'Carburador Completo Mini Moto 49cc 2T con Filtro Cónico',
    category: 'Motores & Carburación',
    description: 'Incluye grifo de combustible integrado y filtro de aire de alto flujo anodizado.',
    stock: 3,
    minStock: 6, // Stock crítico
    unitPrice: 19.00,
    costPrice: 11.00,
    location: 'Repuestos Gasolina - Gaveta G5',
    unit: 'unidad',
    lastUpdated: '2026-11-07'
  },
  {
    id: 'prod-6',
    sku: 'PULL-ALUM-49CC',
    name: 'Tirador de Arranque en Aluminio Reforzado (Pull Start) 49cc',
    category: 'Motores & Carburación',
    description: 'Carcasa y engrane metálico resistente al quiebre para mini pocket bikes y mini cuatris.',
    stock: 14,
    minStock: 6,
    unitPrice: 14.50,
    costPrice: 8.00,
    location: 'Repuestos Gasolina - Estante G1',
    unit: 'unidad',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'prod-7',
    sku: 'CAD-420H-102L',
    name: 'Cadena de Tracción Reforzada 420H 102 Eslabones (Cuadrimoto 110-125cc)',
    category: 'Transmisión & Cadenas',
    description: 'Acero templado con candado de unión rápido para alta resistencia al estiramiento.',
    stock: 15,
    minStock: 5,
    unitPrice: 18.00,
    costPrice: 10.50,
    location: 'Repuestos Tracción - Estante T3',
    unit: 'unidad',
    lastUpdated: '2026-11-08'
  },
  {
    id: 'prod-8',
    sku: 'CAD-T8F-136L',
    name: 'Cadena T8F 136 Eslabones para Mini Moto / Pocket Cross',
    category: 'Transmisión & Cadenas',
    description: 'Cadena de paso fino para transmisión secundaria con piñón T8F.',
    stock: 2,
    minStock: 5, // Stock crítico
    unitPrice: 12.00,
    costPrice: 6.50,
    location: 'Repuestos Tracción - Gaveta T1',
    unit: 'unidad',
    lastUpdated: '2026-11-06'
  },
  {
    id: 'prod-9',
    sku: 'FREN-PAST-ATV',
    name: 'Juego de Pastillas de Freno de Disco Cerámicas para Cuadrimoto ATV',
    category: 'Frenos & Suspensión',
    description: 'Pastillas compuestas para frenos delanteros y traseros de cuatrimotos 110cc y 125cc.',
    stock: 22,
    minStock: 8,
    unitPrice: 9.50,
    costPrice: 4.80,
    location: 'Frenos - Gaveta F2',
    unit: 'kit',
    lastUpdated: '2026-11-09'
  },
  {
    id: 'prod-10',
    sku: 'FREN-BOMB-GOKART',
    name: 'Bomba de Freno Hidráulica Trasera con Caliper Completo para Go Kart',
    category: 'Frenos & Suspensión',
    description: 'Kit hidráulico purgado con manguera reforzada de 140cm y pedal de empuje.',
    stock: 4,
    minStock: 3,
    unitPrice: 34.00,
    costPrice: 22.00,
    location: 'Frenos - Estante F4',
    unit: 'unidad',
    lastUpdated: '2026-11-05'
  },
  {
    id: 'prod-11',
    sku: 'LLAN-145706-ATV',
    name: 'Llanta Delantera Todo Terreno 145/70-6 con Cámara (Cuadrimoto)',
    category: 'Llantas & Neumáticos',
    description: 'Grabado profundo de tacos para lodo y terracería, 4 lonas.',
    stock: 7,
    minStock: 4,
    unitPrice: 36.00,
    costPrice: 24.00,
    location: 'Bahía Neumáticos - Rack N1',
    unit: 'unidad',
    lastUpdated: '2026-11-09'
  },
  {
    id: 'prod-12',
    sku: 'ACEL-PUNO-36V',
    name: 'Acelerador de Puño 36V/48V con Llave y Voltímetro Digital',
    category: 'Mandos & Controles',
    description: 'Empuñadura ergonómica con interruptor de encendido y display LED de voltaje.',
    stock: 9,
    minStock: 4,
    unitPrice: 16.50,
    costPrice: 9.20,
    location: 'Mandos - Gaveta M2',
    unit: 'unidad',
    lastUpdated: '2026-11-08'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    code: 'ORD-2026-001',
    title: 'Cuadrimoto ATV 110cc Gasolina (Cliente Demo 1)',
    clientName: 'Cliente Demo 1',
    clientPhone: '00000000',
    clientEmail: 'cliente1@example.com',
    category: 'Reparación de Motor & Carburación',
    priority: 'Alta',
    status: 'En Proceso',
    progress: 70,
    estimatedBudget: 85.00,
    actualCost: 38.50,
    assignedTo: 'Técnico Demo 1',
    location: 'Bahía 1 - Taller Mecánico Gasolina',
    description: 'Vehículo no enciende. El tirón de arranque se quedó trabado y el carburador bota gasolina por el respiradero al intentar encender. Se requiere reemplazo de pull start y carburador PZ19.',
    createdAt: '2026-11-08T09:00:00Z',
    deadline: '2026-11-12T17:00:00Z',
    materialsUsed: [
      {
        id: 'mat-101-1',
        productId: 'prod-4',
        productName: 'Carburador Deportivo PZ19 19mm para Cuadrimoto 110cc / Pit Bike',
        sku: 'CARB-PZ19-ATV',
        quantity: 1,
        unitCost: 24.00,
        totalCost: 24.00,
        assignedAt: '2026-11-08T14:30:00Z'
      },
      {
        id: 'mat-101-2',
        productId: 'prod-6',
        productName: 'Tirador de Arranque en Aluminio Reforzado (Pull Start) 49cc',
        sku: 'PULL-ALUM-49CC',
        quantity: 1,
        unitCost: 14.50,
        totalCost: 14.50,
        assignedAt: '2026-11-08T14:35:00Z'
      }
    ],
    updates: [
      {
        id: 'up-101-1',
        timestamp: '2026-11-08T09:30:00Z',
        author: 'Técnico Demo 1',
        note: 'Ingreso al taller. Se desarma carcasa plástica delantera. Tirón roto por fatiga y carburador original con chicler tapado de sedimentos.',
        progressPercent: 30,
        photos: [SAMPLE_PHOTO_BEFORE],
        type: 'foto'
      },
      {
        id: 'up-101-2',
        timestamp: '2026-11-08T14:40:00Z',
        author: 'Técnico Demo 1',
        note: 'Baja de inventario: Se retiró carburador PZ19 y tirador de aluminio. Montaje concluido, motor arranca al primer tirón.',
        progressPercent: 70,
        photos: [],
        type: 'material'
      }
    ]
  },
  {
    id: 'ord-102',
    code: 'ORD-2026-002',
    title: 'Moto Cross Eléctrica Infantil 36V 500W (Cliente Demo 2)',
    clientName: 'Cliente Demo 2',
    clientPhone: '00000000',
    clientEmail: 'cliente2@example.com',
    category: 'Sistema Eléctrico & Baterías',
    priority: 'Alta',
    status: 'En Diagnóstico',
    progress: 35,
    estimatedBudget: 175.00,
    actualCost: 0,
    assignedTo: 'Técnico Demo 2',
    location: 'Bahía 2 - Laboratorio Eléctrico',
    description: 'La moto se apaga a los 5 minutos de rodaje. El voltímetro cae drásticamente de 36V a 24V bajo carga. Se sospecha degradación de paquete de celdas.',
    createdAt: '2026-11-09T10:00:00Z',
    deadline: '2026-11-13T16:00:00Z',
    materialsUsed: [],
    updates: [
      {
        id: 'up-102-1',
        timestamp: '2026-11-09T11:00:00Z',
        author: 'Técnico Demo 2',
        note: 'Prueba de descarga con analizador: Banco de baterías actual tiene 2 celdas con resistencia interna alta. Se recomienda instalar paquete de Litio 36V 10Ah con BMS nuevo.',
        progressPercent: 35,
        photos: [SAMPLE_PHOTO_PROCESS],
        type: 'nota'
      }
    ]
  },
  {
    id: 'ord-103',
    code: 'ORD-2026-003',
    title: 'Go Kart Buggy 200cc Gasolina (Cliente Demo 3)',
    clientName: 'Cliente Demo 3',
    clientPhone: '00000000',
    clientEmail: 'cliente3@example.com',
    category: 'Frenos & Transmisión',
    priority: 'Media',
    status: 'En Espera',
    progress: 50,
    estimatedBudget: 65.00,
    actualCost: 18.00,
    assignedTo: 'Técnico Demo 1',
    location: 'Bahía 3 - Elevador de Karts',
    description: 'Cadena floja que se sale en curvas cerradas y pedal de freno trasero esponjoso sin agarre. Requiere tensado, cambio de cadena 420H y purgado de freno.',
    createdAt: '2026-11-07T14:00:00Z',
    deadline: '2026-11-14T12:00:00Z',
    materialsUsed: [
      {
        id: 'mat-103-1',
        productId: 'prod-7',
        productName: 'Cadena de Tracción Reforzada 420H 102 Eslabones (Cuadrimoto 110-125cc)',
        sku: 'CAD-420H-102L',
        quantity: 1,
        unitCost: 18.00,
        totalCost: 18.00,
        assignedAt: '2026-11-08T16:00:00Z'
      }
    ],
    updates: [
      {
        id: 'up-103-1',
        timestamp: '2026-11-08T16:15:00Z',
        author: 'Técnico Demo 1',
        note: 'Cadena nueva 420H montada y alineada con la corona trasera. Se espera respuesta del cliente para autorizar purgado de bomba hidráulica.',
        progressPercent: 50,
        photos: [],
        type: 'estado'
      }
    ]
  },
  {
    id: 'ord-104',
    code: 'ORD-2026-004',
    title: 'Drift Trike Eléctrico 36V (Cliente Demo 4)',
    clientName: 'Cliente Demo 4',
    clientPhone: '00000000',
    clientEmail: 'cliente4@example.com',
    category: 'Sistema Eléctrico & Baterías',
    priority: 'Urgente',
    status: 'Pendiente',
    progress: 10,
    estimatedBudget: 60.00,
    actualCost: 0,
    assignedTo: 'Técnico Demo 2',
    location: 'Bahía 2 - Laboratorio Eléctrico',
    description: 'Rueda motriz delantera sin tracción tras derrape en pavimento. Luz del acelerador titila 4 veces indicando error de controlador.',
    createdAt: '2026-11-10T08:30:00Z',
    deadline: '2026-11-12T18:00:00Z',
    materialsUsed: [],
    updates: [
      {
        id: 'up-104-1',
        timestamp: '2026-11-10T09:00:00Z',
        author: 'Bodega Demo',
        note: 'Recepción en bodega. Asignado a Técnico Demo 2 para revisión del controlador.',
        progressPercent: 10,
        photos: [],
        type: 'nota'
      }
    ]
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-101',
    code: 'TSK-101',
    orderId: 'ord-101',
    orderCode: 'ORD-2026-001',
    title: 'Calibración de válvulas y carburador PZ19 en Cuadrimoto 110cc',
    description: 'Ajustar holgura de punterías en 0.05mm admisión / 0.07mm escape y regular tornillo de mezcla de aire.',
    assignedTo: 'Técnico Demo 1',
    priority: 'Alta',
    status: 'En Progreso',
    progress: 60,
    dueDate: '2026-11-11',
    estimatedHours: 2.5,
    actualHours: 1.5,
    checklist: [
      { id: 'chk-1', text: 'Limpieza con solvente y sopleteado de chicleres', completed: true },
      { id: 'chk-2', text: 'Verificar nivel de flotador y aguja de campana', completed: true },
      { id: 'chk-3', text: 'Ajuste de ralentí a 1,500 RPM en caliente', completed: false },
      { id: 'chk-4', text: 'Prueba de aceleración a fondo sin ahogo', completed: false }
    ],
    updates: [],
    createdAt: '2026-11-08T10:00:00Z'
  },
  {
    id: 'tsk-102',
    code: 'TSK-102',
    orderId: 'ord-102',
    orderCode: 'ORD-2026-002',
    title: 'Testeo de celdas de batería y prueba de corte de acelerador',
    description: 'Medir voltaje por bloque y probar microswitch de corte de seguridad en maneta de freno.',
    assignedTo: 'Técnico Demo 2',
    priority: 'Media',
    status: 'Pendiente',
    progress: 20,
    dueDate: '2026-11-12',
    estimatedHours: 3.0,
    actualHours: 0.5,
    checklist: [
      { id: 'chk-102-1', text: 'Revisión de arnés y conector Anderson/XT60', completed: true },
      { id: 'chk-102-2', text: 'Verificar señal de sensor Hall del motor 500W', completed: false },
      { id: 'chk-102-3', text: 'Prueba de corte por bajo voltaje del controlador', completed: false }
    ],
    updates: [],
    createdAt: '2026-11-09T11:30:00Z'
  },
  {
    id: 'tsk-103',
    code: 'TSK-103',
    title: 'Auditoría mensual de stock de repuestos críticos en Bodega Importoys',
    description: 'Conteo físico de baterías 36V/48V, carburadores PZ19/PZ22, cadenas 420 y pastillas de freno ATV.',
    assignedTo: 'Bodega Demo',
    priority: 'Media',
    status: 'En Progreso',
    progress: 50,
    dueDate: '2026-11-15',
    estimatedHours: 4.0,
    actualHours: 2.0,
    checklist: [
      { id: 'chk-103-1', text: 'Verificar existencias de baterías de litio', completed: true },
      { id: 'chk-103-2', text: 'Revisión de stock mínimo en tiradores de arranque', completed: true },
      { id: 'chk-103-3', text: 'Etiquetado de gavetas y actualización en sistema', completed: false }
    ],
    updates: [],
    createdAt: '2026-11-05T08:00:00Z'
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    timestamp: '2026-11-04T10:00:00Z',
    productId: 'prod-1',
    productName: 'Batería de Litio 36V 10Ah para Moto Cross Eléctrica / Drift Trike',
    sku: 'BAT-LIT-36V10A',
    type: 'ENTRADA',
    quantity: 10,
    previousStock: 0,
    newStock: 10,
    reason: 'Importación de contenedor directo desde fábrica',
    referenceDoc: 'IMP-SV-2026-88',
    user: 'Bodega Demo'
  },
  {
    id: 'mov-2',
    timestamp: '2026-11-08T14:30:00Z',
    productId: 'prod-4',
    productName: 'Carburador Deportivo PZ19 19mm para Cuadrimoto 110cc / Pit Bike',
    sku: 'CARB-PZ19-ATV',
    type: 'SALIDA',
    quantity: 1,
    previousStock: 13,
    newStock: 12,
    reason: 'Baja por consumo en reparación ORD-2026-001 (Cuadrimoto ATV 110cc)',
    orderCode: 'ORD-2026-001',
    user: 'Técnico Demo 1'
  },
  {
    id: 'mov-3',
    timestamp: '2026-11-08T14:35:00Z',
    productId: 'prod-6',
    productName: 'Tirador de Arranque en Aluminio Reforzado (Pull Start) 49cc',
    sku: 'PULL-ALUM-49CC',
    type: 'SALIDA',
    quantity: 1,
    previousStock: 15,
    newStock: 14,
    reason: 'Baja por consumo en reparación ORD-2026-001 (Cuadrimoto ATV 110cc)',
    orderCode: 'ORD-2026-001',
    user: 'Técnico Demo 1'
  },
  {
    id: 'mov-4',
    timestamp: '2026-11-08T16:00:00Z',
    productId: 'prod-7',
    productName: 'Cadena de Tracción Reforzada 420H 102 Eslabones (Cuadrimoto 110-125cc)',
    sku: 'CAD-420H-102L',
    type: 'SALIDA',
    quantity: 1,
    previousStock: 16,
    newStock: 15,
    reason: 'Baja por consumo en reparación ORD-2026-003 (Go Kart Buggy 200cc)',
    orderCode: 'ORD-2026-003',
    user: 'Técnico Demo 1'
  }
];

export const TEAM_MEMBERS = [
  'Técnico Demo 1 (Mecánica)',
  'Técnico Demo 2 (Especialista Eléctrico)',
  'Bodega Demo (Despacho de Repuestos)',
  'Supervisor Demo (Taller & Calidad)'
];

export const CATEGORIES = [
  'Reparación de Motor & Carburación',
  'Sistema Eléctrico & Baterías',
  'Frenos & Transmisión',
  'Diagnóstico & Ajuste General',
  'Ensamble y Preparación de Entrega PDI',
  'Mantenimiento Preventivo Periódico'
];

export const INVENTORY_CATEGORIES = [
  'Baterías & Eléctrico',
  'Motores & Carburación',
  'Transmisión & Cadenas',
  'Frenos & Suspensión',
  'Llantas & Neumáticos',
  'Mandos & Controles',
  'Chasis & Carrocería'
];

export function loadStoredData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultData: AppData = {
        version: 2,
        lastUpdated: new Date().toISOString(),
        orders: INITIAL_ORDERS,
        tasks: INITIAL_TASKS,
        products: INITIAL_PRODUCTS,
        movements: INITIAL_MOVEMENTS,
        categories: CATEGORIES,
        teamMembers: TEAM_MEMBERS,
        technicians: INITIAL_TECHNICIANS
      };
      saveStoredData(defaultData);
      return defaultData;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Schema check and technician backfill if older version
    if (!parsed.orders || !parsed.tasks || !parsed.products) {
      throw new Error('Formato no válido');
    }
    if (!parsed.technicians || parsed.technicians.length === 0) {
      parsed.technicians = INITIAL_TECHNICIANS;
    }
    return parsed;
  } catch (err) {
    console.warn('Error leyendo localStorage, reestableciendo estado inicial de Importoys SV:', err);
    const defaultData: AppData = {
      version: 2,
      lastUpdated: new Date().toISOString(),
      orders: INITIAL_ORDERS,
      tasks: INITIAL_TASKS,
      products: INITIAL_PRODUCTS,
      movements: INITIAL_MOVEMENTS,
      categories: CATEGORIES,
      teamMembers: TEAM_MEMBERS,
      technicians: INITIAL_TECHNICIANS
    };
    saveStoredData(defaultData);
    return defaultData;
  }
}

export function saveStoredData(data: AppData): void {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
  }
}

export function resetStoredData(): AppData {
  const defaultData: AppData = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    orders: INITIAL_ORDERS,
    tasks: INITIAL_TASKS,
    products: INITIAL_PRODUCTS,
    movements: INITIAL_MOVEMENTS,
    categories: CATEGORIES,
    teamMembers: TEAM_MEMBERS,
    technicians: INITIAL_TECHNICIANS
  };
  saveStoredData(defaultData);
  return defaultData;
}
