export type TransactionStaus = 
'ALL' | 'ACTIVE' | 'CANCELED' | 'COMPLETED' | 'FAILED'

export interface Transaction {
    id: string,
    type: string,
    sourceType: string,
    description: string,
    amount: number
    createdAt: string,
    checkoutId: string,
    paymentMethod: string,
    status: TransactionStaus,
} 