import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Users, Star, Clock, Award, Search, Filter, UserCheck, UserX, Calendar, Phone, Mail, MapPin, Camera, AlertCircle, CheckCircle, TrendingUp, Shield, RefreshCw } from 'lucide-react';
import { StaffMember, ServiceCategory } from '../types';
import { staffMembers as defaultStaff } from '../data/staff';
import { serviceCategories } from '../data/services';
import { getCurrentUser } from '../utils/auth';
import { useTheme } from '../hooks/useTheme';
import { 
  handleStaffDeletion, 
  handleStaffUpdate, 
  getFutureAppointmentsForStaff,
  getAllAppointmentsForStaff,
  getIntegrityLog,
  cleanupOrphanedAppointments
} from '../utils/staffIntegrity';

const STORAGE_KEY = 'beauty-salon-staff';

const StaffManager: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSpecialty, setFilterSpecialty] = useState<ServiceCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<{
    staff: StaffMember | null;
    futureAppointments: number;
    totalAppointments: number;
  }>({ staff: null, futureAppointments: 0, totalAppointments: 0 });
  const [deleteAction, setDeleteAction] = useState<'cancel' | 'reassign'>('cancel');
  const [reassignToStaffId, setReassignToStaffId] = useState<string>('');

  const currentUser = getCurrentUser();

  // Real-time theme
  const { colors } = useTheme();

  useEffect(() => {
    loadStaff();
    // Clean up orphaned appointments on component mount
    cleanupOrphanedData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadStaff = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setStaff(JSON.parse(stored));
    } else {
      // Initialize with default staff
      setStaff(defaultStaff);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStaff));
    }
  };

  const saveStaff = (staffList: StaffMember[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staffList));
    setStaff(staffList);
  };

  const cleanupOrphanedData = () => {
    const currentStaff = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const cleanedCount = cleanupOrphanedAppointments(currentStaff);
    
    if (cleanedCount > 0) {
      setMessage({ 
        type: 'warning', 
        text: `Se limpiaron ${cleanedCount} citas huérfanas automáticamente.` 
      });
    }
  };

  const handleSaveStaff = (staffData: Partial<StaffMember>) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      if (staffData.id) {
        // Update existing staff
        const oldStaff = staff.find(s => s.id === staffData.id);
        if (!oldStaff) {
          setMessage({ type: 'error', text: 'Empleado no encontrado' });
          return;
        }

        const updatedStaff = { 
          ...oldStaff, 
          ...staffData, 
          updatedAt: new Date().toISOString() 
        };

        const updatedStaffList = staff.map(s => 
          s.id === staffData.id ? updatedStaff : s
        );

        saveStaff(updatedStaffList);

        // Handle integrity for staff updates
        const integrityResult = handleStaffUpdate(oldStaff, updatedStaff);
        
        if (integrityResult.success) {
          setMessage({ 
            type: 'success', 
            text: `Empleado actualizado exitosamente. ${integrityResult.message}` 
          });
        } else {
          setMessage({ 
            type: 'warning', 
            text: `Empleado actualizado con advertencias: ${integrityResult.message}` 
          });
        }
      } else {
        // Create new staff
        const newStaff: StaffMember = {
          ...staffData as Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rating: 5.0,
          completedServices: 0
        };
        saveStaff([...staff, newStaff]);
        setMessage({ type: 'success', text: 'Empleado agregado exitosamente' });
      }
      
      setEditingStaff(null);
      setShowAddForm(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar empleado' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = (staffToDelete: StaffMember) => {
    if (!currentUser) return;
    
    // Get appointment counts for confirmation dialog
    const futureAppointments = getFutureAppointmentsForStaff(staffToDelete.id);
    const totalAppointments = getAllAppointmentsForStaff(staffToDelete.id);
    
    setShowDeleteConfirmation({
      staff: staffToDelete,
      futureAppointments: futureAppointments.length,
      totalAppointments: totalAppointments.length
    });
  };

  const confirmDeleteStaff = () => {
    if (!showDeleteConfirmation.staff || !currentUser) return;

    setLoading(true);
    try {
      const staffToDelete = showDeleteConfirmation.staff;
      
      // Handle integrity before deletion
      const integrityResult = handleStaffDeletion(
        staffToDelete, 
        deleteAction,
        deleteAction === 'reassign' ? reassignToStaffId : undefined
      );

      if (integrityResult.success) {
        // Remove staff from list
        const updatedStaff = staff.filter(s => s.id !== staffToDelete.id);
        saveStaff(updatedStaff);
        
        setMessage({ 
          type: 'success', 
          text: `Empleado eliminado exitosamente. ${integrityResult.message}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Error al eliminar empleado: ${integrityResult.message}` 
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error del sistema al eliminar empleado' });
    } finally {
      setLoading(false);
      setShowDeleteConfirmation({ staff: null, futureAppointments: 0, totalAppointments: 0 });
      setDeleteAction('cancel');
      setReassignToStaffId('');
    }
  };

  const handleToggleStatus = (staffId: string) => {
    if (!currentUser) return;
    
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return;

    const updatedStaffMember = { 
      ...staffMember, 
      isActive: !staffMember.isActive, 
      updatedAt: new Date().toISOString() 
    };

    const updatedStaff = staff.map(s => 
      s.id === staffId ? updatedStaffMember : s
    );

    saveStaff(updatedStaff);

    // Handle integrity for status changes
    const integrityResult = handleStaffUpdate(staffMember, updatedStaffMember);
    
    if (integrityResult.success) {
      setMessage({ 
        type: 'success', 
        text: `Estado del empleado actualizado. ${integrityResult.message}` 
      });
    } else {
      setMessage({ 
        type: 'warning', 
        text: `Estado actualizado con advertencias: ${integrityResult.message}` 
      });
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.isActive) ||
                         (filterStatus === 'inactive' && !member.isActive);
    const matchesSpecialty = filterSpecialty === 'all' || 
                            member.specialties.includes(filterSpecialty);
    
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const getStaffStats = () => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.isActive).length;
    const avgRating = staff.reduce((sum, s) => sum + s.rating, 0) / totalStaff || 0;
    const totalServices = staff.reduce((sum, s) => sum + s.completedServices, 0);
    
    return { totalStaff, activeStaff, avgRating, totalServices };
  };

  const stats = getStaffStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="text-2xl font-bold flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <Users className="w-8 h-8 mr-3" style={{ color: colors?.accent || '#8b5cf6' }} />
            Gestión de Personal
          </h2>
          <p 
            className="mt-1 theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            Administra el equipo de especialistas del salón con integridad referencial
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={cleanupOrphanedData}
            className="flex items-center px-3 py-2 rounded-lg transition-colors theme-transition"
            style={{ 
              backgroundColor: colors?.background || '#f8fafc',
              color: colors?.textSecondary || '#6b7280'
            }}
            title="Limpiar datos huérfanos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 text-white rounded-lg transition-colors theme-transition"
            style={{ backgroundColor: colors?.accent || '#8b5cf6' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Empleado
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div 
          className="p-4 rounded-lg border theme-transition"
          style={{
            backgroundColor: message.type === 'success' 
              ? `${colors?.success || '#10b981'}0d` 
              : message.type === 'warning'
                ? `${colors?.warning || '#f59e0b'}0d`
                : `${colors?.error || '#ef4444'}0d`,
            borderColor: message.type === 'success' 
              ? `${colors?.success || '#10b981'}33` 
              : message.type === 'warning'
                ? `${colors?.warning || '#f59e0b'}33`
                : `${colors?.error || '#ef4444'}33`,
            color: message.type === 'success' 
              ? (colors?.success || '#10b981') 
              : message.type === 'warning'
                ? (colors?.warning || '#f59e0b')
                : (colors?.error || '#ef4444')
          }}
        >
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : message.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Total Empleados
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                {stats.totalStaff}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.primary || '#0ea5e9'}1a` }}
            >
              <Users className="w-6 h-6" style={{ color: colors?.primary || '#0ea5e9' }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Empleados Activos
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.success || '#10b981' }}
              >
                {stats.activeStaff}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.success || '#10b981'}1a` }}
            >
              <UserCheck className="w-6 h-6" style={{ color: colors?.success || '#10b981' }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Calificación Promedio
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.warning || '#f59e0b' }}
              >
                {stats.avgRating.toFixed(1)}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.warning || '#f59e0b'}1a` }}
            >
              <Star className="w-6 h-6" style={{ color: colors?.warning || '#f59e0b' }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Servicios Totales
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.accent || '#8b5cf6' }}
              >
                {stats.totalServices}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.accent || '#8b5cf6'}1a` }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: colors?.accent || '#8b5cf6' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div 
        className="rounded-xl shadow-lg p-6 theme-transition"
        style={{ backgroundColor: colors?.surface || '#ffffff' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            />
            <input
              type="text"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.background || '#f8fafc',
                color: colors?.text || '#1f2937'
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full pl-10 pr-8 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.background || '#f8fafc',
                color: colors?.text || '#1f2937'
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div className="relative">
            <Award 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            />
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value as any)}
              className="w-full pl-10 pr-8 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.background || '#f8fafc',
                color: colors?.text || '#1f2937'
              }}
            >
              <option value="all">Todas las especialidades</option>
              {serviceCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStaff.map(member => (
          <StaffCard
            key={member.id}
            staff={member}
            isEditing={editingStaff === member.id}
            onEdit={() => setEditingStaff(member.id)}
            onSave={handleSaveStaff}
            onCancel={() => setEditingStaff(null)}
            onDelete={() => handleDeleteStaff(member)}
            onToggleStatus={() => handleToggleStatus(member.id)}
            loading={loading}
            futureAppointments={getFutureAppointmentsForStaff(member.id).length}
          />
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4" style={{ color: colors?.textSecondary || '#6b7280' }} />
          <h3 
            className="text-lg font-medium mb-2 theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            {searchTerm || filterStatus !== 'all' || filterSpecialty !== 'all'
              ? 'No se encontraron empleados con los filtros aplicados'
              : 'No hay empleados registrados'
            }
          </h3>
          <p 
            className="theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            {searchTerm || filterStatus !== 'all' || filterSpecialty !== 'all'
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'Agrega empleados para comenzar a gestionar tu equipo.'
            }
          </p>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddForm && (
        <AddStaffModal
          onSave={handleSaveStaff}
          onCancel={() => setShowAddForm(false)}
          loading={loading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation.staff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto theme-transition"
            style={{ backgroundColor: colors?.surface || '#ffffff' }}
          >
            <div 
              className="p-6 border-b theme-transition"
              style={{ borderColor: colors?.border || '#e5e7eb' }}
            >
              <div className="flex items-center justify-between">
                <h3 
                  className="text-xl font-semibold theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Confirmar Eliminación de Empleado
                </h3>
                <button
                  onClick={() => setShowDeleteConfirmation({ staff: null, futureAppointments: 0, totalAppointments: 0 })}
                  className="transition-colors theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div 
                className="p-4 rounded-lg border mb-6 theme-transition"
                style={{ 
                  backgroundColor: `${colors?.error || '#ef4444'}0d`,
                  borderColor: `${colors?.error || '#ef4444'}33`
                }}
              >
                <div className="flex items-start">
                  <Shield className="w-5 h-5 mr-2 mt-0.5" style={{ color: colors?.error || '#ef4444' }} />
                  <div>
                    <h4 
                      className="font-medium theme-transition"
                      style={{ color: colors?.error || '#ef4444' }}
                    >
                      Advertencia de Integridad
                    </h4>
                    <p 
                      className="text-sm mt-1 theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      Estás a punto de eliminar a <strong>{showDeleteConfirmation.staff.name}</strong>.
                    </p>
                    
                    {showDeleteConfirmation.futureAppointments > 0 && (
                      <div 
                        className="mt-2 p-3 rounded-lg theme-transition"
                        style={{ backgroundColor: `${colors?.warning || '#f59e0b'}1a` }}
                      >
                        <p 
                          className="text-sm font-medium theme-transition"
                          style={{ color: colors?.warning || '#f59e0b' }}
                        >
                          ⚠️ Este empleado tiene {showDeleteConfirmation.futureAppointments} citas futuras programadas.
                        </p>
                        <p 
                          className="text-sm mt-1 theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          Selecciona cómo manejar estas citas:
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showDeleteConfirmation.futureAppointments > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="cancel-appointments"
                      checked={deleteAction === 'cancel'}
                      onChange={() => setDeleteAction('cancel')}
                      className="w-4 h-4 theme-transition"
                      style={{ accentColor: colors?.error || '#ef4444' }}
                    />
                    <label 
                      htmlFor="cancel-appointments"
                      className="theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      Cancelar todas las citas futuras
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="reassign-appointments"
                      checked={deleteAction === 'reassign'}
                      onChange={() => setDeleteAction('reassign')}
                      className="w-4 h-4 theme-transition"
                      style={{ accentColor: colors?.primary || '#0ea5e9' }}
                    />
                    <label 
                      htmlFor="reassign-appointments"
                      className="theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      Reasignar citas a otro empleado
                    </label>
                  </div>
                  
                  {deleteAction === 'reassign' && (
                    <div className="ml-6 mt-2">
                      <select
                        value={reassignToStaffId}
                        onChange={(e) => setReassignToStaffId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                        style={{ 
                          border: `1px solid ${colors?.border || '#e5e7eb'}`,
                          backgroundColor: colors?.background || '#f8fafc',
                          color: colors?.text || '#1f2937'
                        }}
                        required
                      >
                        <option value="">Seleccionar empleado</option>
                        {staff
                          .filter(s => s.id !== showDeleteConfirmation.staff?.id && s.isActive)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} - {s.role}
                            </option>
                          ))
                        }
                      </select>
                      
                      {deleteAction === 'reassign' && !reassignToStaffId && (
                        <p 
                          className="text-xs mt-1 theme-transition"
                          style={{ color: colors?.error || '#ef4444' }}
                        >
                          Debes seleccionar un empleado para la reasignación
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div 
                className="p-4 rounded-lg border mb-6 theme-transition"
                style={{ 
                  backgroundColor: colors?.background || '#f8fafc',
                  borderColor: colors?.border || '#e5e7eb'
                }}
              >
                <h4 
                  className="font-medium mb-2 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Resumen de Impacto
                </h4>
                <ul 
                  className="space-y-1 text-sm theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  <li>• Empleado: {showDeleteConfirmation.staff.name}</li>
                  <li>• Rol: {showDeleteConfirmation.staff.role}</li>
                  <li>• Citas futuras afectadas: {showDeleteConfirmation.futureAppointments}</li>
                  <li>• Total de citas históricas: {showDeleteConfirmation.totalAppointments}</li>
                  <li>• Acción seleccionada: {deleteAction === 'cancel' ? 'Cancelar citas' : 'Reasignar citas'}</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation({ staff: null, futureAppointments: 0, totalAppointments: 0 })}
                  className="px-4 py-2 border rounded-lg transition-colors theme-transition"
                  style={{ 
                    color: colors?.textSecondary || '#6b7280',
                    borderColor: colors?.border || '#e5e7eb',
                    backgroundColor: colors?.background || '#f8fafc'
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteStaff}
                  disabled={loading || (deleteAction === 'reassign' && !reassignToStaffId)}
                  className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center theme-transition"
                  style={{ backgroundColor: colors?.error || '#ef4444' }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Eliminar Empleado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Staff Card Component
interface StaffCardProps {
  staff: StaffMember;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<StaffMember>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  loading: boolean;
  futureAppointments: number;
}

const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleStatus,
  loading,
  futureAppointments
}) => {
  const [formData, setFormData] = useState(staff);
  const { colors } = useTheme();

  const handleSave = () => {
    onSave(formData);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-current' : ''
            }`}
            style={{ color: star <= rating ? (colors?.warning || '#f59e0b') : (colors?.border || '#e5e7eb') }}
          />
        ))}
        <span 
          className="ml-1 text-sm theme-transition"
          style={{ color: colors?.textSecondary || '#6b7280' }}
        >
          ({rating})
        </span>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div 
        className="border rounded-xl p-6 theme-transition"
        style={{ 
          backgroundColor: `${colors?.primary || '#0ea5e9'}0d`,
          borderColor: `${colors?.primary || '#0ea5e9'}33`
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4 theme-transition"
          style={{ color: colors?.primary || '#0ea5e9' }}
        >
          Editar Empleado
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.surface || '#ffffff',
                color: colors?.text || '#1f2937'
              }}
            />
            
            <input
              type="text"
              placeholder="Rol/Posición"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.surface || '#ffffff',
                color: colors?.text || '#1f2937'
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Años de experiencia"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.surface || '#ffffff',
                color: colors?.text || '#1f2937'
              }}
            />
            
            <input
              type="url"
              placeholder="URL de imagen"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
              className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.surface || '#ffffff',
                color: colors?.text || '#1f2937'
              }}
            />
          </div>

          <textarea
            placeholder="Biografía del empleado"
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{ 
              border: `1px solid ${colors?.border || '#e5e7eb'}`,
              backgroundColor: colors?.surface || '#ffffff',
              color: colors?.text || '#1f2937'
            }}
            rows={3}
          />

          <div>
            <label 
              className="block text-sm font-medium mb-2 theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              Especialidades
            </label>
            <div className="grid grid-cols-2 gap-2">
              {serviceCategories.map(category => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          specialties: [...formData.specialties, category.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          specialties: formData.specialties.filter(s => s !== category.id)
                        });
                      }
                    }}
                    className="w-4 h-4 rounded focus:ring-2 theme-transition"
                    style={{ accentColor: colors?.accent || '#8b5cf6' }}
                  />
                  <span 
                    className="ml-2 text-sm theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg transition-colors theme-transition"
              style={{ 
                color: colors?.textSecondary || '#6b7280',
                borderColor: colors?.border || '#e5e7eb',
                backgroundColor: colors?.background || '#f8fafc'
              }}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 theme-transition"
              style={{ backgroundColor: colors?.success || '#10b981' }}
              disabled={loading}
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl shadow-lg p-6 border-l-4 theme-transition"
      style={{ 
        backgroundColor: colors?.surface || '#ffffff',
        borderLeftColor: staff.isActive ? (colors?.success || '#10b981') : (colors?.error || '#ef4444')
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={staff.image || "/placeholder.svg"}
            alt={staff.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div>
            <h3 
              className="text-lg font-semibold flex items-center theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {staff.name}
              {staff.isActive ? (
                <UserCheck className="w-4 h-4 ml-2" style={{ color: colors?.success || '#10b981' }} />
              ) : (
                <UserX className="w-4 h-4 ml-2" style={{ color: colors?.error || '#ef4444' }} />
              )}
            </h3>
            <p 
              className="text-sm theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              {staff.role}
            </p>
            {renderStarRating(staff.rating)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg transition-colors theme-transition"
            style={{ 
              color: colors?.primary || '#0ea5e9',
              backgroundColor: `${colors?.primary || '#0ea5e9'}0d`
            }}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleStatus}
            className="p-2 rounded-lg transition-colors theme-transition"
            style={{ 
              color: staff.isActive ? (colors?.error || '#ef4444') : (colors?.success || '#10b981'),
              backgroundColor: staff.isActive ? `${colors?.error || '#ef4444'}0d` : `${colors?.success || '#10b981'}0d`
            }}
          >
            {staff.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg transition-colors theme-transition"
            style={{ 
              color: colors?.error || '#ef4444',
              backgroundColor: `${colors?.error || '#ef4444'}0d`
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bio */}
      <p 
        className="text-sm mb-4 theme-transition"
        style={{ color: colors?.textSecondary || '#6b7280' }}
      >
        {staff.bio}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div 
          className="text-center p-3 rounded-lg theme-transition"
          style={{ backgroundColor: colors?.background || '#f8fafc' }}
        >
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 mr-1" style={{ color: colors?.textSecondary || '#6b7280' }} />
            <span 
              className="text-sm font-medium theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {staff.experience}
            </span>
          </div>
          <span 
            className="text-xs theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            Experiencia
          </span>
        </div>
        
        <div 
          className="text-center p-3 rounded-lg theme-transition"
          style={{ backgroundColor: colors?.background || '#f8fafc' }}
        >
          <div className="flex items-center justify-center mb-1">
            <Award className="w-4 h-4 mr-1" style={{ color: colors?.textSecondary || '#6b7280' }} />
            <span 
              className="text-sm font-medium theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {staff.completedServices}
            </span>
          </div>
          <span 
            className="text-xs theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            Servicios
          </span>
        </div>
      </div>

      {/* Specialties */}
      <div className="space-y-2">
        <span 
          className="text-xs font-medium theme-transition"
          style={{ color: colors?.text || '#1f2937' }}
        >
          Especialidades:
        </span>
        <div className="flex flex-wrap gap-1">
          {staff.specialties.map((specialty) => {
            const category = serviceCategories.find(c => c.id === specialty);
            return (
              <span
                key={specialty}
                className="px-2 py-1 text-xs font-medium rounded-full theme-transition"
                style={{ 
                  backgroundColor: `${colors?.accent || '#8b5cf6'}1a`,
                  color: colors?.accent || '#8b5cf6'
                }}
              >
                {category?.name || specialty}
              </span>
            );
          })}
        </div>
      </div>

      {/* Status and Appointments */}
      <div 
        className="mt-4 pt-4 border-t theme-transition"
        style={{ borderColor: colors?.border || '#e5e7eb' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span 
              className="text-xs theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Actualizado: {new Date(staff.updatedAt).toLocaleDateString('es-ES')}
            </span>
            
            {futureAppointments > 0 && (
              <div 
                className="ml-3 px-2 py-1 rounded-full text-xs theme-transition"
                style={{ 
                  backgroundColor: `${colors?.primary || '#0ea5e9'}1a`,
                  color: colors?.primary || '#0ea5e9'
                }}
              >
                <Calendar className="w-3 h-3 inline mr-1" />
                {futureAppointments} citas futuras
              </div>
            )}
          </div>
          
          <span 
            className="px-2 py-1 text-xs font-medium rounded-full theme-transition"
            style={{
              backgroundColor: staff.isActive ? `${colors?.success || '#10b981'}1a` : `${colors?.error || '#ef4444'}1a`,
              color: staff.isActive ? (colors?.success || '#10b981') : (colors?.error || '#ef4444')
            }}
          >
            {staff.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Add Staff Modal Component
interface AddStaffModalProps {
  onSave: (data: Partial<StaffMember>) => void;
  onCancel: () => void;
  loading: boolean;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialties: [] as ServiceCategory[],
    bio: '',
    experience: '',
    image: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400',
    isActive: true,
    schedule: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '16:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    }
  });

  const { colors } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto theme-transition"
        style={{ backgroundColor: colors?.surface || '#ffffff' }}
      >
        <div className="p-6">
          <h3 
            className="text-lg font-semibold mb-4 theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            Agregar Nuevo Empleado
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                style={{ 
                  border: `1px solid ${colors?.border || '#e5e7eb'}`,
                  backgroundColor: colors?.background || '#f8fafc',
                  color: colors?.text || '#1f2937'
                }}
                required
              />
              
              <input
                type="text"
                placeholder="Rol/Posición *"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                style={{ 
                  border: `1px solid ${colors?.border || '#e5e7eb'}`,
                  backgroundColor: colors?.background || '#f8fafc',
                  color: colors?.text || '#1f2937'
                }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Años de experiencia *"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                style={{ 
                  border: `1px solid ${colors?.border || '#e5e7eb'}`,
                  backgroundColor: colors?.background || '#f8fafc',
                  color: colors?.text || '#1f2937'
                }}
                required
              />
              
              <input
                type="url"
                placeholder="URL de imagen"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                style={{ 
                  border: `1px solid ${colors?.border || '#e5e7eb'}`,
                  backgroundColor: colors?.background || '#f8fafc',
                  color: colors?.text || '#1f2937'
                }}
              />
            </div>

            <textarea
              placeholder="Biografía del empleado *"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{ 
                border: `1px solid ${colors?.border || '#e5e7eb'}`,
                backgroundColor: colors?.background || '#f8fafc',
                color: colors?.text || '#1f2937'
              }}
              rows={3}
              required
            />

            <div>
              <label 
                className="block text-sm font-medium mb-2 theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                Especialidades *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {serviceCategories.map(category => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            specialties: [...formData.specialties, category.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            specialties: formData.specialties.filter(s => s !== category.id)
                          });
                        }
                      }}
                      className="w-4 h-4 rounded focus:ring-2 theme-transition"
                      style={{ accentColor: colors?.accent || '#8b5cf6' }}
                    />
                    <span 
                      className="ml-2 text-sm theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border rounded-lg transition-colors theme-transition"
                style={{ 
                  color: colors?.textSecondary || '#6b7280',
                  borderColor: colors?.border || '#e5e7eb',
                  backgroundColor: colors?.background || '#f8fafc'
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 theme-transition"
                style={{ backgroundColor: colors?.accent || '#8b5cf6' }}
                disabled={loading || !formData.name || !formData.role || formData.specialties.length === 0}
              >
                {loading ? 'Guardando...' : 'Guardar Empleado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffManager;
