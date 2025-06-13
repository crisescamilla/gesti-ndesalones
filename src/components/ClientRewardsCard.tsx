import React, { useState, useEffect } from 'react';
import { Gift, Award, Calendar, Percent, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Client, RewardCoupon, RewardHistory } from '../types';
import { 
  calculateClientTotalSpending, 
  getClientAvailableCoupons, 
  getClientRewardHistory,
  getRewardSettings,
  generateRewardCoupon
} from '../utils/rewards';
import { useTheme } from '../hooks/useTheme';

interface ClientRewardsCardProps {
  client: Client;
  onRewardGenerated?: () => void;
}

const ClientRewardsCard: React.FC<ClientRewardsCardProps> = ({ client, onRewardGenerated }) => {
  const [totalSpent, setTotalSpent] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<RewardCoupon[]>([]);
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([]);
  const [settings, setSettings] = useState(getRewardSettings());
  const [loading, setLoading] = useState(false);

  // Real-time theme
  const { colors } = useTheme();

  useEffect(() => {
    loadClientRewardData();
  }, [client.id]);

  const loadClientRewardData = () => {
    const spent = calculateClientTotalSpending(client.id);
    const coupons = getClientAvailableCoupons(client.id);
    const history = getClientRewardHistory(client.id);
    
    setTotalSpent(spent);
    setAvailableCoupons(coupons);
    setRewardHistory(history);
  };

  const handleGenerateReward = async () => {
    setLoading(true);
    try {
      const newCoupon = generateRewardCoupon(client.id);
      if (newCoupon) {
        loadClientRewardData();
        onRewardGenerated?.();
      }
    } catch (error) {
      console.error('Error generating reward:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = Math.min((totalSpent / settings.spendingThreshold) * 100, 100);
  const remainingAmount = Math.max(settings.spendingThreshold - totalSpent, 0);
  const hasEarnedReward = totalSpent >= settings.spendingThreshold;

  return (
    <div 
      className="rounded-xl shadow-lg p-6 border-l-4 theme-transition"
      style={{ 
        backgroundColor: colors?.surface || '#ffffff',
        borderLeftColor: colors?.accent || '#8b5cf6'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 theme-transition"
            style={{ backgroundColor: `${colors?.accent || '#8b5cf6'}1a` }}
          >
            {hasEarnedReward ? (
              <Gift className="w-5 h-5" style={{ color: colors?.accent || '#8b5cf6' }} />
            ) : (
              <Award className="w-5 h-5" style={{ color: colors?.accent || '#8b5cf6' }} />
            )}
          </div>
          <div>
            <h3 
              className="font-semibold flex items-center theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {client.fullName}
              {hasEarnedReward && (
                <Gift className="w-4 h-4 ml-2" style={{ color: colors?.accent || '#8b5cf6' }} title="Cliente con recompensas" />
              )}
            </h3>
            <p 
              className="text-sm theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Programa de Fidelización
            </p>
          </div>
        </div>
        
        {availableCoupons.length > 0 && (
          <div 
            className="px-3 py-1 rounded-full text-xs font-medium theme-transition"
            style={{ 
              backgroundColor: `${colors?.success || '#10b981'}1a`,
              color: colors?.success || '#10b981'
            }}
          >
            {availableCoupons.length} cupón{availableCoupons.length !== 1 ? 'es' : ''} disponible{availableCoupons.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span 
            className="text-sm font-medium theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            Progreso hacia recompensa
          </span>
          <span 
            className="text-sm theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            ${totalSpent.toLocaleString()} / ${settings.spendingThreshold.toLocaleString()}
          </span>
        </div>
        
        <div 
          className="w-full rounded-full h-3 theme-transition"
          style={{ backgroundColor: colors?.border || '#e5e7eb' }}
        >
          <div 
            className="h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: hasEarnedReward ? (colors?.success || '#10b981') : (colors?.accent || '#8b5cf6')
            }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs">
            {hasEarnedReward ? (
              <span 
                className="font-medium theme-transition"
                style={{ color: colors?.success || '#10b981' }}
              >
                ¡Recompensa alcanzada!
              </span>
            ) : (
              <span 
                className="theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Faltan $${remainingAmount.toLocaleString()} para la siguiente recompensa
              </span>
            )}
          </span>
          <span 
            className="text-xs font-medium theme-transition"
            style={{ color: colors?.accent || '#8b5cf6' }}
          >
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Available Coupons */}
      {availableCoupons.length > 0 && (
        <div className="mb-4">
          <h4 
            className="text-sm font-medium mb-2 flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <Gift className="w-4 h-4 mr-1" style={{ color: colors?.accent || '#8b5cf6' }} />
            Cupones Disponibles
          </h4>
          <div className="space-y-2">
            {availableCoupons.map(coupon => (
              <div 
                key={coupon.id} 
                className="rounded-lg p-3 border theme-transition"
                style={{ 
                  background: `linear-gradient(135deg, ${colors?.accent || '#8b5cf6'}0d, ${colors?.secondary || '#06b6d4'}0d)`,
                  borderColor: `${colors?.accent || '#8b5cf6'}33`
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="font-mono text-sm font-bold theme-transition"
                      style={{ color: colors?.accent || '#8b5cf6' }}
                    >
                      {coupon.code}
                    </p>
                    <p 
                      className="text-xs theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      {coupon.discountPercentage}% de descuento
                    </p>
                  </div>
                  <div className="text-right">
                    <div 
                      className="flex items-center text-xs theme-transition"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Expira: {new Date(coupon.expiresAt).toLocaleDateString('es-ES')}
                    </div>
                    <div 
                      className="flex items-center text-xs mt-1 theme-transition"
                      style={{ color: colors?.success || '#10b981' }}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Listo para usar
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reward History */}
      {rewardHistory.length > 0 && (
        <div className="mb-4">
          <h4 
            className="text-sm font-medium mb-2 flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <Clock className="w-4 h-4 mr-1" style={{ color: colors?.textSecondary || '#6b7280' }} />
            Historial Reciente
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {rewardHistory.slice(0, 3).map(history => (
              <div 
                key={history.id} 
                className="rounded-lg p-2 theme-transition"
                style={{ backgroundColor: colors?.background || '#f8fafc' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {history.type === 'coupon_generated' && (
                      <Gift className="w-3 h-3 mr-2" style={{ color: colors?.success || '#10b981' }} />
                    )}
                    {history.type === 'coupon_used' && (
                      <CheckCircle className="w-3 h-3 mr-2" style={{ color: colors?.primary || '#0ea5e9' }} />
                    )}
                    <span 
                      className="text-xs theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      {history.description}
                    </span>
                  </div>
                  <span 
                    className="text-xs theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    {new Date(history.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      {hasEarnedReward && availableCoupons.length === 0 && settings.isActive && (
        <button
          onClick={handleGenerateReward}
          disabled={loading}
          className="w-full text-white py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center theme-transition"
          style={{ background: `linear-gradient(135deg, ${colors?.accent || '#8b5cf6'}, ${colors?.secondary || '#06b6d4'})` }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Gift className="w-4 h-4 mr-2" />
          )}
          Generar Cupón de Recompensa
        </button>
      )}

      {/* Info Message */}
      {!settings.isActive && (
        <div 
          className="border rounded-lg p-3 theme-transition"
          style={{ 
            backgroundColor: `${colors?.warning || '#f59e0b'}0d`,
            borderColor: `${colors?.warning || '#f59e0b'}33`
          }}
        >
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" style={{ color: colors?.warning || '#f59e0b' }} />
            <span 
              className="text-xs theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              El sistema de recompensas está desactivado
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientRewardsCard;