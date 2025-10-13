import type { ComponentType, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  Trash2,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import type { UserMini, UserRole, UserStatus } from '@/types';
import {
  deleteUserAPI,
  getAllUserAPI,
  getUserDetailAPI,
  getUserSummaryAPI,
  updateUserProfileAPI,
  type UpdateUserPayload,
  type UsersSummaryResponse,
} from './services/UserManagement';

type RoleFilter = UserRole | 'all';
type StatusFilter = UserStatus | 'all';

interface PageMeta {
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

interface EditingUserState {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
}

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [users, setUsers] = useState<UserMini[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageMeta, setPageMeta] = useState<PageMeta>({
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: ITEMS_PER_PAGE,
  });
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [summary, setSummary] = useState<UsersSummaryResponse>({
    totalUser: 0,
    activeUser: 0,
    inactiveUser: 0,
    adminUser: 0,
  });
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserMini | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sectionId = entry.target.getAttribute('data-section');
          if (!sectionId) return;

          setVisibleSections((prev) => {
            if (prev.has(sectionId)) return prev;
            const next = new Set(prev);
            next.add(sectionId);
            return next;
          });
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const data = await getUserSummaryAPI();
      setSummary(data);
    } catch (error) {
      toast.error('Failed to load user summary. Please try again.');
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(
    async (page: number) => {
      const targetPage = page < 1 ? 1 : page;
      const pageIndex = targetPage - 1;

      try {
        setIsUsersLoading(true);
        const data = await getAllUserAPI(pageIndex, ITEMS_PER_PAGE, debouncedSearch, roleFilter, statusFilter);

        if (data.totalPages > 0 && pageIndex >= data.totalPages) {
          void fetchUsers(data.totalPages);
          return;
        }

        setUsers(data.content ?? []);
        setPageMeta({
          totalPages: data.totalPages ?? 0,
          totalElements: data.totalElements ?? data.content?.length ?? 0,
          number: data.number ?? pageIndex,
          size: data.size ?? ITEMS_PER_PAGE,
        });
        setCurrentPage((data.number ?? pageIndex) + 1);
      } catch (error) {
        toast.error('Failed to load users. Please try again.');
      } finally {
        setIsUsersLoading(false);
      }
    },
    [debouncedSearch, roleFilter, statusFilter]
  );

  const goToPage = useCallback(
    (page: number) => {
      void fetchUsers(page);
    },
    [fetchUsers]
  );

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    goToPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, goToPage]);

  const currentUsers = users;
  const totalCount = pageMeta.totalElements ?? currentUsers.length;
  const pageSize = pageMeta.size || ITEMS_PER_PAGE;
  const safeTotalPages =
    pageMeta.totalPages && pageMeta.totalPages > 0
      ? pageMeta.totalPages
      : totalCount > 0
      ? Math.max(Math.ceil(totalCount / pageSize), 1)
      : 0;
  const showPagination = safeTotalPages > 1;
  const pageRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageRangeEnd = totalCount === 0 ? 0 : Math.min(pageRangeStart + currentUsers.length - 1, totalCount);

  const pageButtons = useMemo(() => {
    if (!showPagination) return [];

    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(safeTotalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const buttons: number[] = [];
    for (let page = start; page <= end; page += 1) {
      buttons.push(page);
    }
    return buttons;
  }, [currentPage, safeTotalPages, showPagination]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const stats = useMemo(
    () => [
      { label: 'Total Users', value: summary.totalUser, icon: Users, gradient: 'from-cyan-500/20 to-cyan-600/20', type: 'total' as const },
      { label: 'Active', value: summary.activeUser, icon: null, gradient: 'from-cyan-500/20 to-cyan-600/20', type: 'active' as const },
      { label: 'Inactive', value: summary.inactiveUser, icon: null, gradient: 'from-red-500/20 to-red-600/20', type: 'inactive' as const },
      { label: 'Admins', value: summary.adminUser, icon: null, gradient: 'from-purple-500/20 to-purple-600/20', type: 'admin' as const },
    ],
    [summary]
  );

  const getRoleConfig = useCallback((role: UserRole | string) => {
    const map: Record<UserRole, { className: string; label: string }> = {
      ROLE_ADMIN: { className: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30', label: 'Admin' },
      ROLE_USER: { className: 'bg-blue-400/10 text-blue-400 border-blue-400/30', label: 'User' },
    };
    return map[role as UserRole] ?? { className: 'bg-gray-400/10 text-gray-400 border-gray-400/30', label: role };
  }, []);

  const getStatusConfig = useCallback((status: UserStatus | string) => {
    const map: Record<string, { className: string; label: string; indicator: string }> = {
      ACTIVE: { className: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30', label: 'Active', indicator: 'bg-cyan-400' },
      INACTIVE: { className: 'bg-amber-400/10 text-amber-300 border-amber-400/30', label: 'Inactive', indicator: 'bg-amber-300' },
      DISABLE: { className: 'bg-gray-500/10 text-gray-300 border-gray-500/30', label: 'Disabled', indicator: 'bg-gray-400' },
      LOCKED: { className: 'bg-red-400/10 text-red-400 border-red-400/30', label: 'Locked', indicator: 'bg-red-400' },
      SUSPENDED: { className: 'bg-orange-400/10 text-orange-300 border-orange-400/30', label: 'Suspended', indicator: 'bg-orange-300' },
    };
    return map[status] ?? { className: 'bg-gray-400/10 text-gray-400 border-gray-400/30', label: status, indicator: 'bg-gray-400' };
  }, []);

  const openEditModal = useCallback(async (userId: number) => {
    setIsEditLoading(true);
    try {
      const response = await getUserDetailAPI(userId);
      const detail = response?.data;
      if (!detail) throw new Error('User data unavailable');

      const nameParts = (detail.fullName ?? '').split(' ').filter(Boolean);
      const [firstName, ...rest] = nameParts;

      setEditingUser({
        id: detail.id,
        fullName: detail.fullName,
        email: detail.email,
        role: detail.role as UserRole,
        status: detail.status as UserStatus,
        firstName: firstName ?? '',
        lastName: rest.join(' '),
      });
    } catch (error) {
      toast.error('Failed to load user details. Please try again.');
      closeEditModal();
    } finally {
      setIsEditLoading(false);
    }
  }, []);

  const handleEdit = (user: UserMini) => {
    setIsEditModalOpen(true);
    setEditingUser(null);
    void openEditModal(user.id);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    const trimmedFirst = editingUser.firstName.trim();
    const trimmedLast = editingUser.lastName.trim();
    if (!trimmedFirst && !trimmedLast) {
      toast.error('Please provide at least one name field.');
      return;
    }

    setIsEditSubmitting(true);
    const payload: UpdateUserPayload = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
    };

    try {
      const response = await updateUserProfileAPI(payload);
      if (!response?.data) {
        throw new Error(response?.message || 'Update failed');
      }

      toast.success(response.message || 'User updated successfully.');
      closeEditModal();

      await Promise.allSettled([fetchUsers(currentPage), fetchSummary()]);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update user. Please try again.';
      toast.error(message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setIsDeleteSubmitting(true);
    try {
      const response = await deleteUserAPI(userToDelete.id);
      if (!response?.data) {
        throw new Error(response?.message || 'Delete failed');
      }

      toast.success(response.message || 'User deleted successfully.');
      closeDeleteModal();

      await Promise.allSettled([fetchUsers(currentPage), fetchSummary()]);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete user. Please try again.';
      toast.error(message);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    icon: Icon,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    icon?: ComponentType<{ className?: string }>;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl rounded-2xl border border-gray-800/50 bg-gray-900/95 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
              )}
              <h2 className="text-2xl font-light text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition-all duration-300 hover:bg-gray-800/50 hover:text-cyan-400"
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
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #06b6d4 0%, transparent 50%)`,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-5 transition-transform duration-700"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: `translateY(${mousePosition.y * 0.05}px)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-6">
        <div
          data-section="header"
          className={`flex flex-col items-start gap-4 transition-all duration-1000 lg:flex-row lg:items-center lg:justify-between ${
            visibleSections.has('header') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
          }`}
        >
          <div>
            <h1 className="mb-3 text-5xl font-light text-white md:text-6xl">
              <span>User </span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Management</span>
            </h1>
            <p className="text-lg font-light text-gray-400">Manage system user accounts</p>
          </div>
        </div>

        <div data-section="stats" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const borderClass =
              stat.type === 'inactive'
                ? 'border-red-400/30'
                : stat.type === 'admin'
                ? 'border-purple-400/30'
                : 'border-cyan-400/30';

            return (
              <div
                key={stat.label}
                className={`rounded-2xl border border-gray-800/50 bg-gray-900/20 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/50 hover:scale-105 ${
                  visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${borderClass} bg-gradient-to-br ${stat.gradient}`}>
                    {stat.icon ? (
                      <stat.icon className="h-6 w-6 text-cyan-400" />
                    ) : stat.type === 'active' ? (
                      <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                    ) : stat.type === 'inactive' ? (
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                    ) : stat.type === 'admin' ? (
                      <div className="h-4 w-4 rounded border-2 border-dashed border-purple-400" />
                    ) : null}
                  </div>
                </div>
                <p className="mb-1 text-sm font-light text-gray-400">{stat.label}</p>
                <p className="text-3xl font-light text-white">
                  {isSummaryLoading ? <span className="animate-pulse text-gray-500">--</span> : stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <div
          data-section="filters"
          className={`rounded-2xl border border-gray-800/50 bg-gray-900/20 p-6 transition-all duration-1000 backdrop-blur-sm ${
            visibleSections.has('filters') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-gray-800/50 bg-gray-900/20 py-3 pl-12 pr-4 font-light text-white placeholder-gray-500 transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                className="rounded-xl border border-gray-800/50 bg-gray-900/20 px-4 py-3 font-light text-white transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="all">All Roles</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_USER">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-xl border border-gray-800/50 bg-gray-900/20 px-4 py-3 font-light text-white transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DISABLE">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div
          data-section="table"
          className={`overflow-hidden rounded-2xl border border-gray-800/50 bg-gray-900/20 transition-all duration-1000 backdrop-blur-sm ${
            visibleSections.has('table') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/20">
                <tr>
                  {['User Info', 'Role', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-left text-xs font-light uppercase tracking-wider text-gray-400">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10">
                      <div className="flex items-center justify-center gap-3 font-light text-gray-400">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center font-light text-gray-500">
                      No users found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => {
                    const roleConfig = getRoleConfig(user.role);
                    const statusConfig = getStatusConfig(user.status);

                    return (
                      <tr key={user.id} className="transition-all duration-300 hover:bg-gray-800/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                              <span className="text-sm font-light text-cyan-400">
                                {user.fullName
                                  .split(' ')
                                  .filter(Boolean)
                                  .map((namePart) => namePart[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-light text-white">{user.fullName}</p>
                              <p className="text-sm font-light text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-lg border px-3 py-1.5 text-xs font-light ${roleConfig.className}`}>
                            {roleConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-light ${statusConfig.className}`}>
                            <span className={`h-2 w-2 rounded-full ${statusConfig.indicator}`} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              disabled={isEditLoading || isEditSubmitting}
                              className="rounded-lg border border-transparent p-2 text-cyan-400 transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteModalOpen(true);
                              }}
                              disabled={isDeleteSubmitting}
                              className="rounded-lg border border-transparent p-2 text-red-400 transition-all duration-300 hover:border-red-400/30 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-800/50 px-6 py-4">
            <div className="text-sm font-light text-gray-400">
              {isUsersLoading
                ? 'Loading users...'
                : totalCount === 0
                ? 'No users to display'
                : `Showing ${pageRangeStart}-${pageRangeEnd} of ${totalCount}`}
            </div>
            {showPagination && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={isUsersLoading || currentPage === 1}
                  className="rounded-lg border border-gray-800/50 p-2 text-gray-400 transition-all duration-300 hover:border-cyan-400/50 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageButtons.map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    disabled={isUsersLoading}
                    className={`rounded-lg px-3 py-2 text-sm font-light transition-all duration-300 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    } ${isUsersLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={isUsersLoading || (safeTotalPages !== 0 && currentPage >= safeTotalPages)}
                  className="rounded-lg border border-gray-800/50 p-2 text-gray-400 transition-all duration-300 hover:border-cyan-400/50 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit User" icon={Edit3}>
          {isEditLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-3 font-light text-gray-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                Loading user details...
              </div>
            </div>
          ) : editingUser ? (
            <>
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-xl border border-gray-800/50 bg-gray-800/20 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                    <span className="text-lg font-light text-cyan-400">
                      {editingUser.fullName
                        .split(' ')
                        .filter(Boolean)
                        .map((namePart) => namePart[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-light text-white">{editingUser.fullName}</p>
                    <p className="text-sm font-light text-gray-400">{editingUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-light text-gray-400">First Name</label>
                    <input
                      type="text"
                      value={editingUser.firstName}
                      onChange={(event) =>
                        setEditingUser((prev) => (prev ? { ...prev, firstName: event.target.value } : prev))
                      }
                      className="w-full rounded-xl border border-gray-800/50 bg-gray-900/20 px-4 py-3 font-light text-white transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-light text-gray-400">Last Name</label>
                    <input
                      type="text"
                      value={editingUser.lastName}
                      onChange={(event) =>
                        setEditingUser((prev) => (prev ? { ...prev, lastName: event.target.value } : prev))
                      }
                      className="w-full rounded-xl border border-gray-800/50 bg-gray-900/20 px-4 py-3 font-light text-white transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-light text-gray-400">Role</label>
                    {(() => {
                      const roleBadge = getRoleConfig(editingUser.role);
                      return (
                        <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-light ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-light text-gray-400">Status</label>
                    {(() => {
                      const statusBadge = getStatusConfig(editingUser.status);
                      return (
                        <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-light ${statusBadge.className}`}>
                          <span className={`h-2 w-2 rounded-full ${statusBadge.indicator}`} />
                          {statusBadge.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-xs font-light text-gray-500">
                  Only first and last name can be updated from this view. Updating role or status requires backend support.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeEditModal}
                  disabled={isEditSubmitting}
                  className="rounded-xl px-6 py-3 font-light text-gray-400 transition-all duration-300 hover:bg-gray-800/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isEditSubmitting || isEditLoading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3 font-light text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:from-cyan-400 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEditSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center font-light text-gray-400">No user selected.</div>
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Confirm Delete" icon={AlertTriangle}>
          {userToDelete ? (
            <>
              <div className="mb-6 flex items-start gap-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
                <div>
                  <p className="font-light text-white">Are you sure you want to delete this user?</p>
                  <p className="mt-1 text-sm font-light text-gray-400">This action cannot be undone.</p>
                  <p className="mt-2 text-sm font-light text-red-400">
                    {userToDelete.fullName} ({userToDelete.email})
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleteSubmitting}
                  className="rounded-xl px-6 py-3 font-light text-gray-400 transition-all duration-300 hover:bg-gray-800/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleteSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-light text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:from-red-400 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleteSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center font-light text-gray-400">No user selected.</div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UserManagement;
