export type UserRole = 'ADMIN' | 'OPERATOR' | 'REPORTER' | 'CLIENT' | 'EXTERNAL';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    avatar?: string;
    username?: string;
    password?: string;
    assignedOrderIds?: string[]; // IDs de órdenes que el usuario externo puede visualizar
}

export interface OrderDeadline {
    id: string;
    deadlineNumber: number;
    daysToComplete: number;
    quantity: number;
    deliveredQuantity: number;
    status: 'PENDING' | 'COMPLETED';
}

export interface OrderItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    delivered: number;
    deadlines: OrderDeadline[];
}

export interface Order {
    id: string;
    orderNumber: string; // Nro de orden
    type: 'SERVICE' | 'PURCHASE';
    description: string;
    client: string; // Entidad solicitante
    notificationDate?: string; // Fecha de notificación
    startDate: string;
    endDate: string;
    totalAmount: number;
    currency: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number; // 0-100
    items: OrderItem[];
    expenses: Expense[];
}

export interface Voucher {
    id: string;
    orderId: string;
    itemId: string;
    date: string;
    quantity: number;
    voucherNo: string;
    type: 'SERVICE' | 'PURCHASE';
    reportedBy: string;
    photoUrl?: string;
    activity?: string;
    startMeter?: number;
    endMeter?: number;
}

export interface Expense {
    id: string;
    orderId: string;
    description: string;
    amount: number;
    date: string;
    category: 'FUEL' | 'MAINTENANCE' | 'LABOR' | 'FOOD' | 'OTHER';
    reportedBy: string;
}

export interface ServiceReport {
    id: string;
    orderId: string;
    date: string;
    operatorId: string;
    startHourMeter: number;
    endHourMeter: number;
    activity: string;
    voucherPhoto: string;
}

export interface PurchaseReport {
    id: string;
    orderId: string;
    date: string;
    reporterId: string;
    material: string;
    quantity: number;
    unit: string;
    voucherPhoto: string;
}
