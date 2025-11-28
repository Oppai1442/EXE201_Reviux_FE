import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';

const ContactUs = () => {
  const [showMap, setShowMap] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<{ [key: string]: boolean }>({});
  const contactCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroRef = useRef(null);

  // Mouse tracking for gradient effect
  useEffect(() => {
    interface HandleMouseMoveEvent extends MouseEvent {
      clientX: number;
      clientY: number;
    }

    const handleMouseMove = (e: HandleMouseMoveEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({
              ...prev,
              [(entry.target as HTMLElement).dataset.section as string]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    contactCardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    if (heroRef.current) observer.observe(heroRef.current);

    return () => observer.disconnect();
  }, []);

  const handleMapClick = () => {
    const destination = "10.8751312,106.8007233";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      info: "Student Cultural House, HCMC",
      gradient: "from-cyan-400/20 to-cyan-600/20"
    },
    {
      icon: Phone,
      title: "Phone",
      info: "+84 366862288",
      gradient: "from-cyan-400/20 to-cyan-600/20"
    },
    {
      icon: Mail,
      title: "Email",
      info: "datvpse171622@fpt.edu.vn",
      gradient: "from-cyan-400/20 to-cyan-600/20"
    },
    {
      icon: Clock,
      title: "Working Hours",
      info: "Mon - Fri: 9:00 AM - 6:00 PM",
      gradient: "from-cyan-400/20 to-cyan-600/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none transition-all duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`
        }}
      />

      {/* Subtle grid pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Hero Section */}
      <div 
        ref={heroRef}
        data-section="hero"
        className={`relative py-24 px-6 transition-all duration-1000 ${
          visibleSections.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
            Get in <span className="text-cyan-400">Touch</span>
          </h1>
          <p className="text-xl text-gray-400 font-light leading-relaxed max-w-2xl mx-auto">
            We're here to help and answer any question you might have. We look forward to hearing from you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <h2 className="text-3xl font-light mb-8 text-cyan-400">Contact Information</h2>
              
              <div className="space-y-4">
                {contactInfo.map((contact, index) => (
                  <div
                    key={index}
                    ref={el => { contactCardsRef.current[index] = el; }}
                    data-section={`card-${index}`}
                    className={`group transition-all duration-700 ${
                      visibleSections[`card-${index}`] 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 -translate-x-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="relative p-6 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:border-cyan-400/50 transition-all duration-300 overflow-hidden">
                      {/* Hover gradient effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative flex items-start gap-4">
                        <div className={`bg-gradient-to-br ${contact.gradient} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <contact.icon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-light mb-2 text-white">{contact.title}</h3>
                          <p className="text-gray-400 font-light">{contact.info}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Emergency Contact */}
              <div
                ref={el => { contactCardsRef.current[4] = el; }}
                data-section="emergency"
                className={`mt-8 transition-all duration-700 ${
                  visibleSections.emergency 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 -translate-x-8'
                }`}
                style={{ transitionDelay: '400ms' }}
              >
                <div className="relative p-8 bg-gradient-to-br from-cyan-900/20 to-cyan-950/20 backdrop-blur-sm rounded-2xl border border-cyan-500/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative">
                    <h3 className="text-2xl font-light mb-4 text-cyan-400">24/7 Emergency Line</h3>
                    <p className="text-gray-300 font-light mb-6 leading-relaxed">
                      For urgent matters and emergency assistance, our dedicated team is available around the clock.
                    </p>
                    <div className="flex items-center gap-3 text-xl font-light">
                      <div className="p-2 bg-cyan-400/20 rounded-lg">
                        <Phone className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-white">+84 366 86 2288</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div
              ref={el => { contactCardsRef.current[5] = el; }}
              data-section="map"
              className={`space-y-6 transition-all duration-700 ${
                visibleSections.map 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <h2 className="text-3xl font-light text-cyan-400">Our Location</h2>
              
              <div className="relative bg-gray-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800/50 shadow-2xl group">
                {/* Map Container */}
                <div
                  className="aspect-[4/3] bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center relative cursor-pointer overflow-hidden"
                  onClick={() => setShowMap(true)}
                >
                  {!showMap ? (
                    <div className="relative z-10 text-center p-8">
                      <div className="inline-block p-4 bg-cyan-400/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="w-12 h-12 text-cyan-400" />
                      </div>
                      <h3 className="text-2xl font-light mb-2 text-white">Interactive Map</h3>
                      <p className="text-gray-400 font-light">Click to load map</p>
                    </div>
                  ) : (
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15673.393931941979!2d106.81212808955082!3d10.861077227694748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d8a6b19d6763%3A0x143c54525028b2e!2zTmjDoCBWxINuIGjDs2EgU2luaCB2acOqbiBUUC5IQ00!5e0!3m2!1svi!2s!4v1747696235771!5m2!1svi!2s"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0"
                    />
                  )}
                  
                  {/* Overlay gradient */}
                  {!showMap && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 to-transparent" />
                  )}
                </div>

                {/* Map Info */}
                <div className="p-6 border-t border-gray-800/50">
                  <h4 className="text-lg font-light mb-2 text-white">Main Office</h4>
                  <p className="text-gray-400 font-light mb-6 leading-relaxed">
                    Located in the heart of Ho Chi Minh City, easily accessible by public transport and parking available.
                  </p>
                  <button
                    onClick={handleMapClick}
                    className="group/btn w-full md:w-auto bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-light transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/50"
                  >
                    <Navigation className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    Get Directions
                  </button>
                </div>
              </div>

              {/* Additional Info Card */}
              <div className="p-6 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/50">
                <h4 className="text-lg font-light mb-4 text-white">Visit Us</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  Feel free to drop by our office during business hours. Our team is always happy to meet in person and discuss how we can help you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.5;
          }
          90% {
            opacity: 0.3;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ContactUs;
