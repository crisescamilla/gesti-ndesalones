import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, MessageSquare, Send, AlertCircle, Users } from 'lucide-react';
import { Client, Appointment, Service } from '../types';
import { services, serviceCategories } from '../data/services';
import { saveClient, saveAppointment, getClients, getAvailableTimeSlots } from '../utils/storage';
import { formatDateTime, generateDateRange } from '../utils/dateUtils';
import { sendAppointmentConfirmation, saveNotificationHistory } from '../utils/notifications';
import { staffMembers } from '../data/staff';
import { useSalonName, useSalonMotto } from '../hooks/useSalonSettings';
import { useTheme } from '../hooks/useTheme';
import ServiceSelector from './ServiceSelector';
import StaffSelector from './StaffSelector';

const ClientBooking: React.FC = () => {
  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState<Partial<Client>>({});
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<{
    sms: { success: boolean; message: string } | null;
    email: { success: boolean; message: string } | null;
    loading: boolean;
  }>({
    sms: null,
    email: null,
    loading: false
  });

  // Real-time salon settings and theme
  const salonName = useSalonName();
  const salonMotto = useSalonMotto();
  const { activeTheme, colors } = useTheme();

  useEffect(() => {
    if (selectedDate) {
      const slots = getAvailableTimeSlots(selectedDate);
      setAvailableSlots(slots);
    }
  }, [selectedDate]);

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientData.fullName && clientData.phone && clientData.email) {
      setStep(2);
    }
  };

  const handleServiceSelection = (services: Service[]) => {
    setSelectedServices(services);
    if (services.length > 0) {
      setStep(3);
    }
  };

  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffId(staffId);
    if (staffId) {
      setStep(4);
    }
  };

  const handleDateTimeSubmit = () => {
    if (selectedDate && selectedTime) {
      setStep(5);
    }
  };

  const handleBookingConfirm = async () => {
    setNotificationStatus({ sms: null, email: null, loading: true });
    
    const client: Client = {
      id: Date.now().toString(),
      fullName: clientData.fullName!,
      phone: clientData.phone!,
      email: clientData.email!,
      createdAt: new Date().toISOString()
    };

    saveClient(client);

    const appointment: Appointment = {
      id: Date.now().toString(),
      clientId: client.id,
      serviceIds: selectedServices.map(s => s.id),
      staffId: selectedStaffId,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
      totalPrice: selectedServices.reduce((sum, service) => sum + service.price, 0),
      createdAt: new Date().toISOString()
    };

    saveAppointment(appointment);

    // Send notifications
    try {
      const notificationResult = await sendAppointmentConfirmation(client, appointment, selectedServices);
      
      setNotificationStatus({
        sms: notificationResult.sms,
        email: notificationResult.email,
        loading: false
      });

      // Save notification history
      saveNotificationHistory(appointment.id, 'confirmation', notificationResult);
      
    } catch (error) {
      setNotificationStatus({
        sms: { success: false, message: 'Error al enviar SMS' },
        email: { success: false, message: 'Error al enviar email' },
        loading: false
      });
    }

    setStep(6);
  };

  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const selectedStaff = staffMembers.find(staff => staff.id === selectedStaffId);

  const availableDates = generateDateRange(new Date(), 14);

  return (
    <div 
      className="min-h-screen p-4 theme-transition"
      style={{ 
        background: `linear-gradient(135deg, ${colors?.background || '#f8fafc'}, ${colors?.surface || '#ffffff'})` 
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div 
          className="rounded-3xl shadow-xl overflow-hidden border theme-transition"
          style={{ 
            backgroundColor: `${colors?.surface || '#ffffff'}e6`,
            backdropFilter: 'blur(10px)',
            borderColor: `${colors?.border || '#e5e7eb'}33`
          }}
        >
          <div 
            className="p-8 text-white theme-transition"
            style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
          >
            <h1 className="text-3xl font-bold mb-2">Reserva tu Cita</h1>
            <p className="opacity-90">{salonMotto}</p>
            
            {/* Progress Bar */}
            <div className="mt-6 flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= num ? 'bg-white text-blue-600' : 'bg-white bg-opacity-30 text-white'
                  }`}>
                    {num}
                  </div>
                  {num < 5 && <div className={`w-12 h-1 transition-all ${step > num ? 'bg-white' : 'bg-white bg-opacity-30'}`} />}
                </div>
              ))}
            </div>
            
            {/* Step Labels */}
            <div className="mt-2 flex justify-between text-xs opacity-80">
              <span>Datos</span>
              <span>Servicios</span>
              <span>Especialista</span>
              <span>Fecha</span>
              <span>Confirmar</span>
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <div>
                <h2 
                  className="text-2xl font-semibold mb-6 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Información del Cliente
                </h2>
                
                <form onSubmit={handleClientSubmit} className="space-y-6">
                  <div className="relative">
                    <User 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    />
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      className="w-full pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:border-transparent transition-all theme-transition"
                      style={{ 
                        border: `1px solid ${colors?.border || '#e5e7eb'}`,
                        backgroundColor: colors?.surface || '#ffffff',
                        color: colors?.text || '#1f2937'
                      }}
                      value={clientData.fullName || ''}
                      onChange={(e) => setClientData({...clientData, fullName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Phone 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      className="w-full pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:border-transparent transition-all theme-transition"
                      style={{ 
                        border: `1px solid ${colors?.border || '#e5e7eb'}`,
                        backgroundColor: colors?.surface || '#ffffff',
                        color: colors?.text || '#1f2937'
                      }}
                      value={clientData.phone || ''}
                      onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:border-transparent transition-all theme-transition"
                      style={{ 
                        border: `1px solid ${colors?.border || '#e5e7eb'}`,
                        backgroundColor: colors?.surface || '#ffffff',
                        color: colors?.text || '#1f2937'
                      }}
                      value={clientData.email || ''}
                      onChange={(e) => setClientData({...clientData, email: e.target.value})}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-white py-3 rounded-xl font-semibold transition-all duration-300 theme-transition"
                    style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
                  >
                    Continuar
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 
                  className="text-2xl font-semibold mb-6 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Selecciona tus Servicios
                </h2>
                <ServiceSelector onServiceSelect={handleServiceSelection} />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 
                  className="text-2xl font-semibold mb-6 flex items-center theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  <Users className="w-8 h-8 mr-3" style={{ color: colors?.primary || '#0ea5e9' }} />
                  Elige tu Especialista
                </h2>
                <StaffSelector 
                  selectedServices={selectedServices}
                  onStaffSelect={handleStaffSelection}
                  selectedStaffId={selectedStaffId}
                />
                
                {selectedStaffId && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setStep(4)}
                      className="text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 theme-transition"
                      style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
                    >
                      Continuar con Fecha y Hora
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 
                  className="text-2xl font-semibold mb-6 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Fecha y Hora
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 
                      className="text-lg font-medium mb-4 flex items-center theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      <Calendar className="w-5 h-5 mr-2" style={{ color: colors?.primary || '#0ea5e9' }} />
                      Seleccionar Fecha
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {availableDates.map(date => (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className="p-3 rounded-lg border text-sm font-medium transition-all theme-transition"
                          style={{
                            backgroundColor: selectedDate === date ? (colors?.primary || '#0ea5e9') : (colors?.surface || '#ffffff'),
                            color: selectedDate === date ? 'white' : (colors?.text || '#1f2937'),
                            borderColor: selectedDate === date ? (colors?.primary || '#0ea5e9') : (colors?.border || '#e5e7eb')
                          }}
                        >
                          {new Date(date).toLocaleDateString('es-ES', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 
                      className="text-lg font-medium mb-4 flex items-center theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      <Clock className="w-5 h-5 mr-2" style={{ color: colors?.primary || '#0ea5e9' }} />
                      Horarios Disponibles
                    </h3>
                    {selectedDate ? (
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {availableSlots.map(time => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className="p-2 rounded-lg border text-sm font-medium transition-all theme-transition"
                            style={{
                              backgroundColor: selectedTime === time ? (colors?.primary || '#0ea5e9') : (colors?.surface || '#ffffff'),
                              color: selectedTime === time ? 'white' : (colors?.text || '#1f2937'),
                              borderColor: selectedTime === time ? (colors?.primary || '#0ea5e9') : (colors?.border || '#e5e7eb')
                            }}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p 
                        className="text-center py-8 theme-transition"
                        style={{ color: colors?.textSecondary || '#6b7280' }}
                      >
                        Primero selecciona una fecha
                      </p>
                    )}
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <div 
                    className="mt-8 p-6 rounded-xl border theme-transition"
                    style={{ 
                      backgroundColor: `${colors?.primary || '#0ea5e9'}0d`,
                      borderColor: `${colors?.primary || '#0ea5e9'}33`
                    }}
                  >
                    <h4 
                      className="font-semibold mb-4 theme-transition"
                      style={{ color: colors?.primary || '#0ea5e9' }}
                    >
                      Resumen de la Cita
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p 
                        className="theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        <strong>Especialista:</strong> {selectedStaff?.name} - {selectedStaff?.role}
                      </p>
                      <p 
                        className="theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        <strong>Fecha y Hora:</strong> {formatDateTime(selectedDate, selectedTime)}
                      </p>
                      <p 
                        className="theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        <strong>Duración:</strong> {totalDuration} minutos
                      </p>
                      <p 
                        className="theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        <strong>Total:</strong> ${totalPrice}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleDateTimeSubmit}
                      className="w-full mt-4 text-white py-2 rounded-lg transition-colors theme-transition"
                      style={{ backgroundColor: colors?.primary || '#0ea5e9' }}
                    >
                      Confirmar Horario
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 
                  className="text-2xl font-semibold mb-6 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Confirmación de Cita
                </h2>
                
                <div 
                  className="rounded-xl p-6 mb-6 theme-transition"
                  style={{ backgroundColor: colors?.background || '#f8fafc' }}
                >
                  <h3 
                    className="font-semibold mb-4 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    Detalles de la Cita
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span 
                        className="theme-transition"
                        style={{ color: colors?.textSecondary || '#6b7280' }}
                      >
                        Cliente:
                      </span>
                      <span 
                        className="font-medium theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        {clientData.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span 
                        className="theme-transition"
                        style={{ color: colors?.textSecondary || '#6b7280' }}
                      >
                        Especialista:
                      </span>
                      <span 
                        className="font-medium theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        {selectedStaff?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span 
                        className="theme-transition"
                        style={{ color: colors?.textSecondary || '#6b7280' }}
                      >
                        Fecha y Hora:
                      </span>
                      <span 
                        className="font-medium theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        {formatDateTime(selectedDate, selectedTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span 
                        className="theme-transition"
                        style={{ color: colors?.textSecondary || '#6b7280' }}
                      >
                        Duración:
                      </span>
                      <span 
                        className="font-medium theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        {totalDuration} minutos
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 
                      className="font-medium mb-3 theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      Servicios Seleccionados:
                    </h4>
                    <div className="space-y-2">
                      {selectedServices.map(service => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span 
                            className="theme-transition"
                            style={{ color: colors?.text || '#1f2937' }}
                          >
                            {service.name}
                          </span>
                          <span 
                            className="font-medium theme-transition"
                            style={{ color: colors?.text || '#1f2937' }}
                          >
                            ${service.price}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="border-t pt-2 mt-2 theme-transition"
                      style={{ borderColor: colors?.border || '#e5e7eb' }}
                    >
                      <div className="flex justify-between font-semibold">
                        <span 
                          className="theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          Total:
                        </span>
                        <span 
                          className="theme-transition"
                          style={{ color: colors?.primary || '#0ea5e9' }}
                        >
                          ${totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 py-3 rounded-xl font-semibold transition-colors theme-transition"
                    style={{ 
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.textSecondary || '#6b7280'
                    }}
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleBookingConfirm}
                    disabled={notificationStatus.loading}
                    className="flex-1 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center theme-transition"
                    style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
                  >
                    {notificationStatus.loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando confirmación...
                      </>
                    ) : (
                      'Confirmar Cita'
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-6" style={{ color: colors?.success || '#10b981' }} />
                <h2 
                  className="text-2xl font-semibold mb-4 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  ¡Cita Confirmada!
                </h2>
                <p 
                  className="mb-6 theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  Tu cita en <strong>{salonName}</strong> ha sido reservada exitosamente.
                </p>
                
                <div 
                  className="rounded-xl p-6 mb-6 theme-transition"
                  style={{ 
                    backgroundColor: `${colors?.success || '#10b981'}0d`,
                    borderColor: `${colors?.success || '#10b981'}33`
                  }}
                >
                  <h3 
                    className="font-semibold mb-3 theme-transition"
                    style={{ color: colors?.success || '#10b981' }}
                  >
                    Detalles de tu Cita
                  </h3>
                  <div 
                    className="text-sm space-y-1 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    <p><strong>Especialista:</strong> {selectedStaff?.name}</p>
                    <p><strong>Fecha:</strong> {formatDateTime(selectedDate, selectedTime)}</p>
                    <p><strong>Servicios:</strong> {selectedServices.map(s => s.name).join(', ')}</p>
                    <p><strong>Total:</strong> ${totalPrice}</p>
                  </div>
                </div>

                {/* Notification Status */}
                <div 
                  className="rounded-xl p-6 mb-6 theme-transition"
                  style={{ 
                    backgroundColor: `${colors?.primary || '#0ea5e9'}0d`,
                    borderColor: `${colors?.primary || '#0ea5e9'}33`
                  }}
                >
                  <h3 
                    className="font-semibold mb-4 flex items-center justify-center theme-transition"
                    style={{ color: colors?.primary || '#0ea5e9' }}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Estado de Notificaciones
                  </h3>
                  
                  <div className="space-y-3">
                    {/* SMS Status */}
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg theme-transition"
                      style={{ backgroundColor: colors?.surface || '#ffffff' }}
                    >
                      <div className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-3" style={{ color: colors?.primary || '#0ea5e9' }} />
                        <span 
                          className="font-medium theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          SMS
                        </span>
                      </div>
                      <div className="flex items-center">
                        {notificationStatus.loading ? (
                          <div 
                            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: colors?.primary || '#0ea5e9' }}
                          />
                        ) : notificationStatus.sms?.success ? (
                          <div className="flex items-center" style={{ color: colors?.success || '#10b981' }}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Enviado</span>
                          </div>
                        ) : (
                          <div className="flex items-center" style={{ color: colors?.error || '#ef4444' }}>
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Error</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Status */}
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg theme-transition"
                      style={{ backgroundColor: colors?.surface || '#ffffff' }}
                    >
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 mr-3" style={{ color: colors?.primary || '#0ea5e9' }} />
                        <span 
                          className="font-medium theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          Email
                        </span>
                      </div>
                      <div className="flex items-center">
                        {notificationStatus.loading ? (
                          <div 
                            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: colors?.primary || '#0ea5e9' }}
                          />
                        ) : notificationStatus.email?.success ? (
                          <div className="flex items-center" style={{ color: colors?.success || '#10b981' }}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Enviado</span>
                          </div>
                        ) : (
                          <div className="flex items-center" style={{ color: colors?.error || '#ef4444' }}>
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Error</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(notificationStatus.sms?.success || notificationStatus.email?.success) && (
                    <div 
                      className="mt-4 p-3 rounded-lg theme-transition"
                      style={{ 
                        backgroundColor: `${colors?.success || '#10b981'}1a`,
                        color: colors?.success || '#10b981'
                      }}
                    >
                      <p className="text-sm">
                        ✅ Confirmación enviada exitosamente. Revisa tu teléfono y email.
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div 
                  className="rounded-xl p-6 mb-6 theme-transition"
                  style={{ 
                    backgroundColor: `${colors?.primary || '#0ea5e9'}0d`,
                    borderColor: `${colors?.primary || '#0ea5e9'}33`
                  }}
                >
                  <h3 
                    className="font-semibold mb-3 theme-transition"
                    style={{ color: colors?.primary || '#0ea5e9' }}
                  >
                    📞 Información de Contacto
                  </h3>
                  <div 
                    className="text-sm space-y-1 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    <p><strong>Para cambios o cancelaciones:</strong></p>
                    <p>📱 Teléfono: <strong>664-563-6423</strong></p>
                    <p>⚠️ Mínimo 24 horas de anticipación</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep(1);
                    setClientData({});
                    setSelectedServices([]);
                    setSelectedStaffId('');
                    setSelectedDate('');
                    setSelectedTime('');
                    setNotificationStatus({ sms: null, email: null, loading: false });
                  }}
                  className="text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 theme-transition"
                  style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
                >
                  Agendar Nueva Cita
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientBooking;