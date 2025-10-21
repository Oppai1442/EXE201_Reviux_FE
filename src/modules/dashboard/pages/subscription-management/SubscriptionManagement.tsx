import { useCallback, useEffect, useState } from 'react';
import type { ComponentType, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import * as Icons from 'lucide-react';
import { Loading } from '@/components/Loading';
import { createSubscriptionAPI, deleteSubscriptionAPI, getFeaturesAPI, getSubscriptionsAPI, updateSubscriptionAPI } from './services/subscriptionService';
import type { BillingPeriod, createSubscriptionRequestDTO, Feature, Subscription, SubscriptionFeature, SubscriptionStatus, updateSubscriptionRequestDTO } from './types';
import { showToast } from '@/utils';
import { Save, X, Plus, Sparkles, DollarSign, Clock, Palette, Tag, Edit3, Trash2, Check, Target, Crown, Zap, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const toDefaultFeatureLabel = (key: string): string => {
  if (!key) return '';

  return key
    .split('_')
    .map((segment) => {
      if (segment.length <= 3 && segment === segment.toUpperCase()) {
        return segment;
      }

      return segment.charAt(0) + segment.slice(1).toLowerCase();
    })
    .join(' ');
};


// Type definitions based on your interface
const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Subscription>({
    id: 0,
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    billingPeriod: 'MONTHLY' as BillingPeriod,
    features: [{ featureKey: '', featureValue: '' }], // Changed from string[] to object[]
    icon: 'target',
    isPopular: false,
    themeColor: 'blue',
    status: 'ACTIVE' as SubscriptionStatus
  });

  const [features, setFeatures] = useState<Feature[]>([]);
  const { t } = useTranslation();

  const getFeatureLabel = useCallback(
    (featureKey: string) => {
      if (!featureKey) return '';

      const defaultLabel = toDefaultFeatureLabel(featureKey);
      return t(`subscription.features.${featureKey}`, { defaultValue: defaultLabel });
    },
    [t]
  );

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptions, features] = await Promise.all([
        getSubscriptionsAPI(),
        getFeaturesAPI(),
      ]);

      setSubscriptions(subscriptions);
      setFeatures(features);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const iconOptions = [
    { value: 'target', icon: Icons.Target, label: 'Target' },
    { value: 'crown', icon: Icons.Crown, label: 'Crown' },
    { value: 'zap', icon: Icons.Zap, label: 'Zap' },
    { value: 'star', icon: Icons.Star, label: 'Star' },
    { value: 'diamond', icon: Icons.Diamond, label: 'Diamond' },
    { value: 'trophy', icon: Icons.Trophy, label: 'Trophy' },
    { value: 'award', icon: Icons.Award, label: 'Award' },
    { value: 'gem', icon: Icons.Gem, label: 'Gem' },
    { value: 'rocket', icon: Icons.Rocket, label: 'Rocket' },
    { value: 'shield', icon: Icons.Shield, label: 'Shield' },
    { value: 'heart', icon: Icons.Heart, label: 'Heart' },
    { value: 'flame', icon: Icons.Flame, label: 'Flame' },
    { value: 'lightning', icon: Icons.Bolt, label: 'Lightning' },
    { value: 'sparkles', icon: Icons.Sparkles, label: 'Sparkles' },
    { value: 'gift', icon: Icons.Gift, label: 'Gift' },
    { value: 'medal', icon: Icons.Medal, label: 'Medal' },
    { value: 'badge', icon: Icons.BadgeCheck, label: 'Badge' },
    { value: 'thumbs-up', icon: Icons.ThumbsUp, label: 'Thumbs Up' }
  ];
  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'from-blue-600 to-blue-700' },
    { value: 'red', label: 'Red', class: 'from-red-600 to-red-700' },
    { value: 'green', label: 'Green', class: 'from-green-600 to-green-700' },
    { value: 'purple', label: 'Purple', class: 'from-purple-600 to-purple-700' },
    { value: 'orange', label: 'Orange', class: 'from-orange-600 to-orange-700' },
    { value: 'pink', label: 'Pink', class: 'from-pink-600 to-pink-700' },
    { value: 'indigo', label: 'Indigo', class: 'from-indigo-600 to-indigo-700' },
    { value: 'teal', label: 'Teal', class: 'from-teal-600 to-teal-700' },
    { value: 'cyan', label: 'Cyan', class: 'from-cyan-600 to-cyan-700' },
    { value: 'yellow', label: 'Yellow', class: 'from-yellow-600 to-yellow-700' },
    { value: 'emerald', label: 'Emerald', class: 'from-emerald-600 to-emerald-700' },
    { value: 'slate', label: 'Slate', class: 'from-slate-600 to-slate-700' }
  ];

  const billingPeriodOptions: { value: BillingPeriod; label: string }[] = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'SEMI_ANNUALLY', label: 'Semi-ANNUALLY' },
    { value: 'ANNUALLY', label: 'Annually' },
    { value: 'BIENNIALLY', label: 'Biennially' },
    { value: 'TRIENNIALLY', label: 'Triennially' },
    { value: 'LIFETIME', label: 'Lifetime' }
  ];

  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numPrice);
  };


  const handleInputChange = (field: keyof typeof formData, value: string | boolean | BillingPeriod | SubscriptionStatus) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFeatures = [...formData.features];

    if (field === 'key') {
      // Reset value when key changes
      newFeatures[index] = { featureKey: value, featureValue: '' };
    } else {
      newFeatures[index] = { ...newFeatures[index], featureValue: value };
    }

    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const getFeatureDataType = (featureKey: string): 'boolean' | 'number' | null => {
    if (!features) return null;
    const feature = features.find(f => f.featureKey === featureKey);
    return feature?.dataType || null;
  };

  const getAvailableFeatureKeys = (currentIndex: number): Feature[] => {
    const usedKeys = formData.features
      .map((f, idx) => (idx !== currentIndex ? f.featureKey : null))
      .filter((key): key is string => Boolean(key && key.trim() !== ''));

    return features.filter(feature => !usedKeys.includes(feature.featureKey));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { featureKey: '', featureValue: '' }]
    }));
  };

  const removeFeature = (index: number): void => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        features: newFeatures
      }));
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setFormData({
      id: 0,
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      billingPeriod: 'MONTHLY',
      features: [{ featureKey: '', featureValue: '' }], // Changed
      icon: 'target',
      isPopular: false,
      themeColor: 'blue',
      status: 'ACTIVE'
    });
  };

  const startEditing = (plan: Subscription): void => {
    setEditingPlan(plan.id);
    setFormData({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      discountPrice: plan.discountPrice || '',
      billingPeriod: plan.billingPeriod,
      features: plan.features.map(f => ({ featureKey: f.featureKey, featureValue: f.featureValue })), // Fixed property names
      icon: plan.icon,
      isPopular: plan.isPopular,
      themeColor: plan.themeColor,
      status: plan.status
    });
  };

  const savePlan = async () => {
    const cleanFeatures = formData.features.filter(f => f.featureKey.trim() !== '' && f.featureValue.trim() !== '');

    if (isCreating) {
      try {
        const payload: createSubscriptionRequestDTO = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          discountPrice: formData.discountPrice || null,
          status: formData.status,
          icon: formData.icon,
          themeColor: formData.themeColor,
          isPopular: formData.isPopular,
          billingPeriod: formData.billingPeriod,
          features: cleanFeatures,
        };

        await createSubscriptionAPI(payload);
        showToast('success', 'Plan created successfully', 'bottom-right');
        await fetchSubscriptions();
      } catch (error) {
        showToast('error', 'Failed to create plan', 'bottom-right');
      } finally {
        setIsCreating(false);
      }
    } else if (editingPlan) {
      try {
        const payload: updateSubscriptionRequestDTO = {
          subscriptionId: editingPlan,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          discountPrice: formData.discountPrice || null,
          durationDays: formData.durationDays || null,
          status: formData.status,
          icon: formData.icon,
          themeColor: formData.themeColor,
          isPopular: formData.isPopular,
          billingPeriod: formData.billingPeriod,
          features: cleanFeatures,
        };

        await updateSubscriptionAPI(payload);
        showToast('success', 'Plan updated successfully', 'bottom-right');
        setEditingPlan(null);
        await fetchSubscriptions();
      } catch (error) {
        showToast('error', 'Failed to update plan', 'bottom-right');
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      billingPeriod: 'MONTHLY',
      features: [{ featureKey: '', featureValue: '' }], // Changed
      icon: 'target',
      isPopular: false,
      themeColor: 'blue',
      status: 'ACTIVE'
    });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
    resetForm();
  };

  const deletePlan = async (planId: number): Promise<void> => {
    try {
      await deleteSubscriptionAPI(planId);
      showToast('success', 'Deleted plan successfully', 'bottom-right');
      await fetchSubscriptions();
    } catch (error) {
      showToast('error', 'Failed to delete plan', 'bottom-right');
    }
  };

  const getIcon = (iconName: string): React.ComponentType => {
    return (Icons as any)[iconName] || Icons.Target;
  };
  return (
    <div className="min-h-screen bg-black text-white">
      <Loading isVisible={loading} message="Loading subscriptions...." variant='popup' />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        {/* Header */}
        <div className="space-y-8 pt-8 mb-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="text-white">Subscription </span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Plans</span>
            </h1>
            <p className="text-gray-300 text-lg font-light max-w-3xl">
              Create and manage subscription plans for your platform
            </p>
          </div>

          {/* Add New Plan Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={startCreating}
              disabled={isCreating || !!editingPlan}
              className="group px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 
               rounded-xl font-light text-white transition-all duration-300 shadow-lg shadow-cyan-500/25 
               hover:shadow-cyan-500/40 flex items-center gap-2 hover:scale-105
               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Icons.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Add New Plan
            </button>
          </div>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="mb-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Create New Plan</h2>
            <PlanForm
              formData={formData}
              onInputChange={handleInputChange}
              onFeatureChange={handleFeatureChange}
              onAddFeature={addFeature}
              onRemoveFeature={removeFeature}
              onSave={savePlan}
              onCancel={cancelEdit}
              iconOptions={iconOptions}
              colorOptions={colorOptions}
              billingPeriodOptions={billingPeriodOptions}
              getAvailableFeatureKeys={getAvailableFeatureKeys}
              getFeatureDataType={getFeatureDataType}
              getFeatureLabel={getFeatureLabel}
            />
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((plan) => (
              <div key={plan.id} className="relative">
                {editingPlan === plan.id ? (
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-6 text-white">Edit Plan</h2>
                    <PlanForm
                      formData={formData}
                      onInputChange={handleInputChange}
                      onFeatureChange={handleFeatureChange}
                      onAddFeature={addFeature}
                      onRemoveFeature={removeFeature}
                      onSave={savePlan}
                      onCancel={cancelEdit}
                      iconOptions={iconOptions}
                      colorOptions={colorOptions}
                      billingPeriodOptions={billingPeriodOptions}
                      getAvailableFeatureKeys={getAvailableFeatureKeys}
                      getFeatureDataType={getFeatureDataType}
                      getFeatureLabel={getFeatureLabel}
                    />
                  </div>
                ) : (
                  <PlanCard
                    plan={plan}
                    onEdit={() => startEditing(plan)}
                    onDelete={() => deletePlan(plan.id)}
                    formatPrice={formatPrice}
                    getIcon={getIcon}
                    getFeatureLabel={getFeatureLabel}
                  />
                )}
              </div>
            ))}
        </div>

        {subscriptions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No subscription plans created yet</div>
            <button
              onClick={startCreating}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 
                       rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25
                       flex items-center gap-2 mx-auto"
            >
              <Icons.Plus className="w-5 h-5" />
              Create Your First Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface PlanFormProps {
  formData: Subscription;
  onInputChange: (field: keyof PlanFormProps['formData'], value: string | boolean | BillingPeriod | SubscriptionStatus) => void;
  onFeatureChange: (index: number, field: 'key' | 'value', value: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  iconOptions: { value: string; icon: ComponentType; label: string }[];
  colorOptions: { value: string; label: string; class: string }[];
  billingPeriodOptions: { value: BillingPeriod; label: string }[];
  getAvailableFeatureKeys: (currentIndex: number) => Feature[];
  getFeatureDataType: (featureKey: string) => 'boolean' | 'number' | null;
  getFeatureLabel: (featureKey: string) => string;
}

const PlanForm = ({
  formData,
  onInputChange,
  onFeatureChange,
  onAddFeature,
  onRemoveFeature,
  onSave,
  onCancel,
  iconOptions,
  colorOptions,
  billingPeriodOptions,
  getAvailableFeatureKeys,
  getFeatureDataType,
  getFeatureLabel,
}: PlanFormProps) => {
  const InputField = ({
    label,
    icon: Icon,
    ...props
  }: { label: string; icon?: ComponentType<{ className?: string }> } & InputHTMLAttributes<HTMLInputElement>) => (
    <div className="group">
      <label className="block text-sm font-light text-gray-400 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          onFocus={(e) => { props.onFocus?.(e); }}
          onBlur={(e) => { props.onBlur?.(e); }}
          className={`w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 
            text-white font-light placeholder-gray-500 backdrop-blur-sm
            focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 
            transition-all duration-300
            ${props.type === 'number' ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none' : ''}`}
        />
      </div>
    </div>
  );

  const SelectField = ({
    label,
    icon: Icon,
    children,
    ...props
  }: { label: string; icon?: ComponentType<{ className?: string }>; children?: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="group">
      <label className="block text-sm font-light text-gray-400 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <select
        {...props}
        className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 
          text-white font-light backdrop-blur-sm
          focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 
          transition-all duration-300"
      >
        {children}
      </select>
    </div>
  );

  const renderFeatureInput = (feature: SubscriptionFeature, index: number) => {
    const dataType = getFeatureDataType(feature.featureKey);
    const baseClass = "flex-1 min-w-0 bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-2.5 text-white font-light backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300";

    if (!feature.featureKey) {
      return (
        <input
          type="text"
          disabled
          placeholder="Select feature key first"
          className={`${baseClass} opacity-50 cursor-not-allowed`}
        />
      );
    }

    switch (dataType) {
      case 'boolean':
        return (
          <select
            value={feature.featureValue}
            onChange={(e) => onFeatureChange(index, 'value', e.target.value)}
            className={baseClass}
          >
            <option value="">Select value</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={feature.featureValue}
            onChange={(e) => onFeatureChange(index, 'value', e.target.value)}
            placeholder="Enter number"
            className={`${baseClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={feature.featureValue}
            disabled
            placeholder="Feature value"
            className={`${baseClass} opacity-50`}
          />
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div className="space-y-6">
        <h3 className="text-xl font-light text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-cyan-400" />
          Basic <span className="text-cyan-400">Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Plan Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="e.g., Premium"
          />
          <InputField
            label="Description"
            name="description"
            type="text"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Plan description"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-6">
        <h3 className="text-xl font-light text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-cyan-400" />
          Pricing <span className="text-cyan-400">Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField
            label="Price"
            icon={DollarSign}
            name="price"
            type="number"
            value={formData.price}
            onChange={(e) => onInputChange('price', e.target.value)}
            placeholder="129000"
          />
          <InputField
            label="Discount Price"
            icon={DollarSign}
            name="discountPrice"
            type="number"
            value={formData.discountPrice ?? ''}
            onChange={(e) => onInputChange('discountPrice', e.target.value)}
            placeholder="99000"
          />
          <SelectField
            label="Billing Period"
            icon={Clock}
            value={formData.billingPeriod}
            onChange={(e) => onInputChange('billingPeriod', e.target.value)}
          >
            {billingPeriodOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* Appearance & Status */}
      <div className="space-y-6">
        <h3 className="text-xl font-light text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          Appearance & <span className="text-cyan-400">Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SelectField
            label="Icon"
            icon={Sparkles}
            value={formData.icon}
            onChange={(e) => onInputChange('icon', e.target.value)}
          >
            {iconOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>

          <SelectField
            label="Theme Color"
            icon={Palette}
            value={formData.themeColor}
            onChange={(e) => onInputChange('themeColor', e.target.value)}
          >
            {colorOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>

          <SelectField
            label="Status"
            value={formData.status}
            onChange={(e) => onInputChange('status', e.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISABLED">Disabled</option>
            <option value="DRAFT">Draft</option>
          </SelectField>

          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer px-4 py-3 bg-gray-900/20 border border-gray-800/50 rounded-xl hover:border-cyan-400/50 transition-all duration-300 w-full">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => onInputChange('isPopular', e.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-cyan-400/20 focus:ring-2"
              />
              <span className="text-sm font-light text-gray-400">Popular Plan</span>
            </label>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-6">
        <h3 className="text-xl font-light text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Plan <span className="text-cyan-400">Features</span>
        </h3>

        <div className="space-y-3">
          {formData.features.map((feature, index) => (
            <div
              key={index}
              className="flex gap-3 items-start p-4 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl hover:border-gray-800 transition-all duration-300"
            >
              <select
                value={feature.featureKey}
                onChange={(e) => onFeatureChange(index, 'key', e.target.value)}
                className="flex-1 min-w-0 bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-2.5 text-white font-light backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
              >
                <option value="">Select feature key</option>
                {getAvailableFeatureKeys(index).map(availableFeature => (
                  <option key={availableFeature.featureKey} value={availableFeature.featureKey}>
                    {getFeatureLabel(availableFeature.featureKey)}
                  </option>
                ))}
              </select>

              {renderFeatureInput(feature, index)}

              <button
                onClick={() => onRemoveFeature(index)}
                disabled={formData.features.length === 1}
                className="flex-shrink-0 px-3 py-2.5 bg-red-400/10 hover:bg-red-400/20 rounded-xl border border-red-400/30 hover:border-red-400/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 group"
              >
                <X className="w-4 h-4 text-red-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          ))}

          <button
            onClick={onAddFeature}
            className="w-full px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-800/50 hover:border-cyan-400/50 rounded-xl transition-all duration-300 text-sm font-light flex items-center justify-center gap-2 text-gray-400 hover:text-cyan-400"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-800/50">
        <button
          onClick={onSave}
          className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-light transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center gap-2 hover:scale-105"
        >
          <Save className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          Save Plan
        </button>
        <button
          onClick={onCancel}
          className="group px-8 py-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-800/50 hover:border-gray-700 rounded-xl font-light transition-all duration-300 flex items-center gap-2"
        >
          <X className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
          Cancel
        </button>
      </div>
    </div>
  );
};

interface PlanCardProps {
  plan: Subscription;
  onEdit: () => void;
  onDelete: () => void;
  formatPrice?: (price: string) => string;
  getIcon?: (icon: string) => ComponentType;
  getFeatureLabel?: (featureKey: string) => string;
}

const PlanCard = ({
  plan,
  onEdit,
  onDelete,
  formatPrice,
  getIcon,
  getFeatureLabel,
}: PlanCardProps) => {
  const IconComponent = getIcon ? getIcon(plan.icon) : Zap;

  const getBillingPeriodLabel = (period: BillingPeriod) => {
    const labels: Record<BillingPeriod, string> = {
      MONTHLY: 'month',
      QUARTERLY: 'quarter',
      SEMI_ANNUALLY: '6 months',
      ANNUALLY: 'year',
      BIENNIALLY: '2 years',
      TRIENNIALLY: '3 years',
      LIFETIME: 'LIFETIME'
    };
    return labels[period] || period;
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
      INACTIVE: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
      DISABLED: 'bg-red-400/20 text-red-300 border-red-400/30',
      DEFAULT: 'bg-gray-400/20 text-gray-300 border-gray-400/30'
    };
    return colors[status] || colors.DEFAULT;
  };

  const defaultFormatPrice = (price: string) => {
    const numericPrice = parseFloat(price || '0');
    if (Number.isNaN(numericPrice)) return '$0.00';
    return `$${numericPrice.toFixed(2)}`;
  };

  const priceFormatter = formatPrice || defaultFormatPrice;

  return (
    <div className="group relative bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 
                    hover:border-cyan-400/50 transition-all duration-300 overflow-visible">

      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Popular Badge */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full text-xs font-light text-white shadow-lg shadow-cyan-500/50">
            MOST POPULAR
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-6 left-6 z-10">
        <span className={`px-3 py-1 rounded-full text-xs font-light border ${getStatusColor(plan.status)}`}>
          {plan.status}
        </span>
      </div>

      {/* Admin Controls */}
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
        <button
          onClick={onEdit}
          className="p-2 bg-cyan-400/10 hover:bg-cyan-400/20 rounded-xl transition-all duration-200 border border-cyan-400/20 hover:border-cyan-400/40 group/btn"
        >
          <Edit3 className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-all duration-200 border border-red-400/20 hover:border-red-400/40 group/btn"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        {/* Plan Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 
                       flex items-center justify-center mb-6 mt-8 group-hover:scale-110 transition-transform duration-300 border border-cyan-400/20">
          <IconComponent className="w-7 h-7 text-cyan-400" />
        </div>

        {/* Plan Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-light text-white mb-2 group-hover:text-cyan-400 transition-colors">
            {plan.name}
          </h3>
          <p className="text-gray-400 text-sm font-light leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* Pricing */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2 mb-1">
            {plan.discountPrice && (
              <span className="text-gray-500 line-through text-lg font-light">
                {priceFormatter(plan.price)}
              </span>
            )}
            <span className="text-4xl font-light text-white">
              {priceFormatter(plan.discountPrice || plan.price)}
            </span>
          </div>
          <span className="text-gray-400 font-light text-sm">
            per {getBillingPeriodLabel(plan.billingPeriod)}
          </span>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {plan.features.map((feature, index) => {
            const isEnabled = feature.featureValue !== "false";
            const featureLabel = feature.featureKey
              ? (getFeatureLabel
                  ? getFeatureLabel(feature.featureKey)
                  : toDefaultFeatureLabel(feature.featureKey))
              : '';
            return (
              <div key={feature.featureKey || index} className="flex items-start gap-3 group/feature">
                <div className={`p-1 rounded-lg ${isEnabled ? 'bg-cyan-400/10' : 'bg-gray-800/50'} mt-0.5 flex-shrink-0`}>
                  {isEnabled ? (
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>
                <div className={`flex-1 text-sm leading-relaxed ${isEnabled ? 'text-gray-300' : 'text-gray-500/70'}`}>
                  <div className={`font-light mb-0.5 ${isEnabled ? 'text-white' : 'text-gray-400/60'}`}>
                    {featureLabel || feature.featureKey}
                  </div>
                  {isEnabled && feature.featureValue !== "true" && (
                    <div className="text-gray-400 font-light text-xs">
                      {feature.featureValue}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <button
          className={`w-full px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 
                     hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-light text-white
                     transition-all duration-300 shadow-lg shadow-cyan-500/30
                     hover:shadow-xl hover:shadow-cyan-500/50 hover:scale-[1.02]
                     ${plan.status !== 'ACTIVE' ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-lg' : ''}`}
          disabled={plan.status !== 'ACTIVE'}
        >
          Choose {plan.name}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
