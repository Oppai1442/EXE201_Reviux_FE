import { Shield, Users, Settings, Eye, Edit, ChevronDown, ChevronUp, Plus, Search, Filter, Save, RotateCcw, History, Crown, UserCheck, UserX, Zap, Lock, Key, Database, FileText, BarChart3, MessageSquare, Calendar, Trash2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";


interface Permission {
 id: number;
 name: string;
 category: string;
 icon: any;
 description: string;
}


interface Role {
 id: number;
 name: string;
 icon: any;
 color: string;
 users: number;
 description: string;
}


const PermissionManagement: React.FC = () => {
 const [searchTerm, setSearchTerm] = useState("");
 const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set([1, 2, 4, 6]));
 const [showAddPermission, setShowAddPermission] = useState<number | null>(null);
 const [permissions, setPermissions] = useState<Permission[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);


 const roles: Role[] = [
   { id: 1, name: "Super Admin", icon: Crown, color: "from-purple-600 to-purple-700", users: 2, description: "Quyền cao nhất trong hệ thống" },
   { id: 2, name: "Admin", icon: Shield, color: "from-red-600 to-red-700", users: 5, description: "Quản trị viên hệ thống" },
   { id: 3, name: "Manager", icon: UserCheck, color: "from-blue-600 to-blue-700", users: 8, description: "Quản lý cấp cao" },
   { id: 4, name: "Teacher", icon: Users, color: "from-green-600 to-green-700", users: 45, description: "Giảng viên, giáo viên" },
   { id: 5, name: "Assistant", icon: UserCheck, color: "from-yellow-600 to-yellow-700", users: 12, description: "Trợ giảng, hỗ trợ" },
   { id: 6, name: "Student", icon: Eye, color: "from-cyan-600 to-cyan-700", users: 1250, description: "Học sinh, sinh viên" },
   { id: 7, name: "Moderator", icon: UserX, color: "from-orange-600 to-orange-700", users: 6, description: "Quản lý nội dung" },
   { id: 8, name: "Examiner", icon: FileText, color: "from-indigo-600 to-indigo-700", users: 15, description: "Chuyên viên thi cử" },
   { id: 9, name: "Analyst", icon: BarChart3, color: "from-pink-600 to-pink-700", users: 4, description: "Phân tích dữ liệu" },
   { id: 10, name: "Support", icon: MessageSquare, color: "from-teal-600 to-teal-700", users: 8, description: "Hỗ trợ khách hàng" },
   { id: 11, name: "Guest", icon: Lock, color: "from-gray-600 to-gray-700", users: 0, description: "Khách truy cập" },
   { id: 12, name: "Auditor", icon: Key, color: "from-emerald-600 to-emerald-700", users: 3, description: "Kiểm toán hệ thống" }
 ];


 // Permission assignments for each role (initial state)
 const [rolePermissions, setRolePermissions] = useState<Record<number, number[]>>({
   1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], // Super Admin
   2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21], // Admin
   3: [1, 5, 6, 7, 9, 10, 11, 12, 13, 14, 17, 18, 19, 20], // Manager
   4: [5, 6, 8, 9, 10, 11, 17, 18, 19, 20], // Teacher
   5: [6, 8, 9, 10, 17, 18, 20], // Assistant
   6: [9, 10, 17], // Student
   7: [1, 9, 10, 11, 17, 18, 19, 20], // Moderator
   8: [5, 6, 7, 8, 9, 10, 11, 12], // Examiner
   9: [10, 11, 12, 13, 17], // Analyst
   10: [10, 13, 14, 15, 20], // Support
   11: [], // Guest
   12: [10, 11, 12, 13, 17] // Auditor
 });


 // Fetch permissions from API
 useEffect(() => {
   const fetchPermissions = async () => {
     try {
       setLoading(true);
       const response = await fetch(`${import.meta.env.VITE_API_URL}/permission`);
       if (!response.ok) {
         throw new Error('Failed to fetch permissions');
       }
       const { data } = await response.json();
       // Map API data to Permission interface
       const mappedPermissions: Permission[] = data.map((perm: any) => {
         let icon;
         let category;
         switch (perm.name) {
           case 'SYSTEM_VIEW_DASHBOARD':
             icon = Eye;
             category = 'Hệ thống';
             break;
           case 'SYSTEM_MANAGE_SETTINGS':
             icon = Settings;
             category = 'Hệ thống';
             break;
           case 'SYSTEM_VIEW_LOGS':
             icon = History;
             category = 'Hệ thống';
             break;
           case 'SYSTEM_MANAGE_ROLES':
             icon = Shield;
             category = 'Hệ thống';
             break;
           case 'USER_CREATE':
             icon = Plus;
             category = 'Người dùng';
             break;
           case 'USER_VIEW':
             icon = Eye;
             category = 'Người dùng';
             break;
           case 'USER_EDIT':
             icon = Edit;
             category = 'Người dùng';
             break;
           case 'USER_DELETE':
             icon = Trash2;
             category = 'Người dùng';
             break;
           case 'USER_LOCK':
             icon = Lock;
             category = 'Người dùng';
             break;
           case 'FINANCE_VIEW':
             icon = BarChart3;
             category = 'Tài chính';
             break;
           case 'FINANCE_EDIT':
             icon = Edit;
             category = 'Tài chính';
             break;
           case 'FINANCE_EXPORT':
             icon = Database;
             category = 'Tài chính';
             break;
           case 'SUPPORT_VIEW_TICKETS':
             icon = MessageSquare;
             category = 'Hỗ trợ';
             break;
           case 'SUPPORT_MANAGE_TICKETS':
             icon = MessageSquare;
             category = 'Hỗ trợ';
             break;
           case 'SUPPORT_ASSIGN_TICKETS':
             icon = UserCheck;
             category = 'Hỗ trợ';
             break;
           case 'CONTENT_CREATE':
             icon = Plus;
             category = 'Nội dung';
             break;
           case 'CONTENT_VIEW':
             icon = Eye;
             category = 'Nội dung';
             break;
           case 'CONTENT_EDIT':
             icon = Edit;
             category = 'Nội dung';
             break;
           case 'CONTENT_DELETE':
             icon = Trash2;
             category = 'Nội dung';
             break;
           case 'CONTENT_PUBLISH':
             icon = Zap;
             category = 'Nội dung';
             break;
           case 'API_ACCESS':
             icon = Key;
             category = 'API';
             break;
           case 'API_MANAGE_KEYS':
             icon = Key;
             category = 'API';
             break;
           default:
             icon = Shield;
             category = 'Khác';
             break;
         }
         return {
           id: perm.id,
           name: perm.name,
           category,
           icon,
           description: perm.description
         };
       });
       setPermissions(mappedPermissions);
       setLoading(false);
     } catch (err) {
       setError('Error fetching permissions. Please try again later.');
       setLoading(false);
     }
   };
   fetchPermissions();
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
     <div className="min-h-screen bg-black p-6 flex items-center justify-center">
       <p className="text-white text-xl">Loading...</p>
     </div>
   );
 }


 if (error) {
   return (
     <div className="min-h-screen bg-black p-6 flex items-center justify-center">
       <p className="text-red-400 text-xl">{error}</p>
     </div>
   );
 }


 return (
   <div className="min-h-screen bg-black p-6">
     <div className="max-w-7xl mx-auto space-y-8">
       {/* Header */}
       <div className="text-center space-y-4">
         <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
           Quản lý Phân quyền theo Vai trò
         </h1>
         <p className="text-gray-400 text-lg">Cấu hình quyền hạn chi tiết cho từng vai trò trong hệ thống</p>
       </div>


       {/* Stats Overview */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
               <Shield className="w-6 h-6 text-white" />
             </div>
             <div>
               <h3 className="text-3xl font-bold text-white">{roles.length}</h3>
               <p className="text-gray-400 text-sm">Vai trò</p>
             </div>
           </div>
         </div>


         <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
               <Key className="w-6 h-6 text-white" />
             </div>
             <div>
               <h3 className="text-3xl font-bold text-white">{permissions.length}</h3>
               <p className="text-gray-400 text-sm">Quyền hạn</p>
             </div>
           </div>
         </div>


         <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/25">
               <Users className="w-6 h-6 text-white" />
             </div>
             <div>
               <h3 className="text-3xl font-bold text-white">{roles.reduce((sum, role) => sum + role.users, 0)}</h3>
               <p className="text-gray-400 text-sm">Người dùng</p>
             </div>
           </div>
         </div>


         <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/25">
               <Eye className="w-6 h-6 text-white" />
             </div>
             <div>
               <h3 className="text-3xl font-bold text-white">{expandedRoles.size}</h3>
               <p className="text-gray-400 text-sm">Đang mở</p>
             </div>
           </div>
         </div>
       </div>


       {/* Search Controls */}
       <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-4 flex-1">
             <div className="relative flex-1 max-w-md">
               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input
                 type="text"
                 placeholder="Tìm kiếm vai trò hoặc quyền hạn..."
                 className="bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white w-full focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
           </div>


           <div className="flex items-center gap-3">
             <button
               onClick={() => setExpandedRoles(new Set(roles.map(r => r.id)))}
               className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-xl font-semibold text-white transition-all duration-200 flex items-center gap-2"
             >
               <ChevronDown className="w-4 h-4" />
               Mở tất cả
             </button>
             <button
               onClick={() => setExpandedRoles(new Set())}
               className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-white transition-all duration-200 flex items-center gap-2"
             >
               <ChevronUp className="w-4 h-4" />
               Đóng tất cả
             </button>
           </div>
         </div>
       </div>


       {/* Role Columns */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filteredRoles.map(role => {
           const IconComponent = role.icon;
           const isExpanded = expandedRoles.has(role.id);
           const rolePerms = getRolePermissions(role.id);
           const availablePerms = getAvailablePermissions(role.id);


           return (
             <div key={role.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl hover:border-gray-700 transition-all duration-300">
               {/* Role Header */}
               <div
                 className="p-6 cursor-pointer"
                 onClick={() => toggleRoleExpansion(role.id)}
               >
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${role.color} flex items-center justify-center shadow-lg`}>
                       <IconComponent className="w-5 h-5 text-white" />
                     </div>
                     <div>
                       <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                       <p className="text-gray-400 text-sm">{role.users} người dùng</p>
                     </div>
                   </div>
                   {isExpanded ? (
                     <ChevronUp className="w-5 h-5 text-gray-400" />
                   ) : (
                     <ChevronDown className="w-5 h-5 text-gray-400" />
                   )}
                 </div>


                 <p className="text-gray-400 text-sm mb-4">{role.description}</p>


                 <div className="flex items-center justify-between">
                   <span className="text-gray-300 text-sm font-medium">
                     {rolePerms.length} quyền hạn
                   </span>
                   <div className={`px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${role.color} bg-opacity-20 text-white`}>
                     {rolePerms.length > 15 ? 'Cao' : rolePerms.length > 8 ? 'Trung bình' : rolePerms.length > 3 ? 'Cơ bản' : 'Hạn chế'}
                   </div>
                 </div>
               </div>


               {/* Expanded Content */}
               {isExpanded && (
                 <div className="px-6 pb-6 border-t border-gray-700">
                   {/* Add Permission Button */}
                   <div className="py-4">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setShowAddPermission(showAddPermission === role.id ? null : role.id);
                       }}
                       className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-gray-500 rounded-xl font-medium text-gray-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                     >
                       <Plus className="w-4 h-4" />
                       Thêm quyền hạn
                     </button>
                   </div>


                   {/* Add Permission Dropdown */}
                   {showAddPermission === role.id && availablePerms.length > 0 && (
                     <div className="mb-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                       <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                         <Plus className="w-4 h-4" />
                         Quyền có thể thêm
                       </h4>
                       <div className="space-y-2">
                         {availablePerms.map(permission => {
                           const PermIcon = permission.icon;
                           return (
                             <div
                               key={permission.id}
                               className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg cursor-pointer transition-all duration-200"
                               onClick={() => addPermissionToRole(role.id, permission.id)}
                             >
                               <div className="flex items-center gap-3">
                                 <PermIcon className="w-4 h-4 text-gray-400" />
                                 <div>
                                   <div className="text-white text-sm font-medium">{permission.name}</div>
                                   <div className="text-gray-400 text-xs">{permission.description}</div>
                                 </div>
                               </div>
                               <Plus className="w-4 h-4 text-green-400" />
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}


                   {/* Current Permissions */}
                   <div className="space-y-3">
                     <h4 className="text-white font-medium flex items-center gap-2">
                       <Shield className="w-4 h-4" />
                       Quyền hiện tại ({rolePerms.length})
                     </h4>


                     {rolePerms.length === 0 ? (
                       <div className="text-center py-8 text-gray-400">
                         <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                         <p>Chưa có quyền hạn nào</p>
                       </div>
                     ) : (
                       <div className="space-y-2 max-h-80 overflow-y-auto
                       scrollbar-thin scrollbar-track-gray-900/20 scrollbar-thumb-gray-700/60
                       hover:scrollbar-thumb-gray-600/80 scrollbar-thumb-rounded-full scrollbar-track-rounded-full
                       [&::-webkit-scrollbar]:w-2
                       [&::-webkit-scrollbar-track]:bg-gray-900/20
                       [&::-webkit-scrollbar-track]:rounded-full
                       [&::-webkit-scrollbar-thumb]:bg-gray-700/60
                       [&::-webkit-scrollbar-thumb]:rounded-full
                       [&::-webkit-scrollbar-thumb]:border-transparent
                       [&::-webkit-scrollbar-thumb]:bg-clip-padding
                       hover:[&::-webkit-scrollbar-thumb]:bg-gray-600/80">
                         {rolePerms.map(permission => {
                           const PermIcon = permission.icon;
                           return (
                             <div
                               key={permission.id}
                               className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-all duration-200 group"
                             >
                               <div className="flex items-center gap-3 flex-1">
                                 <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                                   <PermIcon className="w-4 h-4 text-gray-300" />
                                 </div>
                                 <div className="flex-1">
                                   <div className="text-white text-sm font-medium">{permission.name}</div>
                                   <div className="text-gray-400 text-xs">{permission.category}</div>
                                 </div>
                               </div>
                               <button
                                 onClick={() => removePermissionFromRole(role.id, permission.id)}
                                 className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200"
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
       <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
         <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center gap-2">
               <Save className="w-4 h-4" />
               Lưu tất cả thay đổi
             </button>
             <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-white transition-all duration-200 flex items-center gap-2">
               <RotateCcw className="w-4 h-4" />
               Khôi phục mặc định
             </button>
             <button className="px-6 py-3 bg-blue-600/80 hover:bg-blue-600 rounded-xl font-semibold text-white transition-all duration-200 flex items-center gap-2">
               <History className="w-4 h-4" />
               Xem lịch sử
             </button>
           </div>


           <div className="text-sm text-gray-400">
             Cập nhật lần cuối: 25/05/2025 14:30
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};


export default PermissionManagement;
