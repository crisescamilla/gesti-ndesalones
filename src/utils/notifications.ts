import { Client, Appointment, Service } from '../types';
import { formatDateTime } from './dateUtils';

export interface NotificationResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface NotificationResponse {
  sms: NotificationResult;
  email: NotificationResult;
}

// Simulated SMS service
const sendSMS = async (phone: string, message: string): Promise<NotificationResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    console.log(`📱 SMS enviado a ${phone}:`, message);
    return {
      success: true,
      message: `SMS enviado exitosamente a ${phone}`,
      timestamp: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      message: `Error al enviar SMS a ${phone}`,
      timestamp: new Date().toISOString()
    };
  }
};

// Simulated Email service
const sendEmail = async (email: string, subject: string, body: string): Promise<NotificationResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Simulate 98% success rate
  const success = Math.random() > 0.02;
  
  if (success) {
    console.log(`📧 Email enviado a ${email}:`, { subject, body });
    return {
      success: true,
      message: `Email enviado exitosamente a ${email}`,
      timestamp: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      message: `Error al enviar email a ${email}`,
      timestamp: new Date().toISOString()
    };
  }
};

// Generate SMS message
const generateSMSMessage = (client: Client, appointment: Appointment, services: Service[]): string => {
  const serviceNames = services.map(s => s.name).join(', ');
  const dateTime = formatDateTime(appointment.date, appointment.time);
  
  return `¡Hola ${client.fullName}! 🌸

Tu cita ha sido confirmada:

📅 ${dateTime}
💆‍♀️ Servicios: ${serviceNames}
💰 Total: $${appointment.totalPrice}

📞 Para cambios o cancelaciones (mín. 24h antes): 664-563-6423

¡Te esperamos! ✨`;
};

