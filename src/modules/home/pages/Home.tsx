import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Shield, Zap, Users, ArrowRight, CheckCircle, Star, Play, ChevronRight } from 'lucide-react';

const FEATURE_CARDS = [
  {
    icon: Shield,
    title: "Comprehensive Testing",
    description: "Full-spectrum testing including functional, performance, security, and usability testing to ensure complete coverage.",
    delay: 0,
  },
  {
    icon: Zap,
    title: "Rapid Execution",
    description: "Accelerated testing cycles with automated frameworks and efficient processes to meet tight deadlines.",
    delay: 200,
  },
  {
    icon: Users,
    title: "Expert Team",
    description: "Skilled professionals with deep expertise in various testing methodologies and cutting-edge tools.",
    delay: 400,
  },
];

const RevuixLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [animatedCounters, setAnimatedCounters] = useState({});
  
  const observerRef = useRef(null);
  const particlesRef = useRef(null);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach(section => observerRef.current.observe(section));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Animated counter
  const useAnimatedCounter = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
      if (!hasStarted) return;
      
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startValue + (end - startValue) * easeOut);
        
        setCount(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [hasStarted, end, duration]);

    return [count, () => setHasStarted(true)];
  };

  // Floating particles
  const Particles = () => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 20,
    }));

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute bg-cyan-400/20 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${20 + particle.speed * 10}s infinite linear`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
    );
  };

  const StatCard = ({ number, label, suffix = "", delay = 0 }) => {
    const [count, startCount] = useAnimatedCounter(number);
    
    useEffect(() => {
      if (visibleSections.has('stats')) {
        const timer = setTimeout(startCount, delay);
        return () => clearTimeout(timer);
      }
    }, [visibleSections, startCount, delay]);

    return (
      <div className="text-center group">
        <div className="text-4xl lg:text-5xl font-light text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
          {count}{suffix}
        </div>
        <div className="text-gray-400 font-light">{label}</div>
      </div>
    );
  };

  const ProcessStep = ({ number, title, description, delay = 0 }) => {
    const isVisible = visibleSections.has('process');
    
    return (
      <div 
        className={`relative ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ 
          transitionDelay: isVisible ? `${delay}ms` : '0ms',
          transitionDuration: '600ms'
        }}
      >
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-light text-lg">
            {number}
          </div>
          {number < 3 && (
            <div className="hidden md:block w-24 h-px bg-gradient-to-r from-cyan-400 to-transparent ml-4"></div>
          )}
        </div>
        <h3 className="text-xl font-light text-white mb-2">{title}</h3>
        <p className="text-gray-300 font-light">{description}</p>
      </div>
    );
  };

  const TestimonialCard = ({ quote, author, company, delay = 0 }) => {
    const isVisible = visibleSections.has('testimonials');
    
    return (
      <div 
        className={`p-6 rounded-xl bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/30 transition-all duration-300 group ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ 
          transitionDelay: isVisible ? `${delay}ms` : '0ms',
          transitionDuration: '600ms'
        }}
      >
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-cyan-400 fill-current" />
          ))}
        </div>
        <blockquote className="text-gray-300 font-light mb-4 italic">"{quote}"</blockquote>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-light text-sm mr-3">
            {author.charAt(0)}
          </div>
          <div>
            <div className="text-white font-light">{author}</div>
            <div className="text-gray-400 text-sm">{company}</div>
          </div>
        </div>
      </div>
    );
  };

  const isFeaturesVisible = visibleSections.has('features');

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.1), transparent 40%)`
        }}
      />
      
      {/* Grid Pattern */}
      {/* <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          transform: `translate(${-scrollY * 0.1}px, ${-scrollY * 0.1}px)`
        }}
      /> */}

      {/* Floating Particles */}
      <Particles />

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight">
            <span className="text-white">Premium</span>{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Testing</span>{' '}
            <span className="text-white">Solutions</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
            Elevate your software quality with our comprehensive testing services. 
            We deliver precision, reliability, and excellence in every project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-lg font-light text-white hover:scale-105 transition-all duration-300 flex items-center justify-center">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button className="px-8 py-4 border border-cyan-400/50 rounded-lg font-light text-cyan-400 hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" data-animate className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Why Choose <span className="text-cyan-400">Reviux</span>
            </h2>
            <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
              Our comprehensive testing solutions ensure your software meets the highest standards
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURE_CARDS.map(({ icon: Icon, title, description, delay }) => (
              <div
                key={title}
                className={`p-6 rounded-xl bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 group ${
                  isFeaturesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: isFeaturesVisible ? `${delay}ms` : '0ms',
                  transitionDuration: '600ms',
                }}
              >
                <div className="w-12 h-12 bg-cyan-400/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-400/30 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-light text-white mb-2">{title}</h3>
                <p className="text-gray-300 font-light leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" data-animate className="py-20 bg-gray-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Our <span className="text-cyan-400">Process</span>
            </h2>
            <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
              A streamlined approach to deliver exceptional testing results
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ProcessStep
              number={1}
              title="Analysis & Planning"
              description="We analyze your requirements and create a comprehensive testing strategy tailored to your project."
              delay={0}
            />
            <ProcessStep
              number={2}
              title="Execution & Testing"
              description="Our expert team implements rigorous testing procedures using industry-leading tools and methodologies."
              delay={200}
            />
            <ProcessStep
              number={3}
              title="Reporting & Delivery"
              description="Detailed reports with actionable insights and recommendations for optimal software quality."
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" data-animate className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Client <span className="text-cyan-400">Testimonials</span>
            </h2>
            <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
              What our clients say about our testing services
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Reviux transformed our testing process. Their attention to detail and expertise helped us deliver a flawless product."
              author="Sarah Johnson"
              company="TechCorp"
              delay={0}
            />
            <TestimonialCard
              quote="Outstanding service and professionalism. The team at Reviux exceeded our expectations in every way."
              author="Michael Chen"
              company="InnovateLabs"
              delay={200}
            />
            <TestimonialCard
              quote="Their comprehensive testing approach caught issues we never would have found. Highly recommended!"
              author="Emily Rodriguez"
              company="NextGen Solutions"
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-400/10 to-cyan-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Ready to Elevate Your <span className="text-cyan-400">Software Quality</span>?
          </h2>
          <p className="text-xl text-gray-300 font-light mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust Reviux for their testing needs
          </p>
          <button className="group px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-lg font-light text-white hover:scale-105 transition-all duration-300 flex items-center justify-center mx-auto">
            Start Your Project
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default RevuixLanding;
