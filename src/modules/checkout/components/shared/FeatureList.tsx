import React from 'react';
import { Check, Zap } from 'lucide-react';

interface Feature {
  featureKey: string;
  featureValue: string;
}

interface FeatureListProps {
  features: Feature[];
  title?: string;
  titleIcon?: React.ReactNode;
  getFeatureText: (featureKey: string) => string;
}

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  title = "Features",
  titleIcon = <Zap className="w-5 h-5 text-red-400" />,
  getFeatureText
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      {titleIcon}
      {title}
    </h3>

    <div className="grid grid-cols-1 gap-3">
      {features.map((feature, index) => (
        <div key={`${feature.featureKey}-${index}`} className="flex items-start justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/50 gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-medium leading-snug break-words">
              {getFeatureText(feature.featureKey)}
            </span>
          </div>
          <span className="text-red-400 font-semibold whitespace-nowrap flex-shrink-0">
            {feature.featureValue}
          </span>
        </div>
      ))}
    </div>
  </div>
);