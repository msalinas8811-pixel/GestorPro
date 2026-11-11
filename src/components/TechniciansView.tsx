import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  Wrench, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Search, 
  Sparkles,
  ClipboardList,
  CheckSquare,
  Lock,
  Layers,
  Check
} from 'lucide-react';
import { TechnicianUser, Order, Task } from '../types';

interface TechniciansViewProps {
  technicians: TechnicianUser[];
  orders: Order[];
  tasks: Task[];
  onSaveTechnician: (tech: TechnicianUser) => void;
  onDeleteTechnician: (id: string) => void;
}

export const TechniciansView: React.FC<TechniciansViewProps> = ({
  technicians,
  orders,
  tasks,
  onSaveTechnician,
  onDeleteTechnician
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<TechnicianUser | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [role, setRole] = useState<'administrador' | 'supervisor' | 'tecnico' | 'bodeguero'>('tecnico');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Specialties presets for Importoys SV
  const SPECIALTY_OPTIONS = [
    'Mecánica Motores 2T & 4T (Motos, Cuadrimotos, Go Karts)',
    'Especialista Eléctrico (36V/48V, Baterías, Controladores & Motores Brushless)',
    'Encargado(a) de Bodega & Despacho de Repuestos',
    'Frenos Hidráulicos & Transmisión de Cadena',
    'Supervisor General de Taller & Pruebas en Pista',
    'Ensamble y Preparación de Vehículos Nuevos (PDI)'
  ];

  const handleOpenCreateModal = () => {
    setEditingTech(null);
    setFullName('');
    setUsername('');
    setPin(String(Math.floor(1000 + Math.random() * 9000))); // Random 4-digit PIN default
    setSpecialty(SPECIALTY_OPTIONS[0]);
    setRole('tecnico');
    setEmail('');
    setPhone('');
    setActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tech: TechnicianUser) => {
    setEditingTech(tech);
    setFullName(tech.fullName);
    setUsername(tech.username);
    setPin(tech.pin);
    setSpecialty(tech.specialty);
    setRole(tech.role);
    setEmail(tech.email || '');
    setPhone(tech.phone || '');
    setActive(tech.active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Por favor ingresa el nombre completo del técnico u operador.');
      return;
    }
    if (!username.trim()) {
      setFormError('El usuario de acceso es requerido.');
      return;
    }
    if (!pin.trim() || pin.length < 3) {
      setFormError('El PIN o clave debe tener al menos 3 dígitos.');
      return;
    }

    // Check duplicate username if new
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '.');
    const duplicate = technicians.find(
      t => t.username.toLowerCase() === cleanUsername && t.id !== editingTech?.id
    );
    if (duplicate) {
      setFormError(`El usuario "${cleanUsername}" ya existe. Por favor elige otro.`);
      return;
    }

    const techToSave: TechnicianUser = {
      id: editingTech ? editingTech.id : `tech-${Date.now()}`,
      fullName: fullName.trim(),
      username: cleanUsername,
      pin: pin.trim(),
      email: email.trim() || undefined,
      specialty: specialty.trim() || 'Técnico General',
      role,
      phone: phone.trim() || undefined,
      active,
      createdAt: editingTech ? editingTech.createdAt : new Date().toISOString()
    };

    onSaveTechnician(techToSave);
    setIsModalOpen(false);
    setSuccessToast(
      editingTech 
        ? `¡Datos de ${techToSave.fullName} actualizados con éxito!` 
        : `¡Operador ${techToSave.fullName} dado de alta con usuario "${techToSave.username}" y PIN ${techToSave.pin}!`
    );
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const filteredTechnicians = technicians.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.fullName.toLowerCase().includes(term) ||
      t.username.toLowerCase().includes(term) ||
      t.specialty.toLowerCase().includes(term) ||
      (t.phone && t.phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium text-sm">{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
              Control de Accesos
            </span>
            <span className="text-xs text-slate-500 font-mono">Taller & Bodega Importoys SV</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Gestión de Técnicos y Usuarios de Bodega
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Crea los usuarios y PINs de acceso para que los operarios inicien sesión en el Panel de Bodega / Taller.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Dar de Alta Usuario</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Usuarios</p>
            <p className="text-2xl font-black text-slate-900">{technicians.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Usuarios Activos</p>
            <p className="text-2xl font-black text-emerald-600">
              {technicians.filter(t => t.active).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Técnicos Mecánicos</p>
            <p className="text-2xl font-black text-slate-900">
              {technicians.filter(t => t.role === 'tecnico').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bodega & Control</p>
            <p className="text-2xl font-black text-slate-900">
              {technicians.filter(t => t.role === 'bodeguero' || t.role === 'supervisor').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario de acceso, especialidad o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Technicians Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTechnicians.map((tech) => {
          const assignedOrders = orders.filter(o => o.assignedTo.includes(tech.fullName.split(' ')[0]));
          const activeOrders = assignedOrders.filter(o => o.status !== 'Completada' && o.status !== 'Cancelada');
          const assignedTasks = tasks.filter(t => t.assignedTo.includes(tech.fullName.split(' ')[0]));

          return (
            <div 
              key={tech.id} 
              className={`bg-white rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between relative shadow-sm ${
                tech.active ? 'border-slate-200 hover:border-slate-300 hover:shadow-md' : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div>
                {/* Header Badge & Status */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    tech.role === 'administrador'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : tech.role === 'supervisor'
                      ? 'bg-purple-100 text-purple-700'
                      : tech.role === 'bodeguero'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tech.role === 'administrador' ? '👑 Administrador' : tech.role === 'supervisor' ? '⭐ Supervisor' : tech.role === 'bodeguero' ? '📦 Encargado Bodega' : '🔧 Técnico de Taller'}
                  </span>

                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    tech.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tech.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {tech.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Name & Specialty */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-inner">
                    {tech.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {tech.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tech.specialty}
                    </p>
                  </div>
                </div>

                {/* Login Credentials Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Usuario de Ingreso:
                    </span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {tech.username}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      PIN de Acceso:
                    </span>
                    <span className="font-mono font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {tech.pin}
                    </span>
                  </div>

                  {tech.phone && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Teléfono:
                      </span>
                      <span className="text-slate-700 font-medium">
                        {tech.phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Workload Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Órdenes Activas</p>
                      <p className="text-sm font-bold text-slate-900">{activeOrders.length}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Tareas</p>
                      <p className="text-sm font-bold text-slate-900">{assignedTasks.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEditModal(tech)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Perfil & PIN</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de eliminar el usuario de ${tech.fullName}?`)) {
                      onDeleteTechnician(tech.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Eliminar usuario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTechnicians.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No se encontraron técnicos</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            No hay ningún operario que coincida con el criterio de búsqueda.
          </p>
        </div>
      )}

      {/* Modal for Creating / Editing Technician */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-red-400">
                  {editingTech ? 'Editar Usuario' : 'Nuevo Registro'}
                </span>
                <h3 className="text-xl font-black">
                  {editingTech ? 'Modificar Operador de Taller' : 'Alta de Usuario de Bodega & Taller'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre Completo del Operario / Técnico *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: José Martínez"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (!editingTech && !username) {
                      // Suggest username automatically from name
                      const parts = e.target.value.toLowerCase().trim().split(' ');
                      if (parts.length >= 2) {
                        setUsername(`${parts[0]}.${parts[1][0]}`);
                      } else if (parts[0]) {
                        setUsername(parts[0]);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              {/* Username & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Usuario de Acceso *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ej: jose.m"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Identificador con el que entrará a bodega</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    PIN o Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ej: 1234"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Clave de 4 dígitos o contraseña</p>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Rol y Privilegios en el Sistema *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('administrador');
                      setSpecialty('Administración General & Control');
                    }}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                      role === 'administrador' 
                        ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-500/20' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    👑 Administrador
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('supervisor')}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                      role === 'supervisor' 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⭐ Supervisor
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('tecnico')}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                      role === 'tecnico' 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔧 Técnico Taller
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('bodeguero')}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                      role === 'bodeguero' 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📦 Encargado Bodega
                  </button>
                </div>
              </div>

              {/* Optional Google Email for Co-Administrators */}
              {role === 'administrador' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-red-900 mb-1">
                    Correo de Google del Administrador (Opcional):
                  </label>
                  <input
                    type="email"
                    placeholder="ej: usuario@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-[10px] text-red-700">
                    Podrá ingresar con Google con este correo o mediante su Usuario y PIN.
                  </p>
                </div>
              )}

              {/* Specialty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Especialidad / Área de Trabajo
                </label>
                <input
                  type="text"
                  list="specialty-suggestions"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Selecciona o escribe la especialidad..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
                <datalist id="specialty-suggestions">
                  {SPECIALTY_OPTIONS.map((opt, i) => (
                    <option key={i} value={opt} />
                  ))}
                </datalist>
              </div>

              {/* Phone & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="+503 7000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Estado de la Cuenta
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        {active ? 'Usuario Habilitado' : 'Usuario Inactivo'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {editingTech ? 'Guardar Cambios' : 'Registrar Operador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
