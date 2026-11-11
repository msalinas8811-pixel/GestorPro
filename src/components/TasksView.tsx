import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckSquare, 
  Clock, 
  Calendar, 
  User, 
  Camera, 
  Edit3, 
  Trash2, 
  Layers, 
  List, 
  Kanban,
  Check, 
  X,
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Task, TaskStatus, Priority, ProgressLog, Order, ChecklistItem } from '../types';

interface TasksViewProps {
  tasks: Task[];
  orders: Order[];
  teamMembers: string[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenPhoto: (url: string, caption?: string) => void;
  onOpenOrder: (orderId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  orders,
  teamMembers,
  onSaveTask,
  onDeleteTask,
  onOpenPhoto,
  onOpenOrder
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [assignedFilter, setAssignedFilter] = useState('Todos');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  // Detail Modal Form state
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newLogNote, setNewLogNote] = useState('');
  const [taskPhotos, setTaskPhotos] = useState<string[]>([]);
  const [logAuthor, setLogAuthor] = useState(teamMembers[0] || 'Técnico Responsable');

  const selectedTask = tasks.find(t => t.id === detailTaskId);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.orderCode && task.orderCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'Todas' || task.priority === priorityFilter;
    const matchesAssigned = assignedFilter === 'Todos' || task.assignedTo.includes(assignedFilter);

    return matchesSearch && matchesPriority && matchesAssigned;
  });

  const statuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'En Revisión', 'Finalizada'];

  const handleOpenCreate = () => {
    const nextNum = tasks.length + 101;
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      code: `TSK-${nextNum}`,
      title: '',
      description: '',
      assignedTo: teamMembers[0] || 'Técnico Demo 1',
      priority: 'Media',
      status: 'Pendiente',
      progress: 0,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      estimatedHours: 4,
      actualHours: 0,
      checklist: [
        { id: 'c-1', text: 'Inspección previa del componente', completed: false },
        { id: 'c-2', text: 'Ejecución técnica según manual', completed: false },
        { id: 'c-3', text: 'Registro fotográfico de conformidad', completed: false }
      ],
      updates: [],
      createdAt: new Date().toISOString()
    };
    setEditingTask(newTask);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask({ ...task });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) {
      alert('Por favor ingrese un título para la tarea.');
      return;
    }
    // link orderCode if orderId exists
    if (editingTask.orderId) {
      const parent = orders.find(o => o.id === editingTask.orderId);
      if (parent) editingTask.orderCode = parent.code;
    } else {
      editingTask.orderCode = undefined;
    }
    onSaveTask(editingTask);
    setIsEditModalOpen(false);
  };

  // Change Task Status quickly
  const handleChangeStatus = (task: Task, newStatus: TaskStatus) => {
    const updated: Task = {
      ...task,
      status: newStatus,
      progress: newStatus === 'Finalizada' ? 100 : task.progress,
      completedAt: newStatus === 'Finalizada' ? new Date().toISOString() : task.completedAt
    };
    onSaveTask(updated);
  };

  // Toggle checklist item
  const handleToggleChecklist = (task: Task, itemId: string) => {
    const newChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const completedCount = newChecklist.filter(c => c.completed).length;
    const progress = newChecklist.length > 0 ? Math.round((completedCount / newChecklist.length) * 100) : task.progress;

    const updated: Task = {
      ...task,
      checklist: newChecklist,
      progress,
      status: progress === 100 ? 'Finalizada' : task.status === 'Pendiente' ? 'En Progreso' : task.status,
      completedAt: progress === 100 ? new Date().toISOString() : task.completedAt
    };
    onSaveTask(updated);
  };

  // Add checklist item in detail modal
  const handleAddChecklistItem = (task: Task) => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false
    };
    const newChecklist = [...task.checklist, newItem];
    const completedCount = newChecklist.filter(c => c.completed).length;
    const progress = Math.round((completedCount / newChecklist.length) * 100);

    const updated: Task = {
      ...task,
      checklist: newChecklist,
      progress
    };
    onSaveTask(updated);
    setNewChecklistText('');
  };

  // Upload Photo inside task detail
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTaskPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Task Progress Note + Photos
  const handleAddTaskLog = (task: Task) => {
    if (!newLogNote.trim() && taskPhotos.length === 0) return;

    const newLog: ProgressLog = {
      id: `t-up-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: logAuthor,
      note: newLogNote.trim() || 'Fotografías de avance de tarea adjuntadas',
      photos: [...taskPhotos],
      type: taskPhotos.length > 0 ? 'foto' : 'nota'
    };

    const updated: Task = {
      ...task,
      updates: [newLog, ...(task.updates || [])]
    };
    onSaveTask(updated);
    setNewLogNote('');
    setTaskPhotos([]);
  };

  const getPriorityBadge = (p: Priority) => {
    const styles: Record<Priority, string> = {
      'Urgente': 'text-rose-700 bg-rose-50 border-rose-200',
      'Alta': 'text-amber-700 bg-amber-50 border-amber-200',
      'Media': 'text-blue-700 bg-blue-50 border-blue-200',
      'Baja': 'text-slate-600 bg-slate-50 border-slate-200'
    };
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${styles[p]}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código de tarea, título u orden OT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="Todas">Todas las prioridades</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>

            {/* Toggle view mode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vista Tablero Kanban"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vista Listado"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Registrar Nueva Tarea
        </button>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {statuses.map((status) => {
            const columnTasks = filteredTasks.filter(t => t.status === status);
            return (
              <div key={status} className="bg-slate-100/70 rounded-xl p-3 border border-slate-200/80 space-y-3">
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{status}</h3>
                    <span className="text-[11px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 min-h-[300px]">
                  {columnTasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                      Sin tareas en esta etapa
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setDetailTaskId(task.id)}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs space-y-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-blue-600">
                            {task.code}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {task.title}
                          </h4>
                          {task.orderCode && (
                            <span className="inline-block text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1.5">
                              {task.orderCode}
                            </span>
                          )}
                        </div>

                        {/* Checklist progress */}
                        {task.checklist && task.checklist.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                              <span>Checklist ({task.checklist.filter(c => c.completed).length}/{task.checklist.length})</span>
                              <span className="font-mono">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer details: Assignee & Move status controls */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate text-[11px] font-medium text-slate-700">
                            {task.assignedTo.split(' ')[0]}
                          </span>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {status !== 'Pendiente' && (
                              <button
                                onClick={() => {
                                  const idx = statuses.indexOf(status);
                                  handleChangeStatus(task, statuses[idx - 1]);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition-colors"
                                title="Mover a etapa anterior"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {status !== 'Finalizada' && (
                              <button
                                onClick={() => {
                                  const idx = statuses.indexOf(status);
                                  handleChangeStatus(task, statuses[idx + 1]);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition-colors"
                                title="Avanzar etapa"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Tarea & Orden</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Progreso</th>
                  <th className="py-3 px-4">Asignado</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No hay tareas registradas con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setDetailTaskId(task.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {task.code}
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </div>
                        {task.orderCode && (
                          <div className="text-[11px] font-mono text-slate-500">
                            {task.orderCode}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{task.status}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] tabular-nums">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {task.assignedTo.split(' ')[0]}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar la tarea ${task.code}?`)) {
                                onDeleteTask(task.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR TASK */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  {selectedTask.code}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTask.title}
                </h3>
              </div>
              <button onClick={() => setDetailTaskId(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Task Details Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Estado:</span>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleChangeStatus(selectedTask, e.target.value as TaskStatus)}
                    className="font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Asignado a:</span>
                  <span className="font-semibold text-slate-800">{selectedTask.assignedTo}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Fecha Vencimiento:</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedTask.dueDate}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Horas (Reales / Est.):</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedTask.actualHours}h / {selectedTask.estimatedHours}h</span>
                </div>
              </div>

              {/* Linked Order Banner */}
              {selectedTask.orderId && (
                <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-lg border border-blue-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-900">Orden de Trabajo vinculada:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedTask.orderCode}</span>
                  </div>
                  <button
                    onClick={() => {
                      setDetailTaskId(null);
                      onOpenOrder(selectedTask.orderId!);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Ver Orden</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Interactive Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Checklist de Tareas / Procedimiento ({selectedTask.checklist?.filter(c => c.completed).length || 0}/{selectedTask.checklist?.length || 0})
                  </h4>
                  <span className="font-mono text-xs font-bold text-blue-600">{selectedTask.progress}% Completado</span>
                </div>

                <div className="space-y-2">
                  {selectedTask.checklist?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(selectedTask, item.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                        item.completed ? 'bg-emerald-50/60 border-emerald-200 text-slate-700 line-through' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {item.completed && <Check className="w-3 h-3" />}
                      </div>
                      <span className="flex-1">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Add Checklist Item */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Agregar nuevo paso al procedimiento..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem(selectedTask);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white"
                  />
                  <button
                    onClick={() => handleAddChecklistItem(selectedTask)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Agregar Paso
                  </button>
                </div>
              </div>

              {/* Progress and Photo Evidence Logs */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Avances y Evidencia Fotográfica de la Tarea
                </h4>

                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <textarea
                    rows={2}
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    placeholder="Registrar nota técnica, medición o hallazgo..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer">
                      <Camera className="w-4 h-4 text-slate-500" />
                      Adjuntar Fotos
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>

                    <button
                      onClick={() => handleAddTaskLog(selectedTask)}
                      disabled={!newLogNote.trim() && taskPhotos.length === 0}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
                    >
                      Guardar Avance
                    </button>
                  </div>

                  {taskPhotos.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      {taskPhotos.map((p, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border">
                          <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Updates Timeline */}
                <div className="space-y-3">
                  {selectedTask.updates?.map((log) => (
                    <div key={log.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-slate-700">{log.author}</span>
                        <span>{new Date(log.timestamp).toLocaleString('es-ES')}</span>
                      </div>
                      <p className="text-slate-700">{log.note}</p>
                      {log.photos && log.photos.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          {log.photos.map((ph, phI) => (
                            <img
                              key={phI}
                              src={ph}
                              alt="Foto"
                              onClick={() => onOpenPhoto(ph, log.note)}
                              className="w-20 h-16 object-cover rounded cursor-pointer border hover:scale-105 transition-transform"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between">
              <button
                onClick={() => {
                  setDetailTaskId(null);
                  handleOpenEdit(selectedTask);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Editar Datos Principales
              </button>
              <button
                onClick={() => setDetailTaskId(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingTask.id.startsWith('tsk-') ? 'Crear / Editar Tarea' : 'Editar Tarea'} ({editingTask.code})
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={editingTask.code}
                    onChange={(e) => setEditingTask({ ...editingTask, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Orden de Trabajo (Opcional)</label>
                  <select
                    value={editingTask.orderId || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, orderId: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  >
                    <option value="">-- Sin orden vinculada --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.code} - {o.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Título de la Tarea *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Rebobinado de estator de motor eléctrico..."
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Prioridad</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Responsable</label>
                  <select
                    value={editingTask.assignedTo}
                    onChange={(e) => setEditingTask({ ...editingTask, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  >
                    {teamMembers.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Horas Estimadas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingTask.estimatedHours}
                    onChange={(e) => setEditingTask({ ...editingTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Horas Reales</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingTask.actualHours}
                    onChange={(e) => setEditingTask({ ...editingTask, actualHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Descripción de la Tarea</label>
                <textarea
                  rows={3}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Detalles sobre especificaciones, herramientas requeridas o protocolos..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
