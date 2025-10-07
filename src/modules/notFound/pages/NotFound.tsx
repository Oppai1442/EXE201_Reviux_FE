import React, { useState, useEffect, useRef } from 'react';
import { Home, ArrowRight } from 'lucide-react';

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

const NotFound = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Generate particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    interface MouseEventWithClient extends MouseEvent {
      clientX: number;
      clientY: number;
    }

    const handleMouseMove = (e: MouseEventWithClient) => {
      setMousePosition({
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Dynamic gradient background */}
      <div 
        className="absolute inset-0 opacity-30 transition-all duration-300"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #06b6d4 0%, transparent 50%)`
        }}
      />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          transform: `translateY(${mousePosition.y * 0.1}px)`
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-cyan-400 opacity-20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `float ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div 
          ref={heroRef}
          className={`text-center max-w-4xl transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* 404 number */}
          <div className="mb-8 relative">
            <h1 className="text-[12rem] sm:text-[16rem] md:text-[20rem] font-light leading-none tracking-tight">
              <span className="inline-block bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent">
                404
              </span>
            </h1>
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          </div>

          {/* Heading */}
          <div 
            className={`mb-6 transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-light mb-4">
              <span className="text-white">Lost in </span>
              <span className="text-cyan-400">cyberspace</span>
            </h2>
            <p className="text-lg sm:text-xl font-light text-gray-300 max-w-2xl mx-auto">
              The page you're searching for has drifted into the digital void. Let's navigate you back to familiar territory.
            </p>
          </div>

          {/* Stats section */}
          <div 
            className={`grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mb-12 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
              <div className="text-3xl sm:text-4xl font-light text-cyan-400 mb-2">404</div>
              <div className="text-xs sm:text-sm font-light text-gray-400">Error Code</div>
            </div>
            <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
              <div className="text-3xl sm:text-4xl font-light text-cyan-400 mb-2">0</div>
              <div className="text-xs sm:text-sm font-light text-gray-400">Pages Here</div>
            </div>
            <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
              <div className="text-3xl sm:text-4xl font-light text-cyan-400 mb-2">∞</div>
              <div className="text-xs sm:text-sm font-light text-gray-400">Better Pages</div>
            </div>
          </div>

          {/* CTA buttons */}
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <a
              href="/"
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full font-light text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Home size={20} />
                Return Home
                <ArrowRight 
                  size={20} 
                  className="transition-transform duration-300 group-hover:translate-x-1" 
                />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>

            <button
              onClick={() => window.history.back()}
              className="group px-8 py-4 rounded-full font-light text-white border border-gray-800/50 hover:border-cyan-400 transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-gray-900/20"
            >
              <span className="flex items-center gap-2">
                Go Back
                <ArrowRight 
                  size={20} 
                  className="transition-transform duration-300 group-hover:translate-x-1" 
                />
              </span>
            </button>
          </div>

          {/* Additional help text */}
          <p 
            className={`mt-12 text-sm font-light text-gray-500 transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Error code: <span className="text-cyan-400">NOT_FOUND</span> • Status: <span className="text-cyan-400">404</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;