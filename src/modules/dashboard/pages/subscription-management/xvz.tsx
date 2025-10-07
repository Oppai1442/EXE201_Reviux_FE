import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Save, X, Plus, Sparkles, DollarSign, Clock, Palette, Tag, Edit3, Trash2, Check, Target, Crown, Zap, Star } from 'lucide-react';
import { Loading } from '@/components/Loading';
import { createSubscriptionAPI, deleteSubscriptionAPI, getFeaturesAPI, getSubscriptionsAPI, updateSubscriptionAPI } from './services/subscriptionService';
import type {
  BillingPeriod,
  Feature,
  Subscription,
  SubscriptionFeature,
  SubscriptionStatus,
  createSubscriptionRequestDTO,
  updateSubscriptionRequestDTO,
} from './types';
import { showToast } from '@/utils';

type IconOption = {
  value: string;
  icon: LucideIcon;
  label: string;
};

type ColorOption = {
  value: string;
  label: string;
  class: string;
};

const ICON_OPTIONS: IconOption[] = [
  { value: 'target', icon: Target, label: 'Target' },
  { value: 'crown', icon: Crown, label: 'Crown' },
  { value: 'zap', icon: Zap, label: 'Zap' },
  { value: 'star', icon: Star, label: 'Star' },
];

const ICON_MAP: Record<string, LucideIcon> = ICON_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

const COLOR_OPTIONS: ColorOption[] = [
  { value: 'cyan', label: 'Cyan', class: 'from-cyan-600 to-cyan-700' },
  { value: 'blue', label: 'Blue', class: 'from-blue-600 to-blue-700' },
  { value: 'purple', label: 'Purple', class: 'from-purple-600 to-purple-700' },
];

const BILLING_PERIOD_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUALLY', label: 'Semi-annually' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'BIENNIALLY', label: 'Biennially' },
  { value: 'TRIENNIALLY', label: 'Triennially' },
  { value: 'LIFETIME', label: 'Lifetime' },
];

const EMPTY_FEATURE: SubscriptionFeature = { featureKey: '', featureValue: '' };

const createDefaultFormData = (): Subscription => ({
  id: 0,
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  durationDays: null,
  maxUsage: null,
  status: 'ACTIVE',
  icon: ICON_OPTIONS[0]?.value ?? 'target',
  themeColor: COLOR_OPTIONS[0]?.value ?? 'cyan',
  isPopular: false,
  billingPeriod: 'MONTHLY',
  features: [{ ...EMPTY_FEATURE }],
});

