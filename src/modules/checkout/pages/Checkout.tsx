import React, { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Check,
  Loader2,
  Globe,
  Lock,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loading } from "@/components/Loading";
import { toast } from "react-hot-toast";
import { checkoutStripeConfirm, checkoutVnpayConfirm, getCheckoutDetailAPI, initiatePaymentAPI } from "../services/checkout";
import {
  SubscriptionSummary,
  TopUpComponent,
} from "../components";
import { ROUTES } from "@/constant/routes";
import type { checkoutDetail, TopUpPlan } from "../types";
import CheckoutHandler from "../components/CheckoutHandler";

interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

type CustomerInfoField = keyof CustomerInfo;

type PaymentMethodId = "VNPAY" | "STRIPE" | "PAYPAL" | "MOMO" | "CREDIT";

interface PaymentMethodOption {
  id: PaymentMethodId;
  name: string;
  image: string;
  description: string;
  available: boolean;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "VNPAY",
    name: "VNPay",
    image: "https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png",
    description: "Vietnamese banks and QR code payments",
    available: true,
  },
  {
    id: "STRIPE",
    name: "International Cards (Stripe)",
    image: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
    description: "Visa, Mastercard, AMEX, and global debit cards",
    available: true,
  },
  {
    id: "MOMO",
    name: "MoMo Wallet",
    image: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png",
    description: "MoMo e-wallet in Vietnam (coming soon)",
    available: false,
  },
];

const CheckoutPage = () => {
  const { id = "" } = useParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId | undefined>(() =>
    PAYMENT_METHODS.find((method) => method.available)?.id,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const [topupDetail, setTopupDetail] = useState<TopUpPlan>({
    amount: 123,
    currency: "VNDX",
  })
  const [checkoutDetail, setCheckoutDetail] = useState<checkoutDetail>({
    checkoutId: "-1",
    checkoutType: "SUBSCRIPTION",
    checkoutStatus: "UNKNOWN",
  })
  const [params] = useSearchParams();
  const selectedMethod = PAYMENT_METHODS.find((method) => method.id === selectedPaymentMethod);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const basePath = `/checkout/${id}`;
      const providerParam = (params.get("provider") ?? params.get("platform") ?? "").toLowerCase();
      const statusParam = params.get("status")?.toLowerCase();
      const stripeSessionId = params.get("session_id");
      const vnpParams: Record<string, string> = {};

      if (stripeSessionId && (providerParam === "" || providerParam === "stripe")) {
        try {
          setIsProcessing(true);
          const response = await checkoutStripeConfirm({ checkoutId: id, sessionId: stripeSessionId });
          if (response?.success) {
            toast.success("Stripe payment confirmed successfully.");
          } else {
            toast.error(response?.message ?? "Unable to confirm Stripe payment.");
          }
        } catch (error) {
          console.error("Failed to confirm Stripe payment:", error);
          toast.error("Failed to confirm Stripe payment.");
        } finally {
          setIsProcessing(false);
          window.history.replaceState(null, "", basePath);
        }
      } else if (stripeSessionId && statusParam === "cancel" && (providerParam === "" || providerParam === "stripe")) {
        toast.error("Stripe payment was cancelled.");
        window.history.replaceState(null, "", basePath);
      }

      for (const [key, value] of params.entries()) {
        if (key.startsWith("vnp_")) {
          vnpParams[key] = value;
        }
      }

      if (Object.keys(vnpParams).length > 0) {
        try {
          await checkoutVnpayConfirm({ checkoutId: id, vnpParams });
          toast.success("VNPay payment confirmed successfully.");
        } catch (error) {
          console.error("Failed to confirm VNPay payment:", error);
          toast.error("Failed to confirm VNPay payment.");
        } finally {
          window.history.replaceState(null, "", basePath);
        }
      }

      try {
        const response = await getCheckoutDetailAPI(id);
        setCheckoutDetail(response);

        if (response.checkoutType === "TOPUP") {
          setTopupDetail({
            amount: response.topupAmount || 0,
            currency: "USD",
          });
        }
      } catch (err) {
        console.error("Failed to fetch checkout detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: CustomerInfoField, value: string) => {
    setCustomerInfo((prev: CustomerInfo) => ({ ...prev, [field]: value }));
  };

  const handleConfirmPayment = async () => {
    if (!isFormValid()) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!selectedPaymentMethod || !selectedMethod?.available) {
      toast.error("Please select an available payment method.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await initiatePaymentAPI({
        checkoutId: id,
        paymentMethod: selectedPaymentMethod,
        customerInfo,
      });

      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Failed to initiate payment:", err);
      toast.error("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    return Boolean(
      customerInfo.fullName &&
      customerInfo.email &&
      customerInfo.phone &&
      customerInfo.address &&
      selectedMethod?.available
    );
  };

  if (isLoading) {
    return (
      <>
        <Loading isVisible={isLoading} variant="fullscreen" />
      </>
    );
  }

  if (checkoutDetail.checkoutStatus !== 'ACTIVE' || checkoutDetail.checkoutId === "-1") {
    return (
      <CheckoutHandler checkoutDetail={checkoutDetail} onGoBack={() => { navigate(ROUTES.HOME.path) }} />
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Dynamic gradient background that follows mouse */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.08), transparent 40%)`
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Header with backdrop blur */}
      <div className="sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light">
              Secure <span className="text-cyan-400">Checkout</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 font-light">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>256-bit encryption</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Customer Info & Payment */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Information */}
            <div className="group relative bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 hover:border-cyan-400/30 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-light text-white">
                    Customer Information
                  </h2>
                </div>
                <p className="text-gray-400 font-light ml-13">
                  Please provide your details below
                </p>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative group/input">
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={customerInfo.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative group/input">
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <div className="relative group/input">
                    <input
                      type="number"
                      placeholder="+84 123 456 789"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Country/Region
                  </label>
                  <div className="relative group/input">
                    <select className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300 appearance-none cursor-pointer">
                      <option value="VN">Vietnam</option>
                      <option value="US">United States</option>
                      <option value="SG">Singapore</option>
                      <option value="TH">Thailand</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Full Address
                  </label>
                  <textarea
                    placeholder="123 Main Street, District 1, Ho Chi Minh City"
                    value={customerInfo.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300 resize-none"
                  />
                </div>
              </div>

              <div className="relative mt-6 flex items-start gap-3 p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-xl">
                <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-light">
                  <span className="text-cyan-400">Your data is protected.</span>
                  <span className="text-gray-400 ml-1">
                    We use enterprise-grade encryption to secure your information.
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="group relative bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 hover:border-cyan-400/30 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-light text-white">
                    Payment Method
                  </h2>
                </div>
                <p className="text-gray-400 font-light ml-13">
                  Select your preferred payment option
                </p>
              </div>

              <div className="relative space-y-3">
                {PAYMENT_METHODS.map((method, index) => {
                  const isSelected = selectedPaymentMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => method.available && setSelectedPaymentMethod(method.id)}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className={`group/method relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                        !method.available
                          ? "opacity-40 cursor-not-allowed bg-gray-800/10 border-gray-800/30"
                          : isSelected
                          ? "bg-cyan-400/10 border-cyan-400/50 shadow-lg shadow-cyan-500/10 cursor-pointer scale-[1.02]"
                          : "bg-gray-800/20 border-gray-800/50 hover:border-gray-700 hover:bg-gray-800/30 cursor-pointer hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex-shrink-0 w-14 h-14 bg-white/95 rounded-xl p-2.5 flex items-center justify-center shadow-sm">
                        <img
                          src={method.image}
                          alt={method.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                            if (img.nextSibling && img.nextSibling instanceof HTMLElement) {
                              (img.nextSibling as HTMLElement).style.display = "flex";
                            }
                          }}
                        />
                        <div className="hidden w-full h-full bg-gray-200 rounded items-center justify-center text-gray-600 text-xs font-medium">
                          {method.name.split(" ")[0]}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-light text-base flex items-center gap-2 text-white">
                          {method.name}
                          {!method.available && (
                            <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full font-light">
                              Soon
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 font-light mt-0.5">{method.description}</div>
                      </div>

                      <div className="flex-shrink-0">
                        {isSelected && method.available ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Check className="w-4 h-4 text-gray-950" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                            !method.available
                              ? "border-gray-700/50"
                              : "border-gray-600 group-hover/method:border-cyan-400/50"
                          }`}></div>
                        )}
                      </div>

                      {isSelected && method.available && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/5 to-transparent pointer-events-none"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="lg:col-span-2">
            {checkoutDetail.checkoutType == "SUBSCRIPTION" ? (
              <SubscriptionSummary
                checkoutDetail={checkoutDetail}
                onConfirmPayment={() => handleConfirmPayment()}
                isFormValid={isFormValid()}
                isProcessing={isProcessing}
              />
            ) : (
              <TopUpComponent
                onConfirmPayment={() => handleConfirmPayment()}
                topUpPlan={topupDetail}
                isFormValid={isFormValid()}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Processing Overlay with modern design */}
      {isProcessing && (
        <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="relative bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm rounded-3xl p-10 max-w-md w-full mx-4 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-3xl" />
            
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <Loader2 className="w-10 h-10 text-white animate-spin" strokeWidth={2} />
              </div>
              
              <h3 className="text-2xl font-light text-white mb-3">
                Processing Payment
              </h3>
              
              <p className="text-gray-400 font-light mb-8 leading-relaxed">
                Securely connecting to payment gateway. Please do not close this window.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-light">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <span>Awaiting confirmation</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
