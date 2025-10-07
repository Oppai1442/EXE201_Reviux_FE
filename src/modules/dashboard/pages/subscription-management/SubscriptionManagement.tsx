import { useCallback, useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { Loading } from '@/components/Loading';
import { createSubscriptionAPI, deleteSubscriptionAPI, getFeaturesAPI, getSubscriptionsAPI, updateSubscriptionAPI } from './services/subscriptionService';
import type { BillingPeriod, createSubscriptionRequestDTO, Feature, Subscription, SubscriptionFeature, SubscriptionStatus, updateSubscriptionRequestDTO } from './types';
import { showToast } from '@/utils';
import { useTranslation } from "react-i18next";
import { Save, X, Plus, Sparkles, DollarSign, Clock, Palette, Tag, Edit3, Trash2, Check, Target, Crown, Zap, Star } from 'lucide-react';


// Type definitions based on your interface
const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    billingPeriod: 'MONTHLY',
    features: [{ featureKey: '', featureValue: '' }],
    icon: 'target',
    isPopular: false,
    themeColor: 'cyan',
    status: 'ACTIVE'
  });

  const iconOptions = [
    { value: 'target', icon: Target, label: 'Target' },
    { value: 'crown', icon: Crown, label: 'Crown' },
    { value: 'zap', icon: Zap, label: 'Zap' },
    { value: 'star', icon: Star, label: 'Star' }
  ];

  const colorOptions = [
    { value: 'cyan', label: 'Cyan', class: 'from-cyan-600 to-cyan-700' },
    { value: 'blue', label: 'Blue', class: 'from-blue-600 to-blue-700' },
    { value: 'purple', label: 'Purple', class: 'from-purple-600 to-purple-700' }
  ];

  const billingPeriodOptions = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'ANNUALLY', label: 'Annually' },
    { value: 'LIFETIME', label: 'Lifetime' }
  ];

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const getIcon = (iconName) => {
    const iconMap = { target: Target, crown: Crown, zap: Zap, star: Star };
    return iconMap[iconName] || Target;
  };

  const getColorClass = () => 'from-cyan-500 to-cyan-600';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (index, field, value) => {
    const newFeatures = [...formData.features];
    if (field === 'key') {
      newFeatures[index] = { featureKey: value, featureValue: '' };
    } else {
      newFeatures[index] = { ...newFeatures[index], featureValue: value };
    }
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { featureKey: '', featureValue: '' }]
    }));
  };

  const removeFeature = (index) => {
    if (formData.features.length > 1) {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
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
      features: [{ featureKey: '', featureValue: '' }],
      icon: 'target',
      isPopular: false,
      themeColor: 'cyan',
      status: 'ACTIVE'
    });
  };

  const startEditing = (plan) => {
    setEditingPlan(plan.id);
    setFormData({ ...plan });
  };

  const savePlan = () => {
    const cleanFeatures = formData.features.filter(f => f.featureKey.trim() && f.featureValue.trim());
    
    if (isCreating) {
      const newPlan = { ...formData, id: Date.now(), features: cleanFeatures };
      setSubscriptions(prev => [...prev, newPlan]);
      setIsCreating(false);
    } else {
      setSubscriptions(prev => prev.map(plan =>
        plan.id === editingPlan ? { ...formData, features: cleanFeatures } : plan
      ));
      setEditingPlan(null);
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
      features: [{ featureKey: '', featureValue: '' }],
      icon: 'target',
      isPopular: false,
      themeColor: 'cyan',
      status: 'ACTIVE'
    });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
    resetForm();
  };

  const deletePlan = (planId) => {
    setSubscriptions(prev => prev.filter(plan => plan.id !== planId));
  };

  // Demo data
  useEffect(() => {
    setSubscriptions([
      {
        id: 1,
        name: 'Starter',
        description: 'Perfect for individuals',
        price: '9.99',
        discountPrice: null,
        billingPeriod: 'MONTHLY',
        status: 'ACTIVE',
        isPopular: false,
        icon: 'target',
        themeColor: 'cyan',
        features: [
          { featureKey: 'Users', featureValue: '5 users' },
          { featureKey: 'Storage', featureValue: '10 GB' }
        ]
      },
      {
        id: 2,
        name: 'Professional',
        description: 'For growing teams',
        price: '29.99',
        discountPrice: '24.99',
        billingPeriod: 'MONTHLY',
        status: 'ACTIVE',
        isPopular: true,
        icon: 'crown',
        themeColor: 'cyan',
        features: [
          { featureKey: 'Users', featureValue: '25 users' },
          { featureKey: 'Storage', featureValue: '100 GB' }
        ]
      }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light mb-4">
            Subscription <span className="text-cyan-400">Management</span>
          </h1>
          <p className="text-gray-400 font-light text-lg">
            Create and manage subscription plans for your platform
          </p>
        </div>

        <div className="mb-8">
          <button
            onClick={startCreating}
            disabled={isCreating || !!editingPlan}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 
                     rounded-xl font-light transition-all duration-300 shadow-lg shadow-cyan-500/30
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add New Plan
          </button>
        </div>

        {isCreating && (
          <div className="mb-8 bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-xl font-light mb-6 text-white">Create New Plan</h2>
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
              getAvailableFeatureKeys={() => []}
              getFeatureDataType={() => null}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((plan) => (
            <div key={plan.id}>
              {editingPlan === plan.id ? (
                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
                  <h2 className="text-xl font-light mb-6 text-white">Edit Plan</h2>
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
                    getAvailableFeatureKeys={() => []}
                    getFeatureDataType={() => null}
                  />
                </div>
              ) : (
                <PlanCard
                  plan={plan}
                  onEdit={() => startEditing(plan)}
                  onDelete={() => deletePlan(plan.id)}
                  formatPrice={formatPrice}
                  getIcon={getIcon}
                  getColorClass={getColorClass}
                />
              )}
            </div>
          ))}
        </div>

        {subscriptions.length === 0 && !isCreating && (
          <div className="text-center py-20">
            <div className="text-gray-400 font-light text-lg mb-6">No subscription plans yet</div>
            <button
              onClick={startCreating}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 
                       rounded-xl font-light transition-all duration-300 shadow-lg shadow-cyan-500/30
                       flex items-center gap-2 mx-auto hover:scale-105"
            >
              <Plus className="w-5 h-5" />
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
  iconOptions: { value: string; icon: React.ComponentType; label: string }[];
  colorOptions: { value: string; label: string; class: string }[];
  billingPeriodOptions: { value: BillingPeriod; label: string }[];
  getAvailableFeatureKeys: (currentIndex: number) => Feature[];
  getFeatureDataType: (featureKey: string) => 'boolean' | 'number' | null;
}

const PlanForm: React.FC<PlanFormProps> = ({
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
  getFeatureDataType
}) => {
  const [focusedField, setFocusedField] = useState(null);

  const InputField = ({ label, icon: Icon, ...props }) => (
    <div className="group">
      <label className="block text-sm font-light text-gray-400 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          onFocus={(e) => { setFocusedField(props.name); props.onFocus?.(e); }}
          onBlur={(e) => { setFocusedField(null); props.onBlur?.(e); }}
          className={`w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 
            text-white font-light placeholder-gray-500 backdrop-blur-sm
            focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 
            transition-all duration-300
            ${props.type === 'number' ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none' : ''}`}
        />
      </div>
    </div>
  );

  const SelectField = ({ label, icon: Icon, children, ...props }) => (
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

  const renderFeatureInput = (feature, index) => {
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
                    {availableFeature.featureKey}
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

const PlanCard = ({
  plan,
  onEdit,
  onDelete,
  formatPrice,
  getIcon,
  getColorClass
}) => {
  const IconComponent = getIcon ? getIcon(plan.icon) : Zap;

  const getBillingPeriodLabel = (period) => {
    const labels = {
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

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
      INACTIVE: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
      DISABLED: 'bg-red-400/20 text-red-300 border-red-400/30',
      DEFAULT: 'bg-gray-400/20 text-gray-300 border-gray-400/30'
    };
    return colors[status] || colors.DEFAULT;
  };

  const defaultFormatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
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
                    {feature.featureKey}
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
