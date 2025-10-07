import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Check,
  Loader2,
  Globe,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loading } from "@/components/Loading";
import { checkoutVnpayConfirm, getCheckoutDetailAPI, initiatePaymentAPI } from "../services/checkout";
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

const CheckoutPage = () => {
  const { id = "" } = useParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchData = async () => {
      // 1. Check vnpay param
      const vnpParams: Record<string, string> = {};

      for (const [key, value] of params.entries()) {
        if (key.startsWith("vnp_")) {
          vnpParams[key] = value;
        }
      }

      const hasVnpParam = Object.keys(vnpParams).length > 0;
      if (hasVnpParam) {
        try {
          await checkoutVnpayConfirm({ checkoutId: id, vnpParams: vnpParams });

        } catch (err) { }
        console.log("✅ vnpParams:", vnpParams);
      }

      // 2. Fetch thông tin checkout
      try {
        const response = await getCheckoutDetailAPI(id);
        setCheckoutDetail(response)

        if (response.checkoutType === "TOPUP") {
          setTopupDetail({
            amount: response.topupAmount || 0,
            currency: "USD"
          });
        }
      } catch (err: any) {

      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  const paymentMethods = [
    {
      id: "vnpay",
      name: "VNPay",
      image:
        "https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png",
      available: true,
    },
    {
      id: "paypal",
      name: "PayPal",
      image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
      available: false,
    },
    {
      id: "momo",
      name: "MoMo Wallet",
      image: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png",
      available: false,
    },
    {
      id: "credit",
      name: "Credit Card",
      image: "https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg",
      available: false,
    },
  ];

  const handleInputChange = (field: CustomerInfoField, value: string) => {
    setCustomerInfo((prev: CustomerInfo) => ({ ...prev, [field]: value }));
  };

  const handleConfirmPayment = async () => {
    if (!isFormValid()) return;
    setIsProcessing(true);

    try {
      const response = await initiatePaymentAPI({
        checkoutId: id,
        paymentMethod: selectedPaymentMethod,
        customerInfo,
      });

      // Có thể redirect nếu là thanh toán qua web
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
      // Ngược lại: chờ xác nhận từ WS ở dưới
    } catch (err) {
      setIsProcessing(false);
      console.error("Failed to initiate payment:", err);
    }
  };


  const isFormValid = () => {
    return Boolean(
      customerInfo.fullName &&
      customerInfo.email &&
      customerInfo.phone &&
      customerInfo.address &&
      (!!selectedPaymentMethod)
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Checkout
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Customer Info & Payment */}
          <div className="space-y-8">
            {/* Customer Information */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Customer Information
                </h2>
                <p className="text-gray-400">
                  Please fill in your details to complete the order
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    Full Name *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-200" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={customerInfo.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    Email Address *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-200" />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    Phone Number *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-200" />
                    </div>
                    <input
                      type="number"
                      placeholder="Enter your phone number"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    Country/Region
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="w-5 h-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-200" />
                    </div>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 appearance-none">
                      <option value="VN">Vietnam</option>
                      <option value="US">United States</option>
                      <option value="SG">Singapore</option>
                      <option value="TH">Thailand</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium text-gray-300 block">
                  Address *
                </label>
                <div className="relative group">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-200" />
                  </div>
                  <textarea
                    placeholder="Enter your full address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-blue-400 font-medium">
                    Your information is secure.
                  </span>
                  <span className="text-blue-300/70 ml-1">
                    We use industry-standard encryption to protect your data.
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Payment Method
                </h2>
                <p className="text-gray-400">
                  Choose your preferred payment option
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => method.available && setSelectedPaymentMethod(method.id)}
                    className={`group relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${!method.available
                      ? "opacity-50 cursor-not-allowed bg-gray-800/20 border-gray-700/50"
                      : selectedPaymentMethod === method.id
                        ? "bg-red-500/10 border-red-500/50 text-white shadow-lg shadow-red-500/10 cursor-pointer"
                        : "bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800/50 cursor-pointer"
                      }`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center">
                      <img
                        src={method.image}
                        alt={method.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                          if (
                            img.nextSibling &&
                            img.nextSibling instanceof HTMLElement
                          ) {
                            (img.nextSibling as HTMLElement).style.display = "flex";
                          }
                        }}
                      />
                      <div className="hidden w-full h-full bg-gray-200 rounded items-center justify-center text-gray-600 text-xs font-medium">
                        {method.name.split(" ")[0]}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {method.name}
                        {!method.available && (
                          <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {method.id === "paypal" &&
                          "Pay securely with your PayPal account"}
                        {method.id === "momo" && "Mobile wallet payment"}
                        {method.id === "vnpay" && "Vietnamese payment gateway"}
                        {method.id === "credit" && "Visa, Mastercard, and more"}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {selectedPaymentMethod === method.id && method.available ? (
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className={`w-6 h-6 rounded-full border-2 transition-colors duration-200 ${!method.available
                          ? "border-gray-700"
                          : "border-gray-600 group-hover:border-gray-500"
                          }`}></div>
                      )}
                    </div>

                    {selectedPaymentMethod === method.id && method.available && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/5 to-red-700/5 pointer-events-none"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Product Details */}
          {checkoutDetail.checkoutType == "SUBSCRIPTION" ? (
            <SubscriptionSummary
              checkoutDetail={checkoutDetail}
              onConfirmPayment={() => handleConfirmPayment()}
              isFormValid={isFormValid()}
              isProcessing={false}
            />
          ) : (
            // <></>
            <TopUpComponent onConfirmPayment={() => handleConfirmPayment()}
              topUpPlan={topupDetail} 
              isFormValid={isFormValid()}/>
          )}
        </div>
      </div>

      {/* Processing Popup */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Processing Payment
            </h3>
            <p className="text-gray-400 mb-6">
              Please wait while we securely process your payment. This may take
              a few moments.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Globe className="w-4 h-4" />
              Waiting for payment confirmation...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
