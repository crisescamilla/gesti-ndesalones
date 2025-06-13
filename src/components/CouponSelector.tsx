import React, { useState, useEffect } from 'react';
import { Gift, Percent, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { RewardCoupon } from '../types';
import { getClientAvailableCoupons, useRewardCoupon } from '../utils/rewards';

interface CouponSelectorProps {
  clientId: string;
  appointmentTotal: number;
  onCouponApplied: (discount: number, couponCode: string) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: string;
}

const CouponSelector: React.FC<CouponSelectorProps> = ({
  clientId,
  appointmentTotal,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon
}) => {
  const [availableCoupons, setAvailableCoupons] = useState<RewardCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableCoupons();
  }, [clientId]);

  const loadAvailableCoupons = () => {
    const coupons = getClientAvailableCoupons(clientId);
    setAvailableCoupons(coupons);
  };

  const handleApplyCoupon = async () => {
    if (!selectedCoupon) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = useRewardCoupon(selectedCoupon, 'temp-appointment-id');
      
      if (result.success) {
        const discountAmount = (appointmentTotal * result.discount) / 100;
        onCouponApplied(discountAmount, selectedCoupon);
        setSelectedCoupon('');
        loadAvailableCoupons(); // Refresh available coupons
      } else {
        setError(result.error || 'Error al aplicar el cupón');
      }
    } catch (err) {
      setError('Error del sistema al aplicar el cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setSelectedCoupon('');
    setError('');
  };

  const calculateDiscount = (percentage: number) => {
    return (appointmentTotal * percentage) / 100;
  };

  if (availableCoupons.length === 0 && !appliedCoupon) {
    return null;
  }

  return (
    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
      <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
        <Gift className="w-5 h-5 mr-2" />
        Cupones de Descuento
      </h3>

      {appliedCoupon ? (
        // Applied coupon display
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="font-mono text-sm font-bold text-green-800">{appliedCoupon}</p>
                <p className="text-xs text-green-600">Cupón aplicado exitosamente</p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        // Coupon selection
        <div className="space-y-3">
          {availableCoupons.length > 0 ? (
            <>
              <div className="space-y-2">
                {availableCoupons.map(coupon => (
                  <label
                    key={coupon.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCoupon === coupon.code
                        ? 'border-purple-500 bg-purple-100'
                        : 'border-purple-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="coupon"
                      value={coupon.code}
                      checked={selectedCoupon === coupon.code}
                      onChange={(e) => setSelectedCoupon(e.target.value)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm font-bold text-purple-800">{coupon.code}</p>
                          <div className="flex items-center text-xs text-purple-600 mt-1">
                            <Percent className="w-3 h-3 mr-1" />
                            {coupon.discountPercentage}% de descuento
                            <span className="ml-2 text-green-600 font-medium">
                              (-${calculateDiscount(coupon.discountPercentage).toFixed(2)})
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(coupon.expiresAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleApplyCoupon}
                disabled={!selectedCoupon || loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Gift className="w-4 h-4 mr-2" />
                )}
                Aplicar Cupón
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <Gift className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No hay cupones disponibles</p>
              <p className="text-xs text-gray-500 mt-1">
                Los cupones aparecerán cuando el cliente alcance el umbral de compras
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponSelector;