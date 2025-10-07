import React from 'react'
import MyPayment from './components/MyPaymentManagement';
import { useAuth } from '@/context/AuthContext';

const PaymentManagement: React.FC = () => {
    const {} = useAuth();

    return (
        <MyPayment />
    );
};

export default PaymentManagement;