const normalizePrice = (price: string | null | undefined): string => {
  if (price === null || price === undefined || price === '') {
    return '$0.00';
  }

  const numeric = Number(price);
  if (Number.isNaN(numeric)) {
    return price.toString();
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

const getIconComponent = (iconName: string): LucideIcon => ICON_MAP[iconName] ?? Target;

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Subscription>(createDefaultFormData());

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptionResponse, featureResponse] = await Promise.all([
        getSubscriptionsAPI(),
        getFeaturesAPI(),
      ]);

      setSubscriptions(subscriptionResponse ?? []);
      setFeatures(featureResponse ?? []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      showToast('error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubscriptions();
  }, [fetchSubscriptions]);

  const getFeatureDataType = useCallback(
    (featureKey: string) => features.find(feature => feature.featureKey === featureKey)?.dataType ?? null,
    [features],
  );

  const getAvailableFeatureKeys = useCallback(
    (currentIndex: number) => {
      const currentKey = formData.features[currentIndex]?.featureKey;
      const usedKeys = new Set(
        formData.features
          .map((feature, index) => (index === currentIndex ? null : feature.featureKey))
          .filter((key): key is string => Boolean(key?.trim())),
      );

      return features.filter(feature => feature.featureKey === currentKey || !usedKeys.has(feature.featureKey));
    },
    [features, formData.features],
  );

  const handleInputChange = <K extends keyof Subscription>(field: K, value: Subscription[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureChange = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => {
      const updated = [...prev.features];

      if (field === 'key') {
        const dataType = getFeatureDataType(value);
        let defaultValue = '';

        if (dataType === 'boolean') {
          defaultValue = 'true';
        }

        updated[index] = { featureKey: value, featureValue: defaultValue };
      } else {
        updated[index] = { ...updated[index], featureValue: value };
      }

      return {
        ...prev,
        features: updated,
      };
    });
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { ...EMPTY_FEATURE }],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => {
      if (prev.features.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        features: prev.features.filter((_, featureIndex) => featureIndex !== index),
      };
    });
  };

  const startCreating = () => {
    setEditingPlan(null);
    setIsCreating(true);
    setFormData(createDefaultFormData());
  };

  const startEditing = (plan: Subscription) => {
    setIsCreating(false);
    setEditingPlan(plan.id);
    setFormData({
      ...plan,
      discountPrice: plan.discountPrice ?? '',
      features: plan.features.length ? plan.features.map(feature => ({ ...feature })) : [{ ...EMPTY_FEATURE }],
    });
  };

  const resetForm = () => {
    setFormData(createDefaultFormData());
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
    resetForm();
  };

  const normalizeFeaturesForSubmit = (): SubscriptionFeature[] => {
    const normalized: SubscriptionFeature[] = [];

    for (const feature of formData.features) {
      if (!feature.featureKey.trim()) {
        continue;
      }

      const dataType = getFeatureDataType(feature.featureKey);
      const rawValue = feature.featureValue ?? '';
      const trimmedValue = rawValue.toString().trim();

      if (dataType === 'number') {
        if (trimmedValue === '') {
          showToast('warning', `Feature "${feature.featureKey}" requires a numeric value`);
          return [];
        }
        if (Number.isNaN(Number(trimmedValue))) {
          showToast('warning', `Feature "${feature.featureKey}" must be a number`);
          return [];
        }
        normalized.push({ featureKey: feature.featureKey, featureValue: trimmedValue });
      } else if (dataType === 'boolean') {
        const value = trimmedValue === 'false' ? 'false' : 'true';
        normalized.push({ featureKey: feature.featureKey, featureValue: value });
      } else {
        if (trimmedValue === '') {
          showToast('warning', `Feature "${feature.featureKey}" requires a value`);
          return [];
        }
        normalized.push({ featureKey: feature.featureKey, featureValue: trimmedValue });
      }
    }

    return normalized;
  };

  const buildCreatePayload = (normalizedFeatures: SubscriptionFeature[]): createSubscriptionRequestDTO => ({
    name: formData.name.trim(),
    description: formData.description.trim(),
    price: formData.price.toString(),
    discountPrice: formData.discountPrice ? formData.discountPrice.toString() : null,
    status: formData.status,
    icon: formData.icon,
    themeColor: formData.themeColor,
    isPopular: formData.isPopular,
    billingPeriod: formData.billingPeriod,
    features: normalizedFeatures,
  });

  const buildUpdatePayload = (normalizedFeatures: SubscriptionFeature[]): updateSubscriptionRequestDTO => ({
    subscriptionId: formData.id,
    name: formData.name.trim(),
    description: formData.description.trim(),
    price: formData.price.toString(),
    discountPrice: formData.discountPrice ? formData.discountPrice.toString() : null,
    status: formData.status,
    icon: formData.icon,
    themeColor: formData.themeColor,
    isPopular: formData.isPopular,
    billingPeriod: formData.billingPeriod,
    features: normalizedFeatures,
  });

  const validatePlan = () => {
    if (!formData.name.trim()) {
      showToast('warning', 'Plan name is required');
      return false;
    }

    if (!formData.price.toString().trim()) {
      showToast('warning', 'Plan price is required');
      return false;
    }

    return true;
  };

  const savePlan = async () => {
    if (!validatePlan()) {
      return;
    }

    const normalizedFeatures = normalizeFeaturesForSubmit();
    if (!normalizedFeatures.length) {
      return;
    }

    try {
      if (isCreating) {
        await createSubscriptionAPI(buildCreatePayload(normalizedFeatures));
        showToast('success', 'Subscription created successfully');
      } else if (editingPlan !== null) {
        await updateSubscriptionAPI(buildUpdatePayload(normalizedFeatures));
        showToast('success', 'Subscription updated successfully');
      }

      cancelEdit();
      await fetchSubscriptions();
    } catch (error) {
      console.error('Failed to save subscription:', error);
      showToast('error', 'Failed to save subscription');
    }
  };

  const deletePlan = async (planId: number) => {
    try {
      await deleteSubscriptionAPI(planId);
      showToast('success', 'Subscription deleted');

      if (editingPlan === planId) {
        cancelEdit();
      }

      await fetchSubscriptions();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      showToast('error', 'Failed to delete subscription');
    }
  };

  const sortedSubscriptions = useMemo(
    () => subscriptions.slice().sort((a, b) => a.id - b.id),
    [subscriptions],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <Loading />
      </div>
    );
  }

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
            disabled={isCreating || editingPlan !== null}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 \
                     rounded-xl font-light transition-all duration-300 shadow-lg shadow-cyan-500/30\
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
              iconOptions={ICON_OPTIONS}
              colorOptions={COLOR_OPTIONS}
              billingPeriodOptions={BILLING_PERIOD_OPTIONS}
              getAvailableFeatureKeys={getAvailableFeatureKeys}
              getFeatureDataType={getFeatureDataType}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSubscriptions.map(plan => (
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
                    iconOptions={ICON_OPTIONS}
                    colorOptions={COLOR_OPTIONS}
                    billingPeriodOptions={BILLING_PERIOD_OPTIONS}
                    getAvailableFeatureKeys={getAvailableFeatureKeys}
                    getFeatureDataType={getFeatureDataType}
                  />
                </div>
              ) : (
                <PlanCard
                  plan={plan}
                  onEdit={() => startEditing(plan)}
                  onDelete={() => deletePlan(plan.id)}
                  formatPrice={normalizePrice}
                  getIcon={getIconComponent}
                />
              )}
            </div>
          ))}
        </div>

        {sortedSubscriptions.length === 0 && !isCreating && (
          <div className="text-center py-20">
            <div className="text-gray-400 font-light text-lg mb-6">No subscription plans yet</div>
            <button
              onClick={startCreating}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 \
                       rounded-xl font-light transition-all duration-300 shadow-lg shadow-cyan-500/30\
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

type PlanFormProps = {
  formData: Subscription;
  onInputChange: <K extends keyof Subscription>(field: K, value: Subscription[K]) => void;
  onFeatureChange: (index: number, field: 'key' | 'value', value: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  iconOptions: IconOption[];
  colorOptions: ColorOption[];
  billingPeriodOptions: { value: BillingPeriod; label: string }[];
  getAvailableFeatureKeys: (currentIndex: number) => Feature[];
  getFeatureDataType: (featureKey: string) => Feature['dataType'] | null;
};

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
}: PlanFormProps) => {
  const InputField = ({ label, icon: Icon, ...props }: { label: string; icon?: LucideIcon } & InputHTMLAttributes<HTMLInputElement>) => (
    <div className="group">
      <label className="block text-sm font-light text-gray-400 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 text-white font-light placeholder-gray-500 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 ${
            props.type === 'number'
              ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
              : ''
          }`}
        />
      </div>
    </div>
  );

  const SelectField = ({
    label,
    icon: Icon,
    children,
    ...props
  }: {
    label: string;
    icon?: LucideIcon;
    children: ReactNode;
  } & SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="group">
      <label className="block text-sm font-light text-gray-400 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <select
        {...props}
        className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 text-white font-light backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
      >
        {children}
      </select>
    </div>
  );

  const renderFeatureInput = (feature: SubscriptionFeature, index: number) => {
    const dataType = getFeatureDataType(feature.featureKey);
    const baseClass =
      'flex-1 min-w-0 bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-2.5 text-white font-light backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300';

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

    if (dataType === 'boolean') {
      return (
        <select
          value={feature.featureValue}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onFeatureChange(index, 'value', event.target.value)}
          className={baseClass}
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      );
    }

    if (dataType === 'number') {
      return (
        <input
          type="number"
          value={feature.featureValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onFeatureChange(index, 'value', event.target.value)}
          placeholder="Enter number"
          className={`${baseClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
      );
    }

    return (
      <input
        type="text"
        value={feature.featureValue}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onFeatureChange(index, 'value', event.target.value)}
        placeholder="Feature value"
        className={baseClass}
      />
    );
  };

  return (
    <div className="space-y-8">
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
            onChange={event => onInputChange('name', event.target.value)}
            placeholder="e.g., Premium"
          />
          <InputField
            label="Description"
            name="description"
            type="text"
            value={formData.description}
            onChange={event => onInputChange('description', event.target.value)}
            placeholder="Plan description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField
            label="Price"
            icon={DollarSign}
            name="price"
            type="number"
            value={formData.price}
            onChange={event => onInputChange('price', event.target.value)}
            placeholder="199000"
          />
          <InputField
            label="Discount Price"
            icon={DollarSign}
            name="discountPrice"
            type="number"
            value={formData.discountPrice ?? ''}
            onChange={event => onInputChange('discountPrice', event.target.value)}
            placeholder="99000"
          />
          <SelectField
            label="Billing Period"
            icon={Clock}
            value={formData.billingPeriod}
            onChange={event => onInputChange('billingPeriod', event.target.value as BillingPeriod)}
          >
            {billingPeriodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

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
            onChange={event => onInputChange('icon', event.target.value)}
          >
            {iconOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Theme Color"
            icon={Palette}
            value={formData.themeColor}
            onChange={event => onInputChange('themeColor', event.target.value)}
          >
            {colorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Status"
            value={formData.status}
            onChange={event => onInputChange('status', event.target.value as SubscriptionStatus)}
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
                onChange={event => onInputChange('isPopular', event.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-cyan-400/20 focus:ring-2"
              />
              <span className="text-sm font-light text-gray-400">Popular Plan</span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-light text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Features
        </h3>

        <div className="space-y-3">
          {formData.features.map((feature, index) => (
            <div
              key={`${feature.featureKey}-${index}`}
              className="flex gap-3 items-start p-4 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl hover:border-gray-800 transition-all duration-300"
            >
              <select
                value={feature.featureKey}
                onChange={event => onFeatureChange(index, 'key', event.target.value)}
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

type PlanCardProps = {
  plan: Subscription;
  onEdit: () => void;
  onDelete: () => void;
  formatPrice: (price: string | null | undefined) => string;
  getIcon: (iconName: string) => LucideIcon;
};

const PlanCard = ({ plan, onEdit, onDelete, formatPrice, getIcon }: PlanCardProps) => {
  const IconComponent = getIcon(plan.icon);

  const getBillingPeriodLabel = (period: BillingPeriod) => {
    const labels: Record<BillingPeriod, string> = {
      MONTHLY: 'month',
      QUARTERLY: 'quarter',
      SEMI_ANNUALLY: '6 months',
      ANNUALLY: 'year',
      BIENNIALLY: '2 years',
      TRIENNIALLY: '3 years',
      LIFETIME: 'lifetime',
    };
    return labels[period] ?? period;
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    const colors: Record<SubscriptionStatus, string> = {
      ACTIVE: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
      INACTIVE: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
      DISABLED: 'bg-red-400/20 text-red-300 border-red-400/30',
      DRAFT: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
    };
    return colors[status] ?? colors.ACTIVE;
  };

  return (
    <div className="group relative bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 \
                    hover:border-cyan-400/50 transition-all duration-300 overflow-visible">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full text-xs font-light text-white shadow-lg shadow-cyan-500/50">
            MOST POPULAR
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-10">
        <span className={`px-3 py-1 rounded-full text-xs font-light border ${getStatusColor(plan.status)}`}>
          {plan.status}
        </span>
      </div>

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

      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 \
                       flex items-center justify-center mb-6 mt-8 group-hover:scale-110 transition-transform duration-300 border border-cyan-400/20">
          <IconComponent className="w-7 h-7 text-cyan-400" />
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-light text-white mb-2 group-hover:text-cyan-400 transition-colors">
            {plan.name}
          </h3>
          <p className="text-gray-400 text-sm font-light leading-relaxed">{plan.description}</p>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-2 mb-1">
            {plan.discountPrice && (
              <span className="text-gray-500 line-through text-lg font-light">{formatPrice(plan.price)}</span>
            )}
            <span className="text-4xl font-light text-white">{formatPrice(plan.discountPrice || plan.price)}</span>
          </div>
          <span className="text-gray-400 font-light text-sm">per {getBillingPeriodLabel(plan.billingPeriod)}</span>
        </div>

        <div className="space-y-3 mb-8">
          {plan.features.map((feature, index) => {
            const isEnabled = feature.featureValue !== 'false';
            return (
              <div key={`${feature.featureKey}-${index}`} className="flex items-start gap-3 group/feature">
                <div className={`p-1 rounded-lg ${isEnabled ? 'bg-cyan-400/10' : 'bg-gray-800/50'} mt-0.5 flex-shrink-0`}>
                  {isEnabled ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <X className="w-3.5 h-3.5 text-gray-500" />}
                </div>
                <div className={`flex-1 text-sm leading-relaxed ${isEnabled ? 'text-gray-300' : 'text-gray-500/70'}`}>
                  <div className={`font-light mb-0.5 ${isEnabled ? 'text-white' : 'text-gray-400/60'}`}>{feature.featureKey}</div>
                  {isEnabled && feature.featureValue !== 'true' && (
                    <div className="text-gray-400 font-light text-xs">{feature.featureValue}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          className={`w-full px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 \
                     hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-light text-white\
                     transition-all duration-300 shadow-lg shadow-cyan-500/30\
                     hover:shadow-xl hover:shadow-cyan-500/50 hover:scale-[1.02]\
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
