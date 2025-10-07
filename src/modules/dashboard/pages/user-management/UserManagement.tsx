import { useState, useEffect } from 'react';
import { UserPlus, Edit3, Trash2, Search, Filter, Users, ChevronLeft, ChevronRight, X, Save, AlertTriangle } from 'lucide-react';

const UserManagement = () => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [visibleSections, setVisibleSections] = useState(new Set());
  
  const itemsPerPage = 5;
  const [summary] = useState({
    totalUser: 248,
    activeUser: 203,
    inactiveUser: 45,
    adminUser: 12
  });

  const [mockUsers] = useState([
    { id: 1, fullName: 'John Doe', email: 'john@example.com', role: 'ROLE_ADMIN', status: 'ACTIVE' },
    { id: 2, fullName: 'Jane Smith', email: 'jane@example.com', role: 'ROLE_USER', status: 'ACTIVE' },
    { id: 3, fullName: 'Bob Johnson', email: 'bob@example.com', role: 'ROLE_USER', status: 'INACTIVE' },
    { id: 4, fullName: 'Alice Williams', email: 'alice@example.com', role: 'ROLE_USER', status: 'ACTIVE' },
    { id: 5, fullName: 'Charlie Brown', email: 'charlie@example.com', role: 'ROLE_ADMIN', status: 'ACTIVE' }
  ]);

  useEffect(() => {
    setUsers(mockUsers);
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mockUsers]);

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

    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleConfig = (role) => ({
    'ROLE_ADMIN': { class: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30', label: 'Admin' },
    'ROLE_USER': { class: 'bg-blue-400/10 text-blue-400 border-blue-400/30', label: 'User' }
  }[role] || { class: 'bg-gray-400/10 text-gray-400 border-gray-400/30', label: role });

  const getStatusConfig = (status) => ({
    'ACTIVE': { class: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30', label: 'Active' },
    'INACTIVE': { class: 'bg-red-400/10 text-red-400 border-red-400/30', label: 'Inactive' }
  }[status] || { class: 'bg-gray-400/10 text-gray-400 border-gray-400/30', label: status });

  const handleEdit = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      setIsEditModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleDelete = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 md:p-8 w-full max-w-2xl shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-10 h-10 bg-cyan-400/10 border border-cyan-400/30 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
              )}
              <h2 className="text-2xl font-light text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div 
        className="fixed inset-0 opacity-20 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #06b6d4 0%, transparent 50%)`
        }}
      />
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div 
          data-section="header"
          className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all duration-1000 ${
            visibleSections.has('header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-light mb-3">
              <span className="text-white">User </span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Management</span>
            </h1>
            <p className="text-gray-400 font-light text-lg">Manage system user accounts</p>
          </div>
        </div>

        {/* Stats */}
        <div data-section="stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Users', value: summary.totalUser, icon: Users, gradient: 'from-cyan-500/20 to-cyan-600/20' },
            { label: 'Active', value: summary.activeUser, icon: null, gradient: 'from-cyan-500/20 to-cyan-600/20', dot: true },
            { label: 'Inactive', value: summary.inactiveUser, icon: null, gradient: 'from-red-500/20 to-red-600/20', dot: 'red' },
            { label: 'Admins', value: summary.adminUser, icon: null, gradient: 'from-purple-500/20 to-purple-600/20', badge: true }
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-cyan-400/50 hover:scale-105 transition-all duration-300 ${
                visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} border ${
                  stat.dot === 'red' ? 'border-red-400/30' : stat.badge ? 'border-purple-400/30' : 'border-cyan-400/30'
                } rounded-xl flex items-center justify-center`}>
                  {stat.icon ? <stat.icon className="h-6 w-6 text-cyan-400" /> :
                   stat.dot ? <div className={`w-3 h-3 rounded-full ${stat.dot === 'red' ? 'bg-red-400' : 'bg-cyan-400'} ${stat.dot !== 'red' && 'animate-pulse'}`} /> :
                   stat.badge ? <div className="w-4 h-4 border-2 border-purple-400 rounded border-dashed" /> : null}
                </div>
              </div>
              <p className="text-gray-400 text-sm font-light mb-1">{stat.label}</p>
              <p className="text-3xl font-light text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div 
          data-section="filters"
          className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-1000 ${
            visibleSections.has('filters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/20 border border-gray-800/50 rounded-xl text-white font-light placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 bg-gray-900/20 border border-gray-800/50 rounded-xl text-white font-light focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
              >
                <option value="all">All Roles</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_USER">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-900/20 border border-gray-800/50 rounded-xl text-white font-light focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div 
          data-section="table"
          className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden transition-all duration-1000 ${
            visibleSections.has('table') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/20">
                <tr>
                  {['User Info', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {currentUsers.map((user, i) => {
                  const roleConfig = getRoleConfig(user.role);
                  const statusConfig = getStatusConfig(user.status);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-800/20 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 rounded-xl flex items-center justify-center">
                            <span className="text-cyan-400 font-light text-sm">
                              {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-light">{user.fullName}</p>
                            <p className="text-gray-400 text-sm font-light">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-light border ${roleConfig.class}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-light border flex items-center gap-2 w-fit ${statusConfig.class}`}>
                          <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-cyan-400' : 'bg-red-400'}`} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg border border-transparent hover:border-cyan-400/30 transition-all duration-300"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg border border-transparent hover:border-red-400/30 transition-all duration-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between">
              <div className="text-sm text-gray-400 font-light">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-800/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-light transition-all duration-300 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-800/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User" icon={Edit3}>
          {editingUser && (
            <>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-800/20 rounded-xl border border-gray-800/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 rounded-xl flex items-center justify-center">
                    <span className="text-cyan-400 font-light text-lg">
                      {editingUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-light">{editingUser.fullName}</p>
                    <p className="text-gray-400 text-sm font-light">{editingUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-light text-gray-400 mb-2">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-900/20 border border-gray-800/50 rounded-xl text-white font-light focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                    >
                      <option value="ROLE_USER">User</option>
                      <option value="ROLE_ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-light text-gray-400 mb-2">Status</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-900/20 border border-gray-800/50 rounded-xl text-white font-light focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl font-light transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete" icon={AlertTriangle}>
          {userToDelete && (
            <>
              <div className="flex items-start gap-4 mb-6 p-4 bg-red-400/10 border border-red-400/30 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-white font-light">Are you sure you want to delete this user?</p>
                  <p className="text-gray-400 text-sm font-light mt-1">This action cannot be undone.</p>
                  <p className="text-red-400 text-sm font-light mt-2">{userToDelete.fullName} ({userToDelete.email})</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl font-light transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-red-500/30 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete User
      Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl font-light transition-all duration-300 shadow-lg shadow-red-500/30 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UserManagement;
