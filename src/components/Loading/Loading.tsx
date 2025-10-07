import React, { useState, useEffect } from 'react';
import { 
  Loader2, Loader, RotateCw, RefreshCw, CircleDashed, 
  Clock, Zap, Heart, Star, Sun, Moon, Coffee, Wifi,
  Download, Upload, Search, Play, Pause, ArrowRight
} from 'lucide-react';

interface LoadingProps {
  isVisible: boolean;
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'card' | 'inline' | 'popup' | 'fullscreen' | 'spinner' | 'dots' | 'bars' | 'pulse' | 'wave' | 'skeleton' | 'progress' | 'bounce' | 'slide' | 'fade' | 'matrix' | 'neon';
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'cyan' | 'orange' | 'gray';
  speed?: 'slow' | 'normal' | 'fast';
  showPercentage?: boolean;
  percentage?: number;
  customIcon?: React.ComponentType<any>;
  theme?: 'dark' | 'light' | 'gradient' | 'glassmorphism';
  pattern?: 'simple' | 'complex' | 'minimal' | 'detailed';
}

const Loading: React.FC<LoadingProps> = ({ 
  isVisible, 
  message = "Loading...", 
  size = 'md',
  variant = 'default',
  position = 'center',
  color = 'red',
  speed = 'normal',
  showPercentage = false,
  percentage = 0,
  customIcon,
  theme = 'dark',
  pattern = 'simple'
}) => {
  const [currentIcon, setCurrentIcon] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  const loadingIcons = [
    Loader2, Loader, RotateCw, RefreshCw, CircleDashed,
    Clock, Zap, Heart, Star, Sun, Moon, Coffee, Wifi,
    Download, Upload, Search, Play, Pause, ArrowRight
  ];

  // Size configurations
  const sizes = {
    xs: { icon: 'w-3 h-3', text: 'text-xs', container: 'p-2', dot: 'w-1 h-1' },
    sm: { icon: 'w-4 h-4', text: 'text-xs', container: 'p-3', dot: 'w-1.5 h-1.5' },
    md: { icon: 'w-5 h-5', text: 'text-sm', container: 'p-4', dot: 'w-2 h-2' },
    lg: { icon: 'w-6 h-6', text: 'text-base', container: 'p-6', dot: 'w-2.5 h-2.5' },
    xl: { icon: 'w-8 h-8', text: 'text-lg', container: 'p-8', dot: 'w-3 h-3' }
  };

  // Color configurations
  const colors = {
    red: { primary: 'red-500', secondary: 'red-600', accent: 'red-400', bg: 'red-500/25' },
    blue: { primary: 'blue-500', secondary: 'blue-600', accent: 'blue-400', bg: 'blue-500/25' },
    green: { primary: 'green-500', secondary: 'green-600', accent: 'green-400', bg: 'green-500/25' },
    yellow: { primary: 'yellow-500', secondary: 'yellow-600', accent: 'yellow-400', bg: 'yellow-500/25' },
    purple: { primary: 'purple-500', secondary: 'purple-600', accent: 'purple-400', bg: 'purple-500/25' },
    pink: { primary: 'pink-500', secondary: 'pink-600', accent: 'pink-400', bg: 'pink-500/25' },
    indigo: { primary: 'indigo-500', secondary: 'indigo-600', accent: 'indigo-400', bg: 'indigo-500/25' },
    cyan: { primary: 'cyan-500', secondary: 'cyan-600', accent: 'cyan-400', bg: 'cyan-500/25' },
    orange: { primary: 'orange-500', secondary: 'orange-600', accent: 'orange-400', bg: 'orange-500/25' },
    gray: { primary: 'gray-500', secondary: 'gray-600', accent: 'gray-400', bg: 'gray-500/25' }
  };

  // Speed configurations
  const speeds = {
    slow: '3s',
    normal: '2s',
    fast: '1s'
  };

  // Position classes
  const positionClasses = {
    center: 'fixed inset-0 flex items-center justify-center',
    'top-left': 'fixed top-4 left-4',
    'top-right': 'fixed top-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Theme configurations
  const themes = {
    dark: {
      bg: 'bg-gray-900/95',
      text: 'text-white',
      subtext: 'text-gray-400',
      border: 'border-gray-800',
      backdrop: 'bg-black/50'
    },
    light: {
      bg: 'bg-white/95',
      text: 'text-gray-900',
      subtext: 'text-gray-600',
      border: 'border-gray-200',
      backdrop: 'bg-white/50'
    },
    gradient: {
      bg: 'bg-gradient-to-br from-purple-900/95 to-blue-900/95',
      text: 'text-white',
      subtext: 'text-purple-200',
      border: 'border-purple-500/30',
      backdrop: 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
    },
    glassmorphism: {
      bg: 'bg-white/10 backdrop-blur-md',
      text: 'text-white',
      subtext: 'text-white/70',
      border: 'border-white/20',
      backdrop: 'bg-black/20'
    }
  };

  // Animation effects
  useEffect(() => {
    if (!isVisible) return;

    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % loadingIcons.length);
    }, parseInt(speeds[speed]) * 1000);

    const phaseInterval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => {
      clearInterval(iconInterval);
      clearInterval(phaseInterval);
    };
  }, [isVisible, speed, loadingIcons.length]);
  
  if (!isVisible) return null;

  const CurrentIcon = customIcon || loadingIcons[currentIcon];
  const currentTheme = themes[theme];
  const currentColor = colors[color];
  const currentSize = sizes[size];

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${currentColor.primary} mx-auto mb-4`}></div>
          <p className="text-gray-400">{message}</p>
          {showPercentage && (
            <p className={`text-${currentColor.primary} text-sm mt-2`}>{percentage}%</p>
          )}
        </div>
      </div>
    );
  }

  // Spinner variant
  if (variant === 'spinner') {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className={`relative ${currentSize.icon}`}>
          <div className={`absolute inset-0 rounded-full border-2 border-${currentColor.primary}/20 animate-ping`}></div>
          <div className={`absolute inset-0 rounded-full border-t-2 border-${currentColor.primary} animate-spin`}></div>
        </div>
        <span className={`${currentSize.text} ${currentTheme.subtext}`}>{message}</span>
      </div>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className={`${currentSize.dot} bg-${currentColor.primary} rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
        <span className={`${currentSize.text} ${currentTheme.subtext}`}>{message}</span>
      </div>
    );
  }

  // Bars variant
  if (variant === 'bars') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`w-1 bg-${currentColor.primary} rounded-full animate-pulse`}
              style={{ 
                height: '20px',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            ></div>
          ))}
        </div>
        <span className={`${currentSize.text} ${currentTheme.subtext}`}>{message}</span>
      </div>
    );
  }

  // Pulse variant
  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className={`${currentSize.icon} bg-${currentColor.primary} rounded-full animate-pulse shadow-lg shadow-${currentColor.bg}`}></div>
        <span className={`${currentSize.text} ${currentTheme.subtext}`}>{message}</span>
      </div>
    );
  }

  // Wave variant
  if (variant === 'wave') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`w-2 h-8 bg-${currentColor.primary} rounded-full`}
              style={{
                animation: `wave 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                transform: `scaleY(${0.4 + (Math.sin((animationPhase + i) * 0.5) * 0.6)})`
              }}
            ></div>
          ))}
        </div>
        <span className={`${currentSize.text} ${currentTheme.subtext}`}>{message}</span>
      </div>
    );
  }

  // Skeleton variant
  if (variant === 'skeleton') {
    return (
      <div className="space-y-3 animate-pulse">
        <div className={`h-4 bg-${currentColor.primary}/20 rounded w-3/4`}></div>
        <div className={`h-4 bg-${currentColor.primary}/20 rounded w-1/2`}></div>
        <div className={`h-4 bg-${currentColor.primary}/20 rounded w-5/6`}></div>
        <span className={`${currentSize.text} ${currentTheme.subtext} block mt-2`}>{message}</span>
      </div>
    );
  }

  // Progress variant
  if (variant === 'progress') {
    return (
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <span className={`${currentSize.text} ${currentTheme.text}`}>{message}</span>
          {showPercentage && <span className={`${currentSize.text} text-${currentColor.primary}`}>{percentage}%</span>}
        </div>
        <div className={`w-full bg-gray-700 rounded-full h-2`}>
          <div 
            className={`bg-${currentColor.primary} h-2 rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${showPercentage ? percentage : 50}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Matrix variant
  if (variant === 'matrix') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 bg-${currentColor.primary} rounded-sm`}
              style={{
                opacity: Math.random() > 0.5 ? 1 : 0.3,
                animation: `blink ${speeds[speed]} infinite`,
                animationDelay: `${i * 0.1}s`
              }}
            ></div>
          ))}
        </div>
        <span className={`${currentSize.text} ${currentTheme.subtext}`}>{message}</span>
      </div>
    );
  }

  // Neon variant
  if (variant === 'neon') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className={`relative ${currentSize.icon}`}>
          <CurrentIcon 
            className={`${currentSize.icon} text-${currentColor.primary} animate-spin`}
            style={{
              filter: `drop-shadow(0 0 10px rgb(var(--${currentColor.primary}))`,
              textShadow: `0 0 10px rgb(var(--${currentColor.primary})`
            }}
          />
          <div className={`absolute inset-0 ${currentSize.icon} border-2 border-${currentColor.primary} rounded-full animate-ping opacity-75`}></div>
        </div>
        <span 
          className={`${currentSize.text} text-${currentColor.primary} font-bold`}
          style={{
            textShadow: `0 0 10px rgb(var(--${currentColor.primary})`
          }}
        >
          {message}
        </span>
      </div>
    );
  }

  // Popup variant
  if (variant === 'popup') {
    return (
      <div className={`${positionClasses[position]} z-50`}>
        {position === 'center' && (
          <div className={`absolute inset-0 ${currentTheme.backdrop} backdrop-blur-sm`}></div>
        )}
        
        <div className={`relative ${currentTheme.bg} backdrop-blur-sm ${currentTheme.border} border rounded-2xl ${currentSize.container} shadow-2xl shadow-black/50 min-w-64 max-w-sm`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${currentColor.primary} to-${currentColor.secondary} flex items-center justify-center shadow-lg shadow-${currentColor.bg}`}>
              <CurrentIcon className={`w-6 h-6 ${currentTheme.text} animate-spin`} />
            </div>
            <div className="text-center">
              <p className={`${currentTheme.text} ${currentSize.text} font-semibold mb-1`}>{message}</p>
              {showPercentage && (
                <p className={`text-${currentColor.primary} text-xs mt-1`}>{percentage}%</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 bg-${currentColor.primary} rounded-full animate-pulse`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`${currentTheme.bg} backdrop-blur-sm ${currentTheme.border} border rounded-xl ${currentSize.container} flex flex-col items-center justify-center gap-4 min-h-32`}>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${currentColor.primary} to-${currentColor.secondary} flex items-center justify-center shadow-lg shadow-${currentColor.bg}`}>
          <CurrentIcon className={`w-6 h-6 ${currentTheme.text} animate-spin`} />
        </div>
        <p className={`${currentTheme.subtext} ${currentSize.text} font-medium text-center`}>{message}</p>
        {showPercentage && (
          <p className={`text-${currentColor.primary} text-xs`}>{percentage}%</p>
        )}
      </div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3">
        <CurrentIcon className={`${currentSize.icon} text-${currentColor.primary} animate-spin`} />
        <span className={`${currentSize.text} ${currentTheme.subtext} font-medium`}>{message}</span>
        {showPercentage && (
          <span className={`${currentSize.text} text-${currentColor.primary}`}>{percentage}%</span>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="relative">
        <div className={`absolute inset-0 rounded-full border-2 border-${currentColor.primary}/20 animate-pulse`}></div>
        <CurrentIcon className={`${currentSize.icon} text-${currentColor.primary} animate-spin relative z-10`} />
      </div>
      <span className={`${currentSize.text} ${currentTheme.subtext} font-medium`}>{message}</span>
      {showPercentage && (
        <span className={`${currentSize.text} text-${currentColor.primary}`}>{percentage}%</span>
      )}
    </div>
  );
};

export default Loading;