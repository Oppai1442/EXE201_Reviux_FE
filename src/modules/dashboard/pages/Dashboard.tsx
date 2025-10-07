import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Activity,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [particles, setParticles] = useState([]);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef([]);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.dataset.section]));
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      title: 'Total Revenue',
      value: '$124,592',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Active Users',
      value: '8,549',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Orders',
      value: '2,847',
      change: '-2.1%',
      trend: 'down',
      icon: ShoppingCart,
    },
    {
      title: 'Conversion Rate',
      value: '3.24%',
      change: '+5.4%',
      trend: 'up',
      icon: Target,
    }
  ];

  const recentActivity = [
    { id: 1, action: 'New order #12847', time: '2 minutes ago', status: 'success', icon: ShoppingCart },
    { id: 2, action: 'User registration spike', time: '15 minutes ago', status: 'info', icon: Users },
    { id: 3, action: 'Payment failed #12846', time: '32 minutes ago', status: 'error', icon: AlertCircle },
    { id: 4, action: 'Server maintenance completed', time: '1 hour ago', status: 'success', icon: CheckCircle },
    { id: 5, action: 'High traffic detected', time: '2 hours ago', status: 'warning', icon: Activity }
  ];

  const topProducts = [
    { name: 'Wireless Headphones', sales: 1247, revenue: '$24,940', trend: 'up' },
    { name: 'Smart Watch Pro', sales: 892, revenue: '$35,680', trend: 'up' },
    { name: 'Gaming Keyboard', sales: 654, revenue: '$13,080', trend: 'down' },
    { name: 'USB-C Hub', sales: 543, revenue: '$16,290', trend: 'up' },
    { name: 'Bluetooth Speaker', sales: 432, revenue: '$8,640', trend: 'down' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30';
      case 'error': return 'bg-red-400/10 text-red-400 border-red-400/30';
      case 'warning': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30';
      case 'info': return 'bg-blue-400/10 text-blue-400 border-blue-400/30';
      default: return 'bg-gray-400/10 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden">

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed rounded-full bg-cyan-400 opacity-10 pointer-events-none"
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
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div 
          ref={el => sectionRefs.current[0] = el}
          data-section="header"
          className={`mb-12 transition-all duration-1000 ${
            visibleSections.has('header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-light mb-3">
                <span className="text-white">Dashboard </span>
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Overview</span>
              </h1>
              <p className="text-gray-400 font-light text-lg">Monitor your business metrics in real-time</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors duration-300 group-focus-within:text-cyan-400" />
                <input
                  type="text"
                  placeholder="Search analytics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl pl-12 pr-4 py-3 text-white font-light placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-5 py-3 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl text-gray-400 font-light hover:border-cyan-400/50 hover:text-cyan-400 transition-all duration-300">
                <Filter className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl px-5 py-3 text-white font-light focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div 
          ref={el => sectionRefs.current[1] = el}
          data-section="stats"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                className={`group bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-cyan-400/50 hover:scale-105 transition-all duration-300 ${
                  visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-light border ${
                    stat.trend === 'up'
                      ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30'
                      : 'bg-red-400/10 text-red-400 border-red-400/30'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-light text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm font-light">{stat.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Chart Section */}
          <div 
            ref={el => sectionRefs.current[2] = el}
            data-section="chart"
            className={`lg:col-span-2 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 ${
              visibleSections.has('chart') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-white">Revenue <span className="text-cyan-400">Analytics</span></h3>
              <div className="flex items-center gap-2">
                <button className="p-2.5 bg-cyan-400/10 text-cyan-400 rounded-lg hover:bg-cyan-400/20 border border-cyan-400/30 transition-all duration-300 hover:scale-110">
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button className="p-2.5 bg-gray-800/30 text-gray-400 rounded-lg hover:bg-gray-800/50 border border-gray-800/50 transition-all duration-300 hover:scale-110">
                  <PieChart className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64 bg-gray-800/20 rounded-xl flex items-center justify-center border border-gray-800/50 backdrop-blur-sm">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-cyan-400/30 mx-auto mb-3" />
                <p className="text-gray-500 font-light">Chart visualization</p>
                <p className="text-sm text-cyan-400 mt-2 font-light">Revenue trending upward by 12.5%</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div 
            ref={el => sectionRefs.current[3] = el}
            data-section="activity"
            className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 delay-100 ${
              visibleSections.has('activity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h3 className="text-xl font-light text-white mb-6">Recent <span className="text-cyan-400">Activity</span></h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-800/20 transition-all duration-300"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${getStatusColor(activity.status)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-light">{activity.action}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-500 font-light">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-5 px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-800/50 hover:border-cyan-400/50 rounded-xl text-gray-400 hover:text-cyan-400 font-light transition-all duration-300">
              View All Activity
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <div 
            ref={el => sectionRefs.current[4] = el}
            data-section="products"
            className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 ${
              visibleSections.has('products') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-white">Top <span className="text-cyan-400">Products</span></h3>
              <button className="group px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg text-white font-light transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">
                <span className="flex items-center gap-2">
                  View All
                  <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/20 border border-transparent hover:border-gray-800/50 transition-all duration-300"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 rounded-lg flex items-center justify-center">
                      <span className="text-cyan-400 font-light text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-light">{product.name}</p>
                      <p className="text-gray-400 text-sm font-light">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-light">{product.revenue}</p>
                    <div className={`flex items-center gap-1 ${product.trend === 'up' ? 'text-cyan-400' : 'text-red-400'}`}>
                      {product.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      <span className="text-xs font-light">
                        {product.trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 15) + 1}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div 
            ref={el => sectionRefs.current[5] = el}
            data-section="metrics"
            className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 delay-100 ${
              visibleSections.has('metrics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h3 className="text-xl font-light text-white mb-6">Performance <span className="text-cyan-400">Metrics</span></h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 font-light">Server Response Time</span>
                  <span className="text-white font-light">124ms</span>
                </div>
                <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 font-light">Database Performance</span>
                  <span className="text-white font-light">92%</span>
                </div>
                <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 delay-100" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 font-light">API Success Rate</span>
                  <span className="text-white font-light">99.7%</span>
                </div>
                <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 delay-200" style={{ width: '99.7%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 font-light">Memory Usage</span>
                  <span className="text-white font-light">68%</span>
                </div>
                <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 delay-300" style={{ width: '68%' }}></div>
                </div>
              </div>
            </div>

            <button className="group w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-light text-white transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Optimize Performance
                <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-[-2px]" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;