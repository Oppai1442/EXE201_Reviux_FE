import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { generateCheckoutAPI, getMiniSubscription } from "../services/PricingService";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constant/routes";
import { showToast } from "@/utils";
import type { SubscriptionMini } from "../types/model";

type FaqItem = {
    q: string;
    a: string;
};

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const { t } = useTranslation();
    const { user, showAuthModal } = useAuth();
    const navigate = useNavigate();

    const [pricingPlans, setPricingPlans] = useState<SubscriptionMini[]>();

    useEffect(() => {
        const fetchMiniSubscription = async () => {
            const response = await getMiniSubscription();
            setPricingPlans(response)
        };
        fetchMiniSubscription();
    }, [])

    const processCheckout = async (planId: number) => {
        try {
            const response = await generateCheckoutAPI({
                planId,
                isAnnual
            });
            navigate(ROUTES.CHECKOUT.getPath(response.sessionId))
        } catch (err) {
            showToast("error", "Checkout failed")
        }
    }

    const onBuy = (planId: number) => {
        if (!user) {
            showAuthModal('signIn');
        } else {
            processCheckout(planId);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="py-20 px-6 bg-gradient-to-b from-gray-900 to-black">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 pb-4 bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent">
                        {t("pricing.header.title")}
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed mb-12">
                        {t("pricing.header.subtitle")}
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 bg-gray-800/50 p-2 rounded-full max-w-xs mx-auto">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${!isAnnual ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t("pricing.toggle.monthly")}
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${isAnnual ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t("pricing.toggle.annual")}
                            <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                                {t("pricing.toggle.discount")}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
                        {pricingPlans && pricingPlans
                            ?.filter(plan => plan.name.toLowerCase() !== "free")
                            .map((plan, index) => (
                                <div key={index} className={`relative bg-gray-800/50 backdrop-blur-sm rounded-3xl border transition-all duration-300 hover:transform hover:scale-105 
    ${plan.isPopular ? 'border-red-500 shadow-2xl shadow-red-500/20' :
                                        // plan.isEnterprise ? 'border-yellow-500/50 shadow-2xl shadow-yellow-500/10' : 
                                        'border-gray-700 hover:border-gray-600'}`}>
                                    {plan.isPopular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                {t("pricing.plan.popular")}
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-8">
                                        <div className="text-center mb-8">
                                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                            <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                                            <div className="mb-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    {plan.price && (
                                                        <>
                                                            {isAnnual ? (
                                                                <>
                                                                    <span className="text-gray-500 line-through text-lg">
                                                                        ${(plan.price * 12).toLocaleString()}
                                                                    </span>
                                                                    <span className="text-4xl font-bold text-white">
                                                                        ${((plan.price * 12) * 0.75).toLocaleString()}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-4xl font-bold text-white">
                                                                    ${plan.price.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Minimal modern features list */}
                                        <div className="space-y-3 mb-8">
                                            {plan.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-3 group">
                                                    <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-2.5 transition-all duration-200 ${plan.isPopular ? 'bg-red-500 group-hover:bg-red-400' : 'bg-gray-500 group-hover:bg-gray-400'
                                                        }`} />

                                                    <div className="flex-1 min-w-0 flex items-baseline justify-between gap-3">
                                                        <span className="text-gray-300 text-sm leading-relaxed break-words flex-1">
                                                            {t(`subscription.features.${feature.featureKey}`)}
                                                        </span>

                                                        {feature.featureValue && (
                                                            <div className={`px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0 border transition-all duration-200 ${plan.isPopular
                                                                    ? 'bg-red-500/10 text-red-300 border-red-500/20 group-hover:bg-red-500/15'
                                                                    : 'bg-gray-500/10 text-gray-300 border-gray-500/20 group-hover:bg-gray-500/15'
                                                                }`}>
                                                                {feature.featureValue}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => onBuy(plan.id)}
                                            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${plan.isPopular ?
                                                'bg-red-600 hover:bg-red-700 text-white shadow-lg' :
                                                'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'}`}>
                                            {t("pricing.plan.button_start")}
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-20 px-6 bg-gray-900/50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent">
                        {t("pricing.faq.title")}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {(t("pricing.faq.items", { returnObjects: true }) as FaqItem[]).map((faq, index) => (
                            <div key={index} className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700">
                                <h3 className="text-lg font-semibold mb-3 text-red-400">{faq.q}</h3>
                                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 pb-4 bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent">
                        {t("pricing.bottom_cta.title")}
                    </h2>
                    <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                        {t("pricing.bottom_cta.subtitle")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                            {t("pricing.bottom_cta.button_try")}
                        </button>
                        <button className="border-2 border-gray-600 text-gray-300 hover:border-white hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300">
                            {t("pricing.bottom_cta.button_demo")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
