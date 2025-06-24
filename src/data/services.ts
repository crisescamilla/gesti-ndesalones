import { Service, ServiceCategory } from '../types';

export const serviceCategories: { id: ServiceCategory; name: string; icon: string }[] = [
  { id: 'tratamientos-corporales', name: 'Tratamientos Corporales', icon: 'Sparkles' },
  { id: 'servicios-unas', name: 'Servicios de Uñas', icon: 'Hand' },
  { id: 'tratamientos-faciales', name: 'Tratamientos Faciales', icon: 'Heart' },
  { id: 'servicios-cabello', name: 'Servicios de Cabello', icon: 'Scissors' },
  { id: 'masajes', name: 'Masajes', icon: 'Flower' },
  { id: 'productos', name: 'Productos', icon: 'ShoppingBag' }
];

export const services: Service[] = [
  // Tratamientos Corporales
  {
    id: '1',
    name: 'Depilación con Cera',
    category: 'tratamientos-corporales',
    duration: 60,
    price: 150,
    description: 'Depilación con cera natural para piernas, linea de bikini, axilas, brazos, espalda, bigote. precio por zona.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Exfoliación Corporal',
    category: 'tratamientos-corporales',
    duration: 45,
    price: 350,
    description: 'Tratamiento exfoliante para renovar la piel del cuerpo',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Tratamiento Reafirmante',
    category: 'tratamientos-corporales',
    duration: 90,
    price: 450,
    description: 'Tratamiento especializado para reafirmar y tonificar la piel',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Servicios de Uñas
  {
    id: '4',
    name: 'Manicure Clásica',
    category: 'servicios-unas',
    duration: 30,
    price: 250,
    description: 'Cuidado completo de uñas con esmaltado tradicional',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Pedicure Spa',
    category: 'servicios-unas',
    duration: 45,
    price: 450,
    description: 'Tratamiento relajante para pies con exfoliación y masaje',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Uñas de Gel',
    category: 'servicios-unas',
    duration: 60,
    price: 550,
    description: 'Aplicación de gel para uñas duraderas y resistentes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Tratamientos Faciales
  {
    id: '7',
    name: 'Limpieza Facial Profunda',
    category: 'tratamientos-faciales',
    duration: 60,
    price: 400,
    description: 'Limpieza profunda con extracción de impurezas',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Facial Hidratante',
    category: 'tratamientos-faciales',
    duration: 45,
    price: 350,
    description: 'Tratamiento hidratante para todo tipo de piel',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Facial Anti-edad',
    category: 'tratamientos-faciales',
    duration: 75,
    price: 550,
    description: 'Tratamiento especializado para combatir signos de envejecimiento',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Servicios de Cabello
  {
    id: '10',
    name: 'Corte y Peinado',
    category: 'servicios-cabello',
    duration: 45,
    price: 430,
    description: 'Corte personalizado con peinado incluido',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '11',
    name: 'Tinte Completo',
    category: 'servicios-cabello',
    duration: 120,
    price: 600,
    description: 'Coloración completa del cabello con productos profesionales, depende del largo del cabello',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '12',
    name: 'Mechas y Reflejos',
    category: 'servicios-cabello',
    duration: 150,
    price: 700,
    description: 'Aplicación de mechas para dar luminosidad al cabello',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Masajes
  {
    id: '13',
    name: 'Masaje Relajante',
    category: 'masajes',
    duration: 60,
    price: 750,
    description: 'Masaje corporal completo para relajación y bienestar',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '14',
    name: 'Masaje Descontracturante',
    category: 'masajes',
    duration: 45,
    price: 450,
    description: 'Masaje terapéutico para aliviar tensiones musculares',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '15',
    name: 'Masaje con Piedras Calientes',
    category: 'masajes',
    duration: 75,
    price: 350,
    description: 'Terapia relajante con piedras volcánicas calientes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Productos
  {
    id: '16',
    name: 'Crema Hidratante Facial',
    category: 'productos',
    duration: 5,
    price: 250,
    description: 'Crema hidratante de uso diario para rostro',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '17',
    name: 'Champú Profesional',
    category: 'productos',
    duration: 5,
    price: 280,
    description: 'Champú profesional para todo tipo de cabello',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '18',
    name: 'Mascarilla Nutritiva',
    category: 'productos',
    duration: 5,
    price: 220,
    description: 'Mascarilla intensiva para cabello dañado',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];