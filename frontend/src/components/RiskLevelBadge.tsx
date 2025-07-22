import type { RiskLevel } from '@/lib/types';

interface RiskLevelBadgeProps {
  riskLevel: RiskLevel;
  className?: string;
}

export function RiskLevelBadge({ riskLevel, className = '' }: RiskLevelBadgeProps) {
  const getBadgeClasses = (level: RiskLevel) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (level) {
      case 'red':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'amber':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'green':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getLabel = (level: RiskLevel) => {
    switch (level) {
      case 'red':
        return 'High Risk';
      case 'amber':
        return 'Medium Risk';
      case 'green':
        return 'Low Risk';
      default:
        return 'Unknown';
    }
  };

  return (
    <span className={`${getBadgeClasses(riskLevel)} ${className}`}>
      {getLabel(riskLevel)}
    </span>
  );
} 