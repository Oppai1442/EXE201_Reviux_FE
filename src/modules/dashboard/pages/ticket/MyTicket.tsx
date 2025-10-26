import React, { useState, useEffect, useRef } from 'react';
import { Search, Eye, RefreshCw, ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle, Clock, X, Send, Paperclip, Image as ImageIcon, Users, MoreVertical, Smile, Check, CheckCheck } from 'lucide-react';

const TicketManager = () => {
  const [tickets, setTickets] = useState([
    { 
      id: 1, 
      title: 'Login Authentication Bug', 
      status: 'open', 
      priority: 'high', 
      date: '2024-10-20', 
      category: 'Bug',
      description: 'Users are experiencing intermittent login failures when attempting to authenticate with their credentials. The issue appears to be related to session management and token validation. Multiple users have reported this problem across different browsers and devices.',
      assignee: { name: 'Sarah Chen', avatar: 'SC', role: 'Senior Developer' },
      reporter: { name: 'Mike Johnson', avatar: 'MJ', role: 'QA Engineer' },
      createdAt: '2024-10-20 09:15 AM',
      updatedAt: '2024-10-20 02:30 PM',
      tags: ['authentication', 'security', 'urgent'],
      attachments: [
        { name: 'error-log.txt', size: '2.3 KB', type: 'text' },
        { name: 'screenshot.png', size: '156 KB', type: 'image' }
      ],
      participants: [
        { id: 1, name: 'Sarah Chen', avatar: 'SC', status: 'online', role: 'Developer' },
        { id: 2, name: 'Mike Johnson', avatar: 'MJ', status: 'online', role: 'QA Engineer' },
        { id: 3, name: 'Emma Wilson', avatar: 'EW', status: 'away', role: 'Tech Lead' },
        { id: 4, name: 'David Lee', avatar: 'DL', status: 'offline', role: 'DevOps' }
      ],
      messages: [
        { id: 1, sender: 'Mike Johnson', avatar: 'MJ', text: 'I\'ve identified the issue. It seems to be related to the JWT token expiration handling.', time: '09:20 AM', status: 'read' },
        { id: 2, sender: 'Sarah Chen', avatar: 'SC', text: 'Thanks for catching this. Let me investigate the token refresh mechanism.', time: '09:25 AM', status: 'read' },
        { id: 3, sender: 'Emma Wilson', avatar: 'EW', text: 'Priority should be high on this one. How many users are affected?', time: '10:15 AM', status: 'read' },
        { id: 4, sender: 'Mike Johnson', avatar: 'MJ', text: 'Approximately 15-20% of daily active users are reporting this issue.', time: '10:20 AM', status: 'read', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop' },
        { id: 5, sender: 'Sarah Chen', avatar: 'SC', text: 'I\'ve pushed a fix to staging. Can you verify?', time: '02:30 PM', status: 'delivered' }
      ]
    },
    { 
      id: 2, 
      title: 'Feature Request: Dark Mode', 
      status: 'in-progress', 
      priority: 'medium', 
      date: '2024-10-19', 
      category: 'Feature',
      description: 'Multiple users have requested a dark mode theme option. This would improve user experience during nighttime usage and reduce eye strain.',
      assignee: { name: 'Alex Rivera', avatar: 'AR', role: 'UI/UX Designer' },
      reporter: { name: 'Lisa Park', avatar: 'LP', role: 'Product Manager' },
      createdAt: '2024-10-19 11:00 AM',
      updatedAt: '2024-10-19 04:45 PM',
      tags: ['feature', 'ui', 'enhancement'],
      attachments: [],
      participants: [
        { id: 1, name: 'Alex Rivera', avatar: 'AR', status: 'online', role: 'Designer' },
        { id: 2, name: 'Lisa Park', avatar: 'LP', status: 'online', role: 'PM' }
      ],
      messages: [
        { id: 1, sender: 'Lisa Park', avatar: 'LP', text: 'We\'ve received over 200 requests for dark mode in the last month.', time: '11:05 AM', status: 'read' },
        { id: 2, sender: 'Alex Rivera', avatar: 'AR', text: 'Working on the design system update now. Should have mockups by EOD.', time: '11:30 AM', status: 'read' }
      ]
    },
    { 
      id: 3, 
      title: 'Payment Gateway Issue', 
      status: 'open', 
      priority: 'critical', 
      date: '2024-10-18', 
      category: 'Bug',
      description: 'Critical payment processing failures detected in production. Transactions are failing with error code 500. Immediate attention required.',
      assignee: { name: 'Tom Anderson', avatar: 'TA', role: 'Backend Lead' },
      reporter: { name: 'Rachel Green', avatar: 'RG', role: 'Support Manager' },
      createdAt: '2024-10-18 08:00 AM',
      updatedAt: '2024-10-18 08:45 AM',
      tags: ['payment', 'critical', 'production'],
      attachments: [
        { name: 'error-trace.log', size: '5.7 KB', type: 'text' }
      ],
      participants: [
        { id: 1, name: 'Tom Anderson', avatar: 'TA', status: 'online', role: 'Backend' },
        { id: 2, name: 'Rachel Green', avatar: 'RG', status: 'online', role: 'Support' },
        { id: 3, name: 'Kevin Zhang', avatar: 'KZ', status: 'online', role: 'DevOps' }
      ],
      messages: [
        { id: 1, sender: 'Rachel Green', avatar: 'RG', text: 'Multiple customers reporting failed payments. This is affecting revenue!', time: '08:05 AM', status: 'read' },
        { id: 2, sender: 'Tom Anderson', avatar: 'TA', text: 'On it. Checking the payment gateway logs now.', time: '08:10 AM', status: 'read' },
        { id: 3, sender: 'Kevin Zhang', avatar: 'KZ', text: 'I see elevated error rates in the monitoring dashboard.', time: '08:15 AM', status: 'read' }
      ]
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const itemsPerPage = 8;
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = () => {
    const button = document.querySelector('.refresh-btn');
    button.classList.add('animate-spin');
    setTimeout(() => {
      button.classList.remove('animate-spin');
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() && uploadedImages.length === 0) return;

    const newMessage = {
      id: selectedTicket.messages.length + 1,
      sender: 'You',
      avatar: 'YO',
      text: messageInput,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      image: uploadedImages.length > 0 ? uploadedImages[0] : null
    };

    setTickets(tickets.map(ticket => 
      ticket.id === selectedTicket.id 
        ? { ...ticket, messages: [...ticket.messages, newMessage] }
        : ticket
    ));

    setSelectedTicket({
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMessage]
    });

    setMessageInput('');
    setUploadedImages([]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages([e.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'in-progress': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'closed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-light relative overflow-hidden">
      {/* Mouse Following Gradient */}
      <div 
        className="fixed pointer-events-none z-0 transition-all duration-300 ease-out"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Background Grid */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-light mb-4">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">Tickets</span>
          </h1>
          <p className="text-gray-400 text-lg">Manage and track all your support tickets</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 backdrop-blur-xl bg-gray-900/20 border border-gray-800/50 rounded-2xl p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tickets by title, category, or status..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/30 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tickets', value: tickets.length, color: 'cyan' },
            { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'cyan' },
            { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: 'purple' },
            { label: 'Closed', value: tickets.filter(t => t.status === 'closed').length, color: 'green' },
          ].map((stat, i) => (
            <div key={i} className="backdrop-blur-xl bg-gray-900/20 border border-gray-800/50 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
              <div className={`text-3xl font-light mb-2 text-${stat.color}-400`}>{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="backdrop-blur-xl bg-gray-900/20 border border-gray-800/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30 border-b border-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-light text-gray-400">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.map((ticket, index) => (
                  <tr 
                    key={ticket.id}
                    className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors duration-200"
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <td className="px-6 py-4 text-gray-300">#{ticket.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-white font-light">{ticket.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {ticket.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 hover:scale-110 transition-all duration-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleRefresh}
                          className="refresh-btn p-2 rounded-lg bg-purple-400/10 border border-purple-400/20 text-purple-400 hover:bg-purple-400/20 hover:scale-110 transition-all duration-200"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-800/20 border-t border-gray-800/50">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                    currentPage === i + 1
                      ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-400'
                      : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-7xl h-[90vh] bg-gray-900 rounded-2xl border border-gray-800/50 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800/50 bg-gray-800/30">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-light">Ticket #{selectedTicket.id}</h2>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  {selectedTicket.status.replace('-', ' ')}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Ticket Details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title */}
                <div>
                  <h3 className="text-3xl font-light mb-2">{selectedTicket.title}</h3>
                  <p className="text-gray-400">{selectedTicket.description}</p>
                </div>

                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Assignee</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-sm font-medium">
                        {selectedTicket.assignee.avatar}
                      </div>
                      <div>
                        <div className="text-white">{selectedTicket.assignee.name}</div>
                        <div className="text-gray-500 text-xs">{selectedTicket.assignee.role}</div>
                      </div>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Reporter</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-sm font-medium">
                        {selectedTicket.reporter.avatar}
                      </div>
                      <div>
                        <div className="text-white">{selectedTicket.reporter.name}</div>
                        <div className="text-gray-500 text-xs">{selectedTicket.reporter.role}</div>
                      </div>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Created</div>
                    <div className="text-white">{selectedTicket.createdAt}</div>
                  </div>

                  <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Last Updated</div>
                    <div className="text-white">{selectedTicket.updatedAt}</div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="text-gray-400 text-sm mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-800/30 border border-gray-700/50 rounded-full text-sm text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                {selectedTicket.attachments.length > 0 && (
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Attachments</div>
                    <div className="space-y-2">
                      {selectedTicket.attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:bg-gray-800/50 transition-colors duration-200">
                          <Paperclip className="w-5 h-5 text-cyan-400" />
                          <div className="flex-1">
                            <div className="text-white text-sm">{file.name}</div>
                            <div className="text-gray-500 text-xs">{file.size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Timeline */}
                <div>
                  <div className="text-gray-400 text-sm mb-4">Activity Timeline</div>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-white text-sm">Ticket created</div>
                        <div className="text-gray-500 text-xs">{selectedTicket.createdAt}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-400/20 border border-purple-400/50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-white text-sm">Status changed to {selectedTicket.status}</div>
                        <div className="text-gray-500 text-xs">{selectedTicket.updatedAt}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Chat Window */}
              <div className="w-[450px] border-l border-gray-800/50 flex flex-col bg-gray-900/50">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-800/50 bg-gray-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-light">Discussion</h3>
                    <button
                      onClick={() => setShowParticipants(!showParticipants)}
                      className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 relative"
                    >
                      <Users className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full text-xs flex items-center justify-center text-gray-900">
                        {selectedTicket.participants.length}
                      </span>
                    </button>
                  </div>
                  
                  {/* Participants List */}
                  {showParticipants && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                      {selectedTicket.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-200">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xs font-medium">
                              {participant.avatar}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
                              participant.status === 'online' ? 'bg-green-400' : 
                              participant.status === 'away' ? 'bg-yellow-400' : 'bg-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm truncate">{participant.name}</div>
                            <div className="text-gray-500 text-xs">{participant.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {message.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-sm font-medium">{message.sender}</span>
                          <span className="text-gray-500 text-xs">{message.time}</span>
                          {message.status === 'read' && (
                            <CheckCheck className="w-3 h-3 text-cyan-400" />
                          )}
                          {message.status === 'delivered' && (
                            <CheckCheck className="w-3 h-3 text-gray-500" />
                          )}
                          {message.status === 'sent' && (
                            <Check className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl rounded-tl-none p-3">
                          {message.image && (
                            <img 
                              src={message.image} 
                              alt="Uploaded" 
                              className="w-full rounded-lg mb-2 max-h-48 object-cover"
                            />
                          )}
                          <p className="text-gray-300 text-sm">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image Preview */}
                {uploadedImages.length > 0 && (
                  <div className="px-4 pb-2">
                    <div className="relative inline-block">
                      <img 
                        src={uploadedImages[0]} 
                        alt="Preview" 
                        className="max-h-24 rounded-lg"
                      />
                      <button
                        onClick={() => setUploadedImages([])}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-gray-800/50 bg-gray-800/30">
                  <div className="flex items-end gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200">
                      <Smile className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        rows="1"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all duration-300 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() && uploadedImages.length === 0}
                      className="p-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-gray-500 text-xs mt-2">Press Enter to send, Shift+Enter for new line</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-spin {
          animation: spin 1s linear;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
};

export default TicketManager;