// Generate Email HTML content
const generateEmailHTML = (client: Client, appointment: Appointment, services: Service[]): string => {
  const servicesList = services.map(service => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${service.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${service.duration} min</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${service.price}</td>
    </tr>
  `).join('');

  const dateTime = formatDateTime(appointment.date, appointment.time);
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cita</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✨ Tu salon ✨</h1>
    <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Tu momento de belleza y relajación</p>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    
    <!-- Greeting -->
    <h2 style="color: #8b5cf6; margin-top: 0;">¡Hola ${client.fullName}! 🌸</h2>
    <p style="font-size: 16px; margin-bottom: 25px;">
      Tu cita en <strong></strong> ha sido confirmada exitosamente. ¡Estamos emocionados de recibirte!
    </p>

    <!-- Appointment Details -->
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">📅 Detalles de tu Cita</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-weight: bold;">Fecha y Hora:</span>
        <span>${dateTime}</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-weight: bold;">Duración Total:</span>
        <span>${totalDuration} minutos</span>
      </div>
      
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold;">Total a Pagar:</span>
        <span style="color: #8b5cf6; font-weight: bold; font-size: 18px;">$${appointment.totalPrice}</span>
      </div>
    </div>

    <!-- Services Table -->
    <h3 style="color: #374151; margin-bottom: 15px;">💆‍♀️ Servicios Reservados</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Servicio</th>
          <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Duración</th>
          <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${servicesList}
      </tbody>
    </table>

    <!-- Preparation Instructions -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px;">
      <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">📋 Preparación para tu Cita</h4>
      <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
        <li>Llega 10 minutos antes de tu cita</li>
        <li>Evita usar cremas o aceites el día de tu tratamiento</li>
        <li>Trae ropa cómoda y fácil de cambiar</li>
        <li>Informa sobre alergias o condiciones médicas</li>
        <li>Mantén tu teléfono en silencio durante el tratamiento</li>
      </ul>
    </div>

    <!-- Cancellation Policy -->
    <div style="background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
      <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">⚠️ Política de Cancelación</h4>
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        Las cancelaciones o cambios deben realizarse con un <strong>mínimo de 24 horas de anticipación</strong>. 
        Cancelaciones tardías pueden estar sujetas a cargos.
      </p>
    </div>

    <!-- Contact Info -->
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px;">
      <h4 style="color: #065f46; margin-top: 0; margin-bottom: 10px;">📞 Información de Contacto</h4>
      <p style="margin: 0; color: #065f46;">
        <strong>Para cambios o cancelaciones:</strong><br>
        📱 Teléfono: <a href="tel:6645636423" style="color: #059669; text-decoration: none;">664-563-6423</a><br>
        📧 Email: <a href="mailto:info@tu-salon.com" style="color: #059669; text-decoration: none;">info@tu-salon.com</a><br>
        📍 Dirección: Av. Revolución 1234, Tijuana, BC
      </p>
    </div>

    <!-- Footer Message -->
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        ¡Gracias por elegirnos! 💜<br>
        Estamos comprometidos a brindarte la mejor experiencia de belleza y relajación.
      </p>
      
      <div style="margin-top: 15px;">
        <a href="#" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">🌐 Sitio Web</a>
        <a href="#" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">📱 Instagram</a>
        <a href="#" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">👍 Facebook</a>
      </div>
    </div>

  </div>
</body>
</html>`;
};

// Main notification function
export const sendAppointmentConfirmation = async (
  client: Client,
  appointment: Appointment,
  services: Service[]
): Promise<NotificationResponse> => {
  
  // Generate messages
  const smsMessage = generateSMSMessage(client, appointment, services);
  const emailSubject = `✨ Confirmación de Cita - ${formatDateTime(appointment.date, appointment.time)}`;
  const emailBody = generateEmailHTML(client, appointment, services);

  // Send notifications concurrently
  const [smsResult, emailResult] = await Promise.all([
    sendSMS(client.phone, smsMessage),
    sendEmail(client.email, emailSubject, emailBody)
  ]);

  return {
    sms: smsResult,
    email: emailResult
  };
};

// Send reminder notification (24 hours before)
export const sendAppointmentReminder = async (
  client: Client,
  appointment: Appointment,
  services: Service[]
): Promise<NotificationResponse> => {
  
  const serviceNames = services.map(s => s.name).join(', ');
  const dateTime = formatDateTime(appointment.date, appointment.time);
  
  const reminderSMS = `🔔 Recordatorio - 

¡Hola ${client.fullName}! Tu cita es mañana:

📅 ${dateTime}
💆‍♀️ ${serviceNames}

📞 Para cambios: 664-563-6423
¡Te esperamos! ✨`;

  const reminderEmailSubject = `🔔 Recordatorio: Tu cita es mañana - Bella Vita Spa`;
  const reminderEmailBody = generateEmailHTML(client, appointment, services)
    .replace('Tu cita <strong></strong> ha sido confirmada exitosamente', 
             '¡Tu cita <strong></strong> es mañana!')
    .replace('¡Estamos emocionados de recibirte!', 
             '¡No olvides tu cita de mañana!');

  const [smsResult, emailResult] = await Promise.all([
    sendSMS(client.phone, reminderSMS),
    sendEmail(client.email, reminderEmailSubject, reminderEmailBody)
  ]);

  return {
    sms: smsResult,
    email: emailResult
  };
};

// Store notification history
export const saveNotificationHistory = (
  appointmentId: string,
  type: 'confirmation' | 'reminder',
  result: NotificationResponse
): void => {
  const history = getNotificationHistory();
  const record = {
    id: Date.now().toString(),
    appointmentId,
    type,
    result,
    timestamp: new Date().toISOString()
  };
  
  history.push(record);
  localStorage.setItem('beauty-salon-notifications', JSON.stringify(history));
};

export const getNotificationHistory = () => {
  const stored = localStorage.getItem('beauty-salon-notifications');
  return stored ? JSON.parse(stored) : [];
};