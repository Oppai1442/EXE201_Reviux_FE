import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, X, Star, Zap, Shield, Rocket, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils';
import { ROUTES } from '@/constant/routes';
import { generateCheckoutAPI, getMiniSubscription } from '../services/PricingService';
import type { SubscriptionMini, feature as SubscriptionFeature } from '../types/model';

type NormalizedPlan = {
  id: number;
  name: string;
  description: string;
  icon: ReactNode;
  price: {
    monthly: number;
    yearly: number;
  };
  originalPrice: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limitations: string[];
  popular: boolean;
  color: string;
};

const resolveIcon = (iconName?: string): ReactNode => {
  const normalized = iconName?.toLowerCase() ?? '';

  switch (normalized) {
    case 'shield':
      return <Shield className="w-8 h-8" />;
    case 'rocket':
      return <Rocket className="w-8 h-8" />;
    case 'star':
      return <Star className="w-8 h-8" />;
    default:
      return <Zap className="w-8 h-8" />;
  }
};

const PlansPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [rawPlans, setRawPlans] = useState<SubscriptionMini[]>([]);
  const [checkoutProcessingId, setCheckoutProcessingId] = useState<number | null>(null);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { t } = useTranslation();
  const { loggedIn, showAuthModal } = useAuth();
  const navigate = useNavigate();

  // Intersection observer for animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setVisibleElements((prev) => {
              if (prev.has(entry.target.id)) {
                return prev;
              }
              const next = new Set(prev);
              next.add(entry.target.id);
              return next;
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await getMiniSubscription();
        setRawPlans(response ?? []);
      } catch (error) {
        console.error('Failed to load subscription plans', error);
        showToast('error', 'Failed to load pricing plans');
      }
    };

    fetchPlans();
  }, []);

  const plans = useMemo<NormalizedPlan[]>(() => {
    if (!rawPlans || rawPlans.length === 0) {
      return [];
    }

    const formatFeatureLabel = (item: SubscriptionFeature) => {
      const translationKey = `subscription.features.${item.featureKey}`;
      const translation = t(translationKey);
      const fallbackLabel = (item.featureKey ?? '').replace(/_/g, ' ').trim();
      const label = translation !== translationKey ? translation : fallbackLabel;
      const value = item.featureValue?.toString().trim() ?? '';

      if (!label && value) {
        return value;
      }

      if (!label) {
        return '';
      }

      return value ? `${label}: ${value}` : label;
    };

    return rawPlans
      .filter((plan) => plan?.name?.toLowerCase() !== 'free')
      .map((plan) => {
        const basePrice = Number(plan?.price ?? 0);
        const discountPrice =
          plan?.discountPrice !== undefined && plan?.discountPrice !== null
            ? Number(plan.discountPrice)
            : 0;

        const monthlyPrice = Number(basePrice.toFixed(2));
        const monthlyOriginalPrice = monthlyPrice;

        const yearlyOriginalPrice = Number((monthlyPrice * 12).toFixed(2));
        const yearlyDiscountPrice =
          discountPrice > monthlyPrice
            ? Number(discountPrice.toFixed(2))
            : Number((yearlyOriginalPrice * 0.75).toFixed(2));

        const yearlyPrice = yearlyDiscountPrice > 0 ? yearlyDiscountPrice : yearlyOriginalPrice;

        const formattedFeatures = (plan?.features ?? [])
          .map(formatFeatureLabel)
          .filter((featureText) => featureText);

        return {
          id: plan?.id ?? 0,
          name: plan?.name ?? '',
          description: plan?.description ?? '',
          icon: resolveIcon(plan?.icon),
          price: {
            monthly: monthlyPrice,
            yearly: yearlyPrice,
          },
          originalPrice: {
            monthly: monthlyOriginalPrice,
            yearly: yearlyOriginalPrice,
          },
          features: formattedFeatures,
          limitations: [],
          popular: Boolean(plan?.isPopular),
          color: plan?.themeColor ?? 'gray',
        };
      });
  }, [rawPlans, t]);

  useEffect(() => {
    if (!observerRef.current) {
      return;
    }

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((element) => observerRef.current?.observe(element));

    return () => {
      elements.forEach((element) => observerRef.current?.unobserve(element));
    };
  }, [plans]);

  const processCheckout = async (planId: number) => {
    try {
      setCheckoutProcessingId(planId);
      const response = await generateCheckoutAPI({
        planId,
        isAnnual: isYearly,
      });

      if (response?.sessionId) {
        navigate(ROUTES.CHECKOUT.getPath(response.sessionId));
        return;
      }

      showToast('error', 'Unable to initiate checkout session');
    } catch (error) {
      console.error('Failed to generate checkout session', error);
      showToast('error', 'Checkout failed');
    } finally {
      setCheckoutProcessingId(null);
    }
  };

  const handleSelectPlan = (planId: number) => {
    if (!planId) {
      showToast('error', 'Invalid plan selected');
      return;
    }

    if (!loggedIn) {
      showAuthModal('signIn');
      return;
    }

    void processCheckout(planId);
  };

  const additionalFeatures = [
    {
      category: 'Testing Capabilities',
      items: [
        { name: 'Automated Testing', starter: true, professional: true, enterprise: true },
        { name: 'Manual Testing', starter: true, professional: true, enterprise: true },
        { name: 'API Testing', starter: true, professional: true, enterprise: true },
        { name: 'Load Testing', starter: false, professional: true, enterprise: true },
        { name: 'Security Testing', starter: false, professional: true, enterprise: true },
        { name: 'Performance Testing', starter: false, professional: true, enterprise: true },
        { name: 'Cross-browser Testing', starter: false, professional: true, enterprise: true },
        { name: 'Mobile App Testing', starter: true, professional: true, enterprise: true }
      ]
    },
    {
      category: 'Reporting & Analytics',
      items: [
        { name: 'Basic Reports', starter: true, professional: true, enterprise: true },
        { name: 'Advanced Analytics', starter: false, professional: true, enterprise: true },
        { name: 'Custom Dashboards', starter: false, professional: true, enterprise: true },
        { name: 'White-label Reports', starter: false, professional: false, enterprise: true },
        { name: 'Real-time Monitoring', starter: false, professional: true, enterprise: true },
        { name: 'Export to PDF/Excel', starter: false, professional: true, enterprise: true }
      ]
    },
    {
      category: 'Support & Integration',
      items: [
        { name: 'Email Support', starter: true, professional: true, enterprise: true },
        { name: 'Priority Support', starter: false, professional: true, enterprise: true },
        { name: 'Phone Support', starter: false, professional: false, enterprise: true },
        { name: 'Dedicated Account Manager', starter: false, professional: false, enterprise: true },
        { name: 'API Integration', starter: true, professional: true, enterprise: true },
        { name: 'Custom Integrations', starter: false, professional: true, enterprise: true },
        { name: 'SSO Integration', starter: false, professional: false, enterprise: true }
      ]
    }
  ];

  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 20}s`
          }}
        />
      ))}
    </div>
  );

  const PricingCard = ({
    plan,
    index,
    onSelectPlan,
    processing,
  }: {
    plan: NormalizedPlan;
    index: number;
    onSelectPlan: (planId: number) => void;
    processing: boolean;
  }) => {
    const isVisible = visibleElements.has(`plan-${plan.id}`);
    const price = isYearly ? plan.price.yearly : plan.price.monthly;
    const originalPrice = isYearly ? plan.originalPrice.yearly : plan.originalPrice.monthly;
    const savings = Math.max(0, originalPrice - price);
    const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

    const formatCurrency = (value: number) => {
      const hasDecimals = Math.abs(value % 1) > 0;
      return value.toLocaleString(undefined, {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
      });
    };

    return (
      <div
        id={`plan-${plan.id}`}
        data-animate
        className={`relative group transition-all duration-500 transform-gpu hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        {plan.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-black px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="w-4 h-4" />
              Most Popular
            </div>
          </div>
        )}

        <div className={`relative h-full bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 transform-gpu ${plan.popular
            ? 'border-cyan-400/50 hover:border-cyan-400 shadow-2xl shadow-cyan-400/10'
            : 'border-gray-800/50 hover:border-gray-700'
          } hover:shadow-2xl`}>

          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 to-gray-800/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${plan.popular ? 'bg-cyan-400/10 text-cyan-400' : 'bg-gray-800 text-gray-400'
                }`}>
                {plan.icon}
              </div>
              <h3 className="text-2xl font-light mb-2">{plan.name}</h3>
              <p className="text-gray-400 text-sm">{plan.description}</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="mb-2">
                <span className="text-4xl font-light">${formatCurrency(price)}</span>
                <span className="text-gray-400 ml-2">/{isYearly ? 'year' : 'month'}</span>
              </div>
              {savings > 0 && savingsPercent > 0 && (
                <div className="text-sm text-gray-400">
                  <span className="line-through">${formatCurrency(originalPrice)}</span>
                  <span className="text-green-400 ml-2">Save {savingsPercent}%</span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="mb-8">
              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-cyan-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, i) => (
                  <div key={i} className="flex items-center gap-3 opacity-50">
                    <div className="flex-shrink-0 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="text-gray-500 text-sm">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => onSelectPlan(plan.id)}
              disabled={processing}
              className={`w-full py-4 rounded-xl font-medium transition-all duration-300 transform-gpu ${plan.popular
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-black hover:from-cyan-300 hover:to-cyan-500 hover:scale-105'
                  : 'bg-gray-800 text-white hover:bg-gray-700 hover:scale-105'
                } flex items-center justify-center gap-2 group`}>
              {processing ? 'Processing...' : 'Get Started'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">

      {/* Main Content */}
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Scale your testing capabilities with our flexible pricing options.
              Start small and grow with confidence.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`transition-colors ${!isYearly ? 'text-white' : 'text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-8 rounded-full transition-colors ${isYearly ? 'bg-cyan-400' : 'bg-gray-700'
                  }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${isYearly ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
              <span className={`transition-colors ${isYearly ? 'text-white' : 'text-gray-400'}`}>
                Yearly
              </span>
              {isYearly && (
                <span className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full text-sm">
                  Save 20%
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans
              .slice() // tránh mutate mảng gốc
              .sort((a, b) => a.features.length - b.features.length) // hoặc a.id - b.id, tùy field
              .map((plan, index) => (
                <PricingCard
                  key={plan.id ?? index}
                  plan={plan}
                  index={index}
                  onSelectPlan={handleSelectPlan}
                  processing={checkoutProcessingId === plan.id}
                />
              ))}

          </div>
        </section>

        {/* Feature Comparison */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light mb-4">
              Detailed Feature <span className="text-cyan-400">Comparison</span>
            </h2>
            <p className="text-gray-300">
              Compare all features across our plans to find the perfect fit
            </p>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
            {additionalFeatures.map((category, categoryIndex) => (
              <div key={category.category} className="border-b border-gray-800/50 last:border-b-0">
                <div className="bg-gray-800/30 px-6 py-4">
                  <h3 className="text-lg font-medium text-cyan-400">{category.category}</h3>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="text-gray-300">{item.name}</div>
                        <div className="text-center">
                          {item.starter ? (
                            <Check className="w-5 h-5 text-cyan-400 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-500 mx-auto" />
                          )}
                        </div>
                        <div className="text-center">
                          {item.professional ? (
                            <Check className="w-5 h-5 text-cyan-400 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-500 mx-auto" />
                          )}
                        </div>
                        <div className="text-center">
                          {item.enterprise ? (
                            <Check className="w-5 h-5 text-cyan-400 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-500 mx-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light mb-4">
              Frequently Asked <span className="text-cyan-400">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Can I change my plan at any time?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
              },
              {
                question: "Is there a free trial available?",
                answer: "We offer a 14-day free trial for all plans. No credit card required to get started."
              },
              {
                question: "What happens if I exceed my plan limits?",
                answer: "We'll notify you when you're approaching your limits. You can either upgrade your plan or purchase additional capacity as needed."
              },
              {
                question: "Do you offer custom enterprise solutions?",
                answer: "Yes, we provide custom solutions for large enterprises with specific requirements. Contact our sales team for more information."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-medium text-gray-200">{faq.question}</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-300 mt-4">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-cyan-400/10 to-cyan-600/10 rounded-2xl p-12 border border-cyan-400/20">
            <h2 className="text-3xl font-light mb-4">
              Ready to Get <span className="text-cyan-400">Started?</span>
            </h2>
            <p className="text-gray-300 mb-8">
              Join thousands of teams who trust Reviux for their testing needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-black px-8 py-4 rounded-xl font-medium hover:from-cyan-300 hover:to-cyan-500 transition-all hover:scale-105">
                Start Free Trial
              </button>
              <button className="border border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-medium hover:border-gray-500 hover:text-white transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlansPage;
