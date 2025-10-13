import { Shield, Users, Settings, Eye, Edit, ChevronDown, ChevronUp, Plus, Search, Filter, Save, RotateCcw, History, Crown, UserCheck, UserX, Zap, Lock, Key, Database, FileText, BarChart3, MessageSquare, Calendar, Trash2, X, Check, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getPermissionsAPI, getRolesAPI } from "./services/permissionManagement";
import type { PermissionResponse, RoleResponse } from "./types";

interface Permission {
  id: number;
  name: string;
  category: string;
  icon: LucideIcon;
  description: string;
}

interface Role {
  id: number;
  name: string;
  icon: LucideIcon;
  color: string;
  users: number;
  description: string;
}

const permissionVisualConfig: Record<string, { icon: LucideIcon; category: string }> = {
  SYSTEM_VIEW_DASHBOARD: { icon: Eye, category: "System" },
  SYSTEM_MANAGE_SETTINGS: { icon: Settings, category: "System" },
  SYSTEM_VIEW_LOGS: { icon: History, category: "System" },
  SYSTEM_MANAGE_ROLES: { icon: Shield, category: "System" },
  USER_CREATE: { icon: Plus, category: "Users" },
  USER_VIEW: { icon: Eye, category: "Users" },
  USER_EDIT: { icon: Edit, category: "Users" },
  USER_DELETE: { icon: Trash2, category: "Users" },
  USER_LOCK: { icon: Lock, category: "Users" },
  FINANCE_VIEW: { icon: BarChart3, category: "Finance" },
  FINANCE_EDIT: { icon: Edit, category: "Finance" },
  FINANCE_EXPORT: { icon: Database, category: "Finance" },
  SUPPORT_VIEW_TICKETS: { icon: MessageSquare, category: "Support" },
  SUPPORT_MANAGE_TICKETS: { icon: MessageSquare, category: "Support" },
  SUPPORT_ASSIGN_TICKETS: { icon: UserCheck, category: "Support" },
  CONTENT_CREATE: { icon: Plus, category: "Content" },
  CONTENT_VIEW: { icon: Eye, category: "Content" },
  CONTENT_EDIT: { icon: Edit, category: "Content" },
  CONTENT_DELETE: { icon: Trash2, category: "Content" },
  CONTENT_PUBLISH: { icon: Zap, category: "Content" },
  API_ACCESS: { icon: Key, category: "API" },
  API_MANAGE_KEYS: { icon: Key, category: "API" },
};

const defaultPermissionVisual = { icon: Shield, category: "Other" } satisfies {
  icon: LucideIcon;
  category: string;
};

const roleVisualConfig: Record<string, { icon: LucideIcon; color: string; description: string }> = {
  "Super Admin": { icon: Crown, color: "from-cyan-500 to-cyan-600", description: "Highest level of access across the platform" },
  Admin: { icon: Shield, color: "from-cyan-400 to-cyan-500", description: "System administrator" },
  Manager: { icon: UserCheck, color: "from-cyan-500 to-blue-500", description: "Senior management responsibilities" },
  Teacher: { icon: Users, color: "from-cyan-400 to-blue-400", description: "Lecturers and instructors" },
  Assistant: { icon: UserCheck, color: "from-cyan-500 to-cyan-600", description: "Teaching assistants and support members" },
  Student: { icon: Eye, color: "from-cyan-400 to-cyan-500", description: "Learners enrolled in courses" },
  Moderator: { icon: UserX, color: "from-cyan-500 to-blue-500", description: "Content moderation team" },
  Examiner: { icon: FileText, color: "from-cyan-400 to-blue-400", description: "Assessment and exam specialists" },
  Analyst: { icon: BarChart3, color: "from-cyan-500 to-cyan-600", description: "Data analysis and reporting" },
  Support: { icon: MessageSquare, color: "from-cyan-400 to-cyan-500", description: "Customer support representatives" },
  Guest: { icon: Lock, color: "from-gray-600 to-gray-700", description: "Limited guest access" },
  Auditor: { icon: Key, color: "from-cyan-500 to-blue-500", description: "System auditing and compliance" },
};

const defaultRoleVisual = {
  icon: Shield,
  color: "from-cyan-500 to-cyan-600",
  description: "System role",
} satisfies { icon: LucideIcon; color: string; description: string };

const PermissionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());
  const [showAddPermission, setShowAddPermission] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const mapPermissionResponseToUI = (permission: PermissionResponse): Permission => {
    const visual = permissionVisualConfig[permission.name] ?? defaultPermissionVisual;
    return {
      id: permission.id,
      name: permission.name,
      category: visual.category,
      icon: visual.icon,
      description: permission.description,
    };
  };

  const mapRoleResponseToUI = (role: RoleResponse) => {
    const visual = roleVisualConfig[role.name] ?? defaultRoleVisual;
    return {
      role: {
        id: role.id,
        name: role.name,
        icon: visual.icon,
        color: visual.color,
        users: role.userCount ?? 0,
        description: visual.description,
      } satisfies Role,
      permissionIds: Array.from(
        new Set((role.permissions ?? []).map((permission) => permission.id))
      ),
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const loadPermissionsAndRoles = async () => {
      try {
        setLoading(true);
        const [permissionsResponse, rolesResponse] = await Promise.all([
          getPermissionsAPI(),
          getRolesAPI(),
        ]);

        const mappedPermissions = permissionsResponse.map(mapPermissionResponseToUI);
        setPermissions(mappedPermissions);

        const mappedRoles = rolesResponse.map(mapRoleResponseToUI);
        const permissionMap = mappedRoles.reduce<Record<number, number[]>>((acc, current) => {
          acc[current.role.id] = current.permissionIds;
          return acc;
        }, {});

        setRoles(mappedRoles.map((entry) => entry.role));
        setRolePermissions(permissionMap);
        if (mappedRoles.length > 0) {
          const initialExpanded = new Set<number>(
            mappedRoles
              .slice(0, Math.min(4, mappedRoles.length))
              .map((entry) => entry.role.id)
          );
          setExpandedRoles(initialExpanded);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching permission data:', err);
        const message = err instanceof Error
          ? err.message
          : 'Error fetching permissions. Please try again later.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadPermissionsAndRoles();
  }, []);

  const toggleRoleExpansion = (roleId: number) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const addPermissionToRole = (roleId: number, permissionId: number) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: [...(prev[roleId] || []), permissionId]
    }));
    setShowAddPermission(null);
  };

  const removePermissionFromRole = (roleId: number, permissionId: number) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter(id => id !== permissionId)
    }));
  };

  const getAvailablePermissions = (roleId: number) => {
    const currentPermissions = rolePermissions[roleId] || [];
    return permissions.filter(permission =>
      !currentPermissions.includes(permission.id) &&
      (searchTerm === "" ||
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getRolePermissions = (roleId: number) => {
    const currentPermissions = rolePermissions[roleId] || [];
    return permissions.filter(permission => currentPermissions.includes(permission.id));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
          <p className="text-red-400 font-light">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Mouse-following gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.08), transparent 40%)`
        }}
      />

      {/* Background grid pattern */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Header */}
        <div id="header" className="text-center space-y-6 pt-8">
          <h1 className="text-6xl md:text-7xl font-light text-white tracking-tight">
            Manage <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Permissions</span>
          </h1>
          <p className="text-gray-300 text-lg font-light max-w-2xl mx-auto">
            Configure detailed permissions for each role in the system
          </p>
        </div>

        {/* Stats Overview */}
        <div id="stats" className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, value: roles.length, label: 'Roles', delay: 0 },
            { icon: Key, value: permissions.length, label: 'Permissions', delay: 100 },
            { icon: Users, value: roles.reduce((sum, role) => sum + role.users, 0), label: 'Users', delay: 200 },
            { icon: Eye, value: expandedRoles.size, label: 'Expanded', delay: 300 }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="group bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${stat.delay}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow duration-300">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-light text-white">{stat.value}</h3>
                  <p className="text-gray-400 text-sm font-light">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Controls */}
        <div id="search" className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search roles or permissions..."
                  className="bg-gray-900/50 border border-gray-800/50 rounded-xl pl-12 pr-4 py-3 text-white font-light w-full focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpandedRoles(new Set(roles.map(r => r.id)))}
                className="group px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400/50 rounded-xl font-light text-cyan-400 transition-all duration-300 flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" />
                Expand all
              </button>
              <button
                onClick={() => setExpandedRoles(new Set())}
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-700 rounded-xl font-light text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2"
              >
                <ChevronUp className="w-4 h-4" />
                Collapse all
              </button>
            </div>
          </div>
        </div>

        {/* Role Columns */}
        <div id="roles" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRoles.map((role, idx) => {
            const IconComponent = role.icon;
            const isExpanded = expandedRoles.has(role.id);
            const rolePerms = getRolePermissions(role.id);
            const availablePerms = getAvailablePermissions(role.id);

            return (
              <div
                key={role.id}
                className="group bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl hover:border-cyan-400/30 transition-all duration-300 hover:scale-[1.02]"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Role Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleRoleExpansion(role.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${role.color} flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow duration-300`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-light text-white">{role.name}</h3>
                        <p className="text-gray-400 text-sm font-light">{role.users} users</p>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-cyan-400 transition-colors duration-300">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm font-light mb-4">{role.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm font-light">
                      {rolePerms.length} permissions
                    </span>
                    <div className={`px-3 py-1 rounded-lg text-xs font-light bg-gradient-to-r ${role.color} bg-opacity-20 text-cyan-400`}>
                      {rolePerms.length > 15 ? 'High' : rolePerms.length > 8 ? 'Medium' : rolePerms.length > 3 ? 'Basic' : 'Limited'}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-800/50">
                    {/* Add Permission Button */}
                    <div className="py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddPermission(showAddPermission === role.id ? null : role.id);
                        }}
                        className="group/btn w-full px-4 py-3 bg-gray-900/50 hover:bg-cyan-500/10 border border-gray-800/50 hover:border-cyan-400/30 rounded-xl font-light text-gray-300 hover:text-cyan-400 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-300" />
                        Add permissions
                      </button>
                    </div>

                    {/* Add Permission Dropdown */}
                    {showAddPermission === role.id && availablePerms.length > 0 && (
                      <div className="mb-4 bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-gray-900/20 scrollbar-thumb-cyan-400/30 hover:scrollbar-thumb-cyan-400/50">
                        <h4 className="text-white font-light mb-3 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-cyan-400" />
                          Available permissions
                        </h4>
                        <div className="space-y-2">
                          {availablePerms.map(permission => {
                            const PermIcon = permission.icon;
                            return (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/30 hover:border-cyan-400/30 rounded-lg cursor-pointer transition-all duration-300 group/perm"
                                onClick={() => addPermissionToRole(role.id, permission.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <PermIcon className="w-4 h-4 text-gray-400 group-hover/perm:text-cyan-400 transition-colors duration-300" />
                                  <div>
                                    <div className="text-white text-sm font-light">{permission.name}</div>
                                    <div className="text-gray-400 text-xs font-light">{permission.description}</div>
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-cyan-400 opacity-0 group-hover/perm:opacity-100 transition-opacity duration-300" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Current Permissions */}
                    <div className="space-y-3">
                      <h4 className="text-white font-light flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        Current permissions ({rolePerms.length})
                      </h4>

                      {rolePerms.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-light">No permissions assigned yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-gray-900/20 scrollbar-thumb-cyan-400/30 hover:scrollbar-thumb-cyan-400/50">
                          {rolePerms.map(permission => {
                            const PermIcon = permission.icon;
                            return (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800/50 rounded-lg hover:border-cyan-400/30 transition-all duration-300 group/item"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center group-hover/item:bg-cyan-500/10 transition-colors duration-300">
                                    <PermIcon className="w-4 h-4 text-gray-400 group-hover/item:text-cyan-400 transition-colors duration-300" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-white text-sm font-light">{permission.name}</div>
                                    <div className="text-gray-400 text-xs font-light">{permission.category}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removePermissionFromRole(role.id, permission.id)}
                                  className="opacity-0 group-hover/item:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Panel */}
        <div id="actions" className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button className="group px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 rounded-xl font-light text-white transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center gap-2 hover:scale-105">
                <Save className="w-4 h-4" />
                Save all changes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button className="px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-700 rounded-xl font-light text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Restore
              </button>
              <button className="px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-cyan-400/30 rounded-xl font-light text-gray-300 hover:text-cyan-400 transition-all duration-300 flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </button>
            </div>

            <div className="text-sm text-gray-400 font-light">
              Last updated: 25/05/2025 14:30
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;


