import React, { useState } from 'react';
import { Service } from '../types';
import { getActiveServices } from '../utils/servicesManager';
import { serviceCategories } from '../data/services';
import { Sparkles, Hand, Heart, Scissors, Flower, ShoppingBag, Plus, Minus } from 'lucide-react';

interface ServiceSelectorProps {
  onServiceSelect: (services: Service[]) => void;
}

const iconMap = {
  Sparkles,
  Hand,
  Heart,
  Scissors,
  Flower,
  ShoppingBag
};

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onServiceSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState(serviceCategories[0].id);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  // Use services from storage instead of static data
  const allServices = getActiveServices();
  const categoryServices = allServices.filter(service => service.category === selectedCategory);

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    let newSelection: Service[];
    
    if (isSelected) {
      newSelection = selectedServices.filter(s => s.id !== service.id);
    } else {
      newSelection = [...selectedServices, service];
    }
    
    setSelectedServices(newSelection);
  };

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      onServiceSelect(selectedServices);
    }
  };

  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);

  return (
    <div>
      {/* Category Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {serviceCategories.map(category => {
          const IconComponent = iconMap[category.icon as keyof typeof iconMap];
          const categoryHasServices = allServices.some(s => s.category === category.id);
          
          if (!categoryHasServices) return null;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
              }`}
            >
              <IconComponent className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium text-center">{category.name}</p>
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {categoryServices.map(service => {
          const isSelected = selectedServices.find(s => s.id === service.id);
          return (
            <div
              key={service.id}
              className={`relative bg-white border-2 rounded-xl p-6 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => toggleService(service)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                }`}>
                  {isSelected ? (
                    <Plus className="w-4 h-4 text-white rotate-45" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <span>{service.duration} min</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  ${service.price}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {categoryServices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay servicios disponibles en esta categoría.</p>
        </div>
      )}

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-purple-800 mb-4">Servicios Seleccionados</h3>
          
          <div className="space-y-2 mb-4">
            {selectedServices.map(service => (
              <div key={service.id} className="flex justify-between items-center text-sm">
                <span className="text-purple-700">{service.name}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-purple-600">{service.duration} min</span>
                  <span className="font-semibold text-purple-800">${service.price}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleService(service);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-purple-200 pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-purple-600">
                <span>Duración total: {totalDuration} minutos</span>
              </div>
              <div className="text-xl font-bold text-purple-800">
                Total: ${totalPrice}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleContinue}
            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
          >
            Continuar con la Reserva
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;