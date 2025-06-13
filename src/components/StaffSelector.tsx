import React, { useState, useEffect } from 'react';
import { User, Star, Clock, Award, CheckCircle, Users } from 'lucide-react';
import { StaffMember, Service, ServiceCategory } from '../types';
import { getAvailableStaffForServices } from '../data/staff';

interface StaffSelectorProps {
  selectedServices: Service[];
  onStaffSelect: (staffId: string) => void;
  selectedStaffId?: string;
}

const StaffSelector: React.FC<StaffSelectorProps> = ({
  selectedServices,
  onStaffSelect,
  selectedStaffId
}) => {
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [showAllStaff, setShowAllStaff] = useState(false);

  useEffect(() => {
    // Get unique specialties from selected services
    const serviceSpecialties = [...new Set(selectedServices.map(service => service.category))];
    
    // Get staff members who can perform these services
    const staff = getAvailableStaffForServices(serviceSpecialties);
    setAvailableStaff(staff);
  }, [selectedServices]);

  const handleStaffSelection = (staffId: string) => {
    onStaffSelect(staffId);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getSpecialtyBadgeColor = (specialty: ServiceCategory) => {
    const colors = {
      'tratamientos-faciales': 'bg-pink-100 text-pink-800',
      'servicios-cabello': 'bg-purple-100 text-purple-800',
      'servicios-unas': 'bg-blue-100 text-blue-800',
      'masajes': 'bg-green-100 text-green-800',
      'tratamientos-corporales': 'bg-orange-100 text-orange-800',
      'productos': 'bg-gray-100 text-gray-800'
    };
    return colors[specialty] || 'bg-gray-100 text-gray-800';
  };

  const getSpecialtyName = (specialty: ServiceCategory) => {
    const names = {
      'tratamientos-faciales': 'Faciales',
      'servicios-cabello': 'Cabello',
      'servicios-unas': 'Uñas',
      'masajes': 'Masajes',
      'tratamientos-corporales': 'Corporales',
      'productos': 'Productos'
    };
    return names[specialty] || specialty;
  };

  if (availableStaff.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay especialistas disponibles</h3>
        <p className="text-gray-600">
          No se encontraron especialistas para los servicios seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Selecciona tu Especialista
        </h3>
        <p className="text-gray-600">
          Elige quién te atenderá durante tu visita
        </p>
      </div>

      {/* Staff Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {availableStaff.map((staff) => {
          const isSelected = selectedStaffId === staff.id;
          const canPerformServices = selectedServices.every(service =>
            staff.specialties.includes(service.category)
          );

          return (
            <div
              key={staff.id}
              onClick={() => handleStaffSelection(staff.id)}
              className={`relative bg-white border-2 rounded-xl p-6 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                isSelected 
                  ? 'border-purple-500 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Staff Photo */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="relative">
                  <img
                    src={staff.image}
                    alt={staff.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  {canPerformServices && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{staff.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{staff.role}</p>
                  {renderStarRating(staff.rating)}
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {staff.bio}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-gray-600 mr-1" />
                    <span className="text-sm font-medium text-gray-900">{staff.experience}</span>
                  </div>
                  <span className="text-xs text-gray-600">Experiencia</span>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Award className="w-4 h-4 text-gray-600 mr-1" />
                    <span className="text-sm font-medium text-gray-900">{staff.completedServices}</span>
                  </div>
                  <span className="text-xs text-gray-600">Servicios</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-700">Especialidades:</span>
                <div className="flex flex-wrap gap-1">
                  {staff.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getSpecialtyBadgeColor(specialty)}`}
                    >
                      {getSpecialtyName(specialty)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Compatibility Indicator */}
              {!canPerformServices && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Este especialista puede realizar algunos de tus servicios, pero podrías necesitar otro especialista adicional.
                  </p>
                </div>
              )}

              {canPerformServices && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Puede realizar todos tus servicios seleccionados
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      {selectedStaffId && (
        <div className="text-center pt-6">
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-semibold text-purple-900">
                  Especialista Seleccionado
                </h4>
                <p className="text-purple-700">
                  {availableStaff.find(s => s.id === selectedStaffId)?.name}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-purple-600 mb-4">
              ¡Excelente elección! Ahora puedes continuar para seleccionar la fecha y hora de tu cita.
            </p>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start">
          <User className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Información Importante</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Todos nuestros especialistas están certificados y tienen amplia experiencia</li>
              <li>• Si necesitas cambiar de especialista, puedes hacerlo hasta 24 horas antes de tu cita</li>
              <li>• Los horarios pueden variar según la disponibilidad del especialista seleccionado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSelector;