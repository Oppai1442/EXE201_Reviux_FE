

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Lock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';
import {
  couponService,
  type CouponDTO,
  type CouponPayload,
} from '@/services/coupon/couponService';

type SortField = 'code' | 'discount' | 'used' | 'revenue' | 'validUntil';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'expired';

interface CouponFormState {
  code: string;
  discount: string;
  type: 'percentage' | 'fixed';
  limit: string;
  validUntil: string;
  oneTimeUse: boolean;
  specificUser: string;
}

const defaultFormState: CouponFormState = {
  code: '',
  discount: '',
  type: 'percentage',
  limit: '',
  validUntil: '',
  oneTimeUse: false,
  specificUser: '',
};

const ITEMS_PER_PAGE = 10;

const getCouponStatus = (coupon: CouponDTO): 'active' | 'expired' => {
  const now = Date.now();
  const expiredByDate = coupon.endsAt ? new Date(coupon.endsAt).getTime() < now : false;
  const inactive = coupon.active === false;
  return expiredByDate || inactive ? 'expired' : 'active';
};

const formatDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().slice(0, 10);
};

const toIsoDate = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; detail?: string }>;
    return (
      axiosError.response?.data?.message ??
      axiosError.response?.data?.error ??
      axiosError.response?.data?.detail ??
      axiosError.message ??
      'Something went wrong. Please try again.'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

const CouponManagement: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponDTO | null>(null);
  const [formData, setFormData] = useState<CouponFormState>(defaultFormState);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0)

  const statsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await couponService.getCoupons();
      setCoupons(data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    setSelectedRows((prev) => {
      const validIds = prev.filter((id) => coupons.some((coupon) => coupon.id === id));
      if (validIds.length === prev.length) {
        return prev;
      }
      return validIds;
    });
  }, [coupons]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimate(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    if (tableRef.current) observer.observe(tableRef.current);

    return () => observer.disconnect();
  }, []);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((coupon) => getCouponStatus(coupon) === 'active').length;
    const totalUsed = coupons.reduce((sum, coupon) => sum + (coupon.usageCount ?? 0), 0);
    const totalRevenue = coupons.reduce((sum, coupon) => sum + Number(coupon.totalRevenue ?? 0), 0);
    return { total, active, totalUsed, totalRevenue };
  }, [coupons]);

  const getSortValue = (coupon: CouponDTO, field: SortField): number | string => {
    switch (field) {
      case 'discount':
        return Number(coupon.discountValue ?? 0);
      case 'used':
        return Number(coupon.usageCount ?? 0);
      case 'revenue':
        return Number(coupon.totalRevenue ?? 0);
      case 'validUntil':
        return coupon.endsAt ? new Date(coupon.endsAt).getTime() : 0;
      case 'code':
      default:
        return coupon.code ?? '';
    }
  };

  const sortedCoupons = useMemo(() => {
    const clone = [...coupons];
    return clone.sort((a, b) => {
      const aVal = getSortValue(a, sortBy);
      const bVal = getSortValue(b, sortBy);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const compare = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? compare : -compare;
      }

      const numA = Number(aVal);
      const numB = Number(bVal);

      if (numA < numB) return sortOrder === 'asc' ? -1 : 1;
      if (numA > numB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [coupons, sortBy, sortOrder]);

  const filteredCoupons = useMemo(() => {
    return sortedCoupons.filter((coupon) => {
      const matchesSearch = coupon.code
        ?.toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      const matchesFilter =
        filterStatus === 'all' ? true : getCouponStatus(coupon) === filterStatus;
      return Boolean(matchesSearch) && matchesFilter;
    });
  }, [sortedCoupons, searchQuery, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * ITEMS_PER_PAGE;
  const currentPageCoupons = filteredCoupons.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const displayStart = filteredCoupons.length === 0 ? 0 : pageStart + 1;
  const displayEnd = Math.min(filteredCoupons.length, pageStart + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreateCoupon = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditCoupon = (coupon: CouponDTO) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code ?? '',
      discount: (coupon.discountValue ?? 0).toString(),
      type: coupon.discountType === 'FIXED' ? 'fixed' : 'percentage',
      limit: coupon.usageLimit?.toString() ?? '',
      validUntil: formatDateInputValue(coupon.endsAt),
      oneTimeUse: Boolean(coupon.oneTimeUse),
      specificUser: coupon.specificUserEmail ?? '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteCoupon = async (id: number) => {
    if (isDeleting) return;
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }
    try {
      setIsDeleting(true);
      await couponService.deleteCoupon(id);
      setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
      toast.success('Coupon deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0 || isDeleting) return;
    if (!confirm(`Delete ${selectedRows.length} selected coupon(s)?`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await Promise.all(selectedRows.map((id) => couponService.deleteCoupon(id)));
      setCoupons((prev) => prev.filter((coupon) => !selectedRows.includes(coupon.id)));
      toast.success(`${selectedRows.length} coupon${selectedRows.length > 1 ? 's' : ''} deleted`);
      setSelectedRows([]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.discount || !formData.limit || !formData.validUntil) {
      toast.error('Please fill in all required fields');
      return;
    }

    const discountValue = Number(formData.discount);
    if (Number.isNaN(discountValue) || discountValue <= 0) {
      toast.error('Discount must be a positive number');
      return;
    }

    const usageLimit = Number(formData.limit);
    if (Number.isNaN(usageLimit) || usageLimit <= 0) {
      toast.error('Usage limit must be a positive number');
      return;
    }

    const payload: CouponPayload = {
      code: formData.code.trim().toUpperCase(),
      description: null,
      discountType: formData.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
      discountValue,
      maxDiscountAmount: null,
      active: true,
      startsAt: null,
      endsAt: toIsoDate(formData.validUntil),
      usageLimit,
      oneTimeUse: formData.oneTimeUse,
      specificUserEmail: formData.specificUser.trim()
        ? formData.specificUser.trim().toLowerCase()
        : null,
    };

    if (!payload.endsAt) {
      toast.error('Valid until date is invalid');
      return;
    }

    try {
      setIsSaving(true);
      if (selectedCoupon) {
        const updated = await couponService.updateCoupon(selectedCoupon.id, payload);
        setCoupons((prev) =>
          prev.map((coupon) => (coupon.id === updated.id ? updated : coupon))
        );
        toast.success('Coupon updated successfully');
      } else {
        const created = await couponService.createCoupon(payload);
        setCoupons((prev) => [...prev, created]);
        toast.success('Coupon created successfully');
      }
      handleCloseModal();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedCoupon(null);
    setFormData(defaultFormState);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const toggleRowSelection = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === filteredCoupons.length && filteredCoupons.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredCoupons.map((coupon) => coupon.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-light overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl transition-all duration-300"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="pt-12 pb-12 px-6 max-w-7xl mx-auto relative z-10">
        <div className="mb-12 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-5xl md:text-6xl font-light mb-2">
              Coupon{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-gray-400">Manage all discount codes and promotions</p>
          </div>
          <button
            onClick={handleCreateCoupon}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg hover:scale-105 transition-transform duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Create Coupon</span>
          </button>
        </div>

        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: BarChart3, label: 'Total Coupons', value: stats.total },
            { icon: TrendingUp, label: 'Active', value: stats.active },
            { icon: Users, label: 'Total Used', value: stats.totalUsed.toLocaleString() },
            {
              icon: DollarSign,
              label: 'Revenue',
              value: `$${stats.totalRevenue.toLocaleString()}`,
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`backdrop-blur-md bg-gray-900/20 border border-gray-800/50 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 ${
                animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-3xl font-light mb-1 text-cyan-400">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-6 py-3 bg-gray-900/50 border border-gray-800/50 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          {selectedRows.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : `Delete (${selectedRows.length})`}
            </button>
          )}
        </div>

        <div
          ref={tableRef}
          className="backdrop-blur-md bg-gray-900/20 border border-gray-800/50 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="text-left p-4 font-light text-gray-400">
                    <input
                      type="checkbox"
                      checked={
                        filteredCoupons.length > 0 &&
                        selectedRows.length === filteredCoupons.length
                      }
                      onChange={toggleAllRows}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800/50"
                      disabled={filteredCoupons.length === 0}
                    />
                  </th>
                  <th
                    className="text-left p-4 font-light text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center gap-2">
                      Code
                      {sortBy === 'code' && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            sortOrder === 'desc' ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 font-light text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('discount')}
                  >
                    <div className="flex items-center gap-2">
                      Discount
                      {sortBy === 'discount' && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            sortOrder === 'desc' ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 font-light text-gray-400">Type</th>
                  <th className="text-left p-4 font-light text-gray-400">Status</th>
                  <th className="text-left p-4 font-light text-gray-400">Restrictions</th>
                  <th
                    className="text-left p-4 font-light text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('used')}
                  >
                    <div className="flex items-center gap-2">
                      Usage
                      {sortBy === 'used' && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            sortOrder === 'desc' ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 font-light text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center gap-2">
                      Revenue
                      {sortBy === 'revenue' && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            sortOrder === 'desc' ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 font-light text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('validUntil')}
                  >
                    <div className="flex items-center gap-2">
                      Valid Until
                      {sortBy === 'validUntil' && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            sortOrder === 'desc' ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th className="text-right p-4 font-light text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-400">
                      Loading coupons...
                    </td>
                  </tr>
                ) : currentPageCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-400">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  currentPageCoupons.map((coupon, index) => {
                    const usageCount = coupon.usageCount ?? 0;
                    const usageLimit = coupon.usageLimit ?? 0;
                    const usagePercent =
                      usageLimit > 0 ? Math.min(100, (usageCount / usageLimit) * 100) : 0;
                    const status = getCouponStatus(coupon);

                    return (
                      <tr
                        key={coupon.id}
                        className={`border-b border-gray-800/30 hover:bg-gray-800/30 transition-all duration-300 ${
                          animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                        } ${selectedRows.includes(coupon.id) ? 'bg-cyan-500/5' : ''}`}
                        style={{ transitionDelay: `${index * 30}ms` }}
                      >

                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(coupon.id)}
                            onChange={() => toggleRowSelection(coupon.id)}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-800/50"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-light">{coupon.code}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(coupon.code ?? '')}
                              className="p-1 hover:bg-gray-800/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-cyan-400">
                          {coupon.discountValue}
                          {coupon.discountType === 'PERCENTAGE' ? '%' : '$'}
                        </td>
                        <td className="p-4 text-gray-400 capitalize">
                          {coupon.discountType?.toLowerCase()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              status === 'active'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {coupon.oneTimeUse && (
                              <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs border border-purple-500/30 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                One-time
                              </span>
                            )}
                            {coupon.specificUserEmail && (
                              <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs border border-orange-500/30 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Private
                              </span>
                            )}
                            {!coupon.oneTimeUse && !coupon.specificUserEmail && (
                              <span className="text-gray-500 text-xs">None</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-800/50 rounded-full overflow-hidden w-20">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-500"
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-400">
                              {usageCount}/{usageLimit || '&infin;'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-cyan-400">
                          ${Number(coupon.totalRevenue ?? 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-gray-400">
                          {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString() : '--'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCoupon(coupon)}
                              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              disabled={isDeleting}
                              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
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
      </div>
    </div>

      <div className="flex items-center justify-between px-6 pb-12 max-w-7xl mx-auto text-sm text-gray-400">
        <div>
          Showing {displayStart} to {displayEnd} of {filteredCoupons.length} coupons
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPageSafe === 1}
            className="p-2 rounded-lg bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            const isVisible =
              page === 1 || page === totalPages || (page >= currentPageSafe - 1 && page <= currentPageSafe + 1);
            if (!isVisible) {
              if (page === currentPageSafe - 2 || page === currentPageSafe + 2) {
                return (
                  <span key={page} className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            }
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg border ${
                  page === currentPageSafe
                    ? 'border-cyan-400/70 bg-cyan-500/10 text-cyan-200'
                    : 'border-gray-800/50 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-200'
                } transition-colors duration-200`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPageSafe === totalPages}
            className="p-2 rounded-lg bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-light mb-6">
              {selectedCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors"
                  placeholder="SUMMER2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Discount *</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponFormState['type'] })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Usage Limit *</label>
                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Valid Until *</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className="block text-sm text-gray-400 mb-3">Usage Restrictions</label>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/30 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.oneTimeUse}
                      onChange={(e) => setFormData({ ...formData, oneTimeUse: e.target.checked })}
                      className="w-5 h-5 mt-0.5 rounded border-gray-700 bg-gray-800/50"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-white mb-1">
                        <User className="w-4 h-4 text-purple-400" />
                        <span>One-time use per user</span>
                      </div>
                      <p className="text-xs text-gray-500">Each user can only use this coupon once</p>
                    </div>
                  </label>

                  <div className="p-3 rounded-lg bg-gray-800/20">
                    <div className="flex items-center gap-2 text-white mb-2">
                      <Lock className="w-4 h-4 text-orange-400" />
                      <span className="text-sm">Specific User Only</span>
                    </div>
                    <input
                      type="email"
                      value={formData.specificUser}
                      onChange={(e) => setFormData({ ...formData, specificUser: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-cyan-400/50 focus:outline-none transition-colors text-sm"
                      placeholder="user@example.com (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for public coupon</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg hover:scale-105 transition-transform duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? 'Saving...'
                  : selectedCoupon
                  ? 'Update Coupon'
                  : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        .animate-float {
          animation: float linear infinite;
        }
        tr:hover .group-hover\:opacity-100 {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default CouponManagement;
