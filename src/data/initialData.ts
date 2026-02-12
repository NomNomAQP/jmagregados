import type { Order, User } from '../types';

export const INITIAL_ORDERS: Order[] = [
    {
        id: '1',
        orderNumber: 'OS-2024-001',
        type: 'SERVICE',
        client: 'MUNICIPALIDAD DISTRITAL DE CERRO COLORADO',
        description: 'ALQUILER DE CAMIÓN CISTERNA PARA RIEGO DE ÁREAS VERDES',
        notificationDate: '2024-02-01',
        startDate: '2024-02-05',
        endDate: '',
        totalAmount: 15000,
        currency: 'PEN',
        status: 'IN_PROGRESS',
        progress: 45,
        items: [
            {
                id: 'i1',
                description: 'ALQUILER DE CAMIÓN CISTERNA 4000 GLS',
                quantity: 200,
                unit: 'HORA',
                unitPrice: 75,
                total: 15000,
                delivered: 90,
                deadlines: [
                    { id: 'd1', deadlineNumber: 1, daysToComplete: 15, quantity: 100, deliveredQuantity: 90, status: 'PENDING' },
                    { id: 'd2', deadlineNumber: 2, daysToComplete: 30, quantity: 100, deliveredQuantity: 0, status: 'PENDING' }
                ]
            }
        ],
        expenses: []
    },
    {
        id: '2',
        orderNumber: 'OC-2024-005',
        type: 'PURCHASE',
        client: 'CONSORCIO VIAL AREQUIPA',
        description: 'SUMINISTRO DE ARENA FINA Y PIEDRA CHANCADA PARA OBRA',
        notificationDate: '2024-02-10',
        startDate: '2024-02-12',
        endDate: '',
        totalAmount: 25000,
        currency: 'PEN',
        status: 'IN_PROGRESS',
        progress: 30,
        items: [
            {
                id: 'i2',
                description: 'ARENA FINA SELECCIONADA',
                quantity: 500,
                unit: 'M3',
                unitPrice: 50,
                total: 25000,
                delivered: 150,
                deadlines: [
                    { id: 'd3', deadlineNumber: 1, daysToComplete: 10, quantity: 250, deliveredQuantity: 150, status: 'PENDING' },
                    { id: 'd4', deadlineNumber: 2, daysToComplete: 20, quantity: 250, deliveredQuantity: 0, status: 'PENDING' }
                ]
            }
        ],
        expenses: []
    }
];

export const INITIAL_USERS: User[] = [
    { id: '1', name: 'Bryan Portilla', role: 'ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bryan' },
    { id: '2', name: 'Juan Operador', role: 'OPERATOR', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan' },
    { id: '3', name: 'Maria Reportes', role: 'REPORTER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' },
];
