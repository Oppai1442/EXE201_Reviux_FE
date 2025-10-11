import React from 'react'
import MyPayment from './components/MyPaymentManagement';
import { useAuth } from '@/context/AuthContext';

const TransactionManagement: React.FC = () => {
    const {} = useAuth();

    return (
        <MyPayment />
    );
};

export default TransactionManagement;
