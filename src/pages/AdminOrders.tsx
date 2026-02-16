import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, MoreVertical, FileText,
    TrendingUp, Trash2, Hash, Edit3,
    Clock, Building2, Package, Save, Eye,
    ArrowLeft, CheckCircle2, AlertCircle, Calendar,
    ClipboardList, ShoppingCart, X, Activity, Cloud, RefreshCw
} from 'lucide-react';
import type { Order, OrderItem, Voucher } from '../types';
import { getLimaDate, parseLimaDateString } from '../utils/dateUtils';
import { INITIAL_ORDERS } from '../data/initialData';
import { supabase } from '../utils/supabase';

const AdminOrders = () => {
    const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);
    const [itemFilter, setItemFilter] = useState<string>('all');
    const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

    // List State
    const [orders, setOrders] = useState<Order[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('ADMIN');
    const [assignedOrderIds, setAssignedOrderIds] = useState<string[]>([]);

    // Form State
    const [orderNumber, setOrderNumber] = useState('');
    const [orderType, setOrderType] = useState<'SERVICE' | 'PURCHASE'>('SERVICE');
    const [client, setClient] = useState('');
    const [description, setDescription] = useState('');
    const [notificationDate, setNotificationDate] = useState(getLimaDate());
    const [items, setItems] = useState<OrderItem[]>([
        { id: '1', description: '', quantity: 0, unit: 'm3', unitPrice: 0, total: 0, delivered: 0, deadlines: [{ id: 'd1', deadlineNumber: 1, daysToComplete: 0, quantity: 0, deliveredQuantity: 0, status: 'PENDING' }] }
    ]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const syncAppData = async () => {
            setIsSyncing(true);

            // 1. Cargar Usuario y Roles Primero
            const loggedUserStr = localStorage.getItem('antigravity_logged_user');
            let currentRole = 'ADMIN';
            let assignedIds: string[] = [];

            if (loggedUserStr) {
                const loggedUser = JSON.parse(loggedUserStr);
                currentRole = loggedUser.role;
                assignedIds = loggedUser.assignedOrderIds || [];

                // Intentar refrescar perfil desde Supabase
                if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                    try {
                        const { data: dbUser } = await supabase.from('users').select('*')
                            .eq(loggedUser.id ? 'id' : 'name', loggedUser.id || loggedUser.name)
                            .single();
                        if (dbUser) {
                            currentRole = dbUser.role;
                            assignedIds = dbUser.assignedOrderIds || [];
                            setCurrentUserRole(dbUser.role);
                            setAssignedOrderIds(dbUser.assignedOrderIds || []);
                            localStorage.setItem('antigravity_logged_user', JSON.stringify(dbUser));
                            localStorage.setItem('antigravity_user_role', dbUser.role);
                        }
                    } catch (e) { console.error("Profile refresh error", e); }
                } else {
                    setCurrentUserRole(currentRole);
                    setAssignedOrderIds(assignedIds);
                }
            }

            // 2. Cargar datos locales (Inmediato para mejor UX)
            const savedOrders = localStorage.getItem('antigravity_orders');
            const savedVouchers = localStorage.getItem('antigravity_vouchers');
            const savedExpenses = localStorage.getItem('antigravity_expenses');

            if (savedOrders) setOrders(JSON.parse(savedOrders));
            if (savedVouchers) setVouchers(JSON.parse(savedVouchers));
            if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

            // 3. Sincronizar con Nube
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                try {
                    // Helper para mapear snake_case a camelCase si es necesario
                    const mapData = (data: any[]) => {
                        return data.map(item => {
                            const newItem = { ...item };
                            // Mapeo común de vouchers
                            if (item.order_id && !item.orderId) newItem.orderId = item.order_id;
                            if (item.item_id && !item.itemId) newItem.itemId = item.item_id;
                            if (item.voucher_no && !item.voucherNo) newItem.voucherNo = item.voucher_no;
                            if (item.reported_by && !item.reportedBy) newItem.reportedBy = item.reported_by;
                            if (item.photo_url && !item.photoUrl) newItem.photoUrl = item.photo_url;
                            if (item.start_meter && !item.startMeter) newItem.startMeter = item.start_meter;
                            if (item.end_meter && !item.endMeter) newItem.endMeter = item.end_meter;

                            // Mapeo común de órdenes
                            if (item.order_number && !item.orderNumber) newItem.orderNumber = item.order_number;
                            if (item.notification_date && !item.notificationDate) newItem.notificationDate = item.notification_date;
                            if (item.order_type && !item.type) newItem.type = item.order_type;

                            return newItem;
                        });
                    };

                    // Órdenes
                    const { data: dbOrders } = await supabase.from('orders').select('*');
                    if (dbOrders && dbOrders.length > 0) {
                        const mappedOrders = mapData(dbOrders);
                        setOrders(mappedOrders);
                        localStorage.setItem('antigravity_orders', JSON.stringify(mappedOrders));
                    }

                    // Vouchers (Sincronización robusta)
                    const { data: dbVouchers } = await supabase.from('vouchers').select('*');
                    if (dbVouchers) {
                        const mappedVouchers = mapData(dbVouchers);
                        if (mappedVouchers.length > 0) {
                            setVouchers(mappedVouchers);
                            localStorage.setItem('antigravity_vouchers', JSON.stringify(mappedVouchers));
                        } else {
                            const localVouchers = localStorage.getItem('antigravity_vouchers');
                            if (localVouchers) setVouchers(JSON.parse(localVouchers));
                        }
                    }

                    // Gastos
                    const { data: dbExpenses } = await supabase.from('expenses').select('*');
                    if (dbExpenses && dbExpenses.length > 0) {
                        const mappedExpenses = mapData(dbExpenses);
                        setExpenses(mappedExpenses);
                        localStorage.setItem('antigravity_expenses', JSON.stringify(mappedExpenses));
                    }
                } catch (err) {
                    console.error("Cloud Sync Error:", err);
                }
            } else if (!savedOrders) {
                setOrders(INITIAL_ORDERS);
                localStorage.setItem('antigravity_orders', JSON.stringify(INITIAL_ORDERS));
            }

            setIsSyncing(false);
        };

        syncAppData();
    }, []);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now().toString(), description: '', quantity: 0, unit: 'm3', unitPrice: 0, total: 0, delivered: 0, deadlines: [{ id: 'd' + Date.now().toString(), deadlineNumber: 1, daysToComplete: 0, quantity: 0, deliveredQuantity: 0, status: 'PENDING' }] }]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id: string, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleAddDeadline = (itemId: string) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    deadlines: [...item.deadlines, {
                        id: Date.now().toString(),
                        deadlineNumber: item.deadlines.length + 1,
                        daysToComplete: 0,
                        quantity: 0,
                        deliveredQuantity: 0,
                        status: 'PENDING'
                    }]
                };
            }
            return item;
        }));
    };

    const handleRemoveDeadline = (itemId: string, deadlineId: string) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    deadlines: item.deadlines.filter(d => d.id !== deadlineId)
                        .map((d, index) => ({ ...d, deadlineNumber: index + 1 }))
                };
            }
            return item;
        }));
    };

    const handleDeadlineChange = (itemId: string, deadlineId: string, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    deadlines: item.deadlines.map(d => d.id === deadlineId ? { ...d, [field]: value } : d)
                };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return (items || []).reduce((sum, item) => sum + (item.total || 0), 0);
    };

    const handleSaveOrder = async () => {
        if (!orderNumber || !client) {
            alert('Por favor complete el Nro de Orden y la Entidad Solicitante');
            return;
        }

        let updatedOrders: Order[];
        let finalOrder: Order;

        if (editingOrderId) {
            updatedOrders = orders.map(o => {
                if (o.id === editingOrderId) {
                    finalOrder = {
                        ...o,
                        orderNumber,
                        type: orderType,
                        client,
                        description,
                        notificationDate,
                        totalAmount: calculateTotal(),
                        items
                    };
                    return finalOrder;
                }
                return o;
            });
            alert('Orden actualizada exitosamente');
        } else {
            finalOrder = {
                id: Date.now().toString(),
                orderNumber,
                type: orderType,
                client,
                description,
                notificationDate,
                startDate: getLimaDate(),
                endDate: '',
                totalAmount: calculateTotal(),
                currency: 'PEN',
                status: 'IN_PROGRESS',
                progress: 0,
                items,
                expenses: []
            };
            updatedOrders = [...orders, finalOrder];
            alert('Orden creada exitosamente');
        }

        // Persistir en Local
        setOrders(updatedOrders);
        localStorage.setItem('antigravity_orders', JSON.stringify(updatedOrders));

        // Persistir en Supabase
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
            try {
                const { error } = await supabase.from('orders').upsert(finalOrder!);
                if (error) console.error("Cloud Save Error:", error);
            } catch (err) {
                console.error("Cloud Exception:", err);
            }
        }

        // Reset
        setEditingOrderId(null);
        setOrderNumber(''); setClient(''); setDescription(''); setNotificationDate(getLimaDate());
        setItems([{ id: '1', description: '', quantity: 0, unit: 'm3', unitPrice: 0, total: 0, delivered: 0, deadlines: [{ id: 'd1', deadlineNumber: 1, daysToComplete: 0, quantity: 0, deliveredQuantity: 0, status: 'PENDING' }] }]);
        setView('LIST');
    };

    const handleEdit = (order: Order) => {
        setEditingOrderId(order.id);
        setOrderNumber(order.orderNumber);
        setOrderType(order.type);
        setClient(order.client);
        setDescription(order.description);
        setNotificationDate(order.notificationDate || '');
        setItems(order.items || []);
        setView('CREATE');
        setActiveMenuId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar esta orden? Todos los datos asociados se perderán.')) {
            // Borrar en Supabase
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                try {
                    await supabase.from('orders').delete().eq('id', id);
                } catch (err) {
                    console.error("Cloud Delete Error:", err);
                }
            }

            const updatedOrders = orders.filter(o => o.id !== id);
            setOrders(updatedOrders);
            localStorage.setItem('antigravity_orders', JSON.stringify(updatedOrders));
            setActiveMenuId(null);
        }
    };

    const handleDeleteVoucher = (voucherId: string) => {
        if (confirm('¿Está seguro de eliminar este vale?')) {
            const updatedVouchers = vouchers.filter(v => v.id !== voucherId);
            setVouchers(updatedVouchers);
            localStorage.setItem('antigravity_vouchers', JSON.stringify(updatedVouchers));
        }
    };

    const handleUpdateVoucher = () => {
        if (!editingVoucher) return;
        const updatedVouchers = vouchers.map(v => v.id === editingVoucher.id ? editingVoucher : v);
        setVouchers(updatedVouchers);
        localStorage.setItem('antigravity_vouchers', JSON.stringify(updatedVouchers));
        setEditingVoucher(null);
    };

    const handleToggleSelectVoucher = (id: string) => {
        setSelectedVoucherIds(prev =>
            prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
        );
    };

    const handleSelectAllVouchers = (ids: string[]) => {
        if (selectedVoucherIds.length === ids.length) {
            setSelectedVoucherIds([]);
        } else {
            setSelectedVoucherIds(ids);
        }
    };

    const handleDeleteSelectedVouchers = () => {
        if (confirm(`¿Está seguro de eliminar los ${selectedVoucherIds.length} vales seleccionados?`)) {
            const updatedVouchers = vouchers.filter(v => !selectedVoucherIds.includes(v.id));
            setVouchers(updatedVouchers);
            localStorage.setItem('antigravity_vouchers', JSON.stringify(updatedVouchers));
            setSelectedVoucherIds([]);
        }
    };

    const handleVisualize = (order: Order) => {
        setSelectedOrder(order);
        setView('DETAIL');
        setActiveMenuId(null);
        fetchVouchersForOrder(order.id); // Carga forzada al entrar al detalle
    };

    const handleToggleStatus = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        const newStatus: Order['status'] = order.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
        const updatedOrders = orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o);
        setOrders(updatedOrders);
        localStorage.setItem('antigravity_orders', JSON.stringify(updatedOrders));
    };

    const fetchVouchersForOrder = async (orderId: string) => {
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return;

        try {
            const { data: dbVouchers } = await supabase
                .from('vouchers')
                .select('*')
                .eq('orderId', orderId);

            if (dbVouchers && dbVouchers.length > 0) {
                setVouchers(prev => {
                    const otherVouchers = prev.filter(v => v.orderId !== orderId);
                    const merged = [...otherVouchers, ...dbVouchers];
                    localStorage.setItem('antigravity_vouchers', JSON.stringify(merged));
                    return merged;
                });
            }
        } catch (err) {
            console.error("Error fetching vouchers for order:", err);
        }
    };

    const forceSyncToCloud = async () => {
        if (currentUserRole !== 'ADMIN') {
            alert("Solo el administrador puede sincronizar datos con la nube.");
            return;
        }

        setIsSyncing(true);
        try {
            // 1. Sincronizar Órdenes (Limpieza estricta de campos)
            if (orders.length > 0) {
                const cleanOrders = orders.map(o => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    type: o.type,
                    description: o.description,
                    client: o.client,
                    notificationDate: o.notificationDate,
                    startDate: o.startDate,
                    endDate: o.endDate,
                    totalAmount: o.totalAmount,
                    status: o.status,
                    progress: o.progress,
                    items: o.items // Los items se guardan como JSONB en Supabase
                }));
                const { error: errO } = await supabase.from('orders').upsert(cleanOrders);
                if (errO) throw errO;
            }

            // 2. Sincronizar Vales (Limpieza estricta de campos)
            if (vouchers.length > 0) {
                const cleanVouchers = vouchers.map(v => ({
                    id: v.id,
                    orderId: v.orderId,
                    itemId: v.itemId,
                    date: v.date,
                    quantity: v.quantity,
                    voucherNo: v.voucherNo,
                    type: v.type,
                    reportedBy: v.reportedBy,
                    photoUrl: v.photoUrl,
                    activity: v.activity,
                    startMeter: v.startMeter,
                    endMeter: v.endMeter
                }));
                const { error: errV } = await supabase.from('vouchers').upsert(cleanVouchers);
                if (errV) throw errV;
            }

            alert("¡Sincronización Exitosa! Los datos se han subido correctamente. El usuario externo ya puede ver el avance actualizado.");
        } catch (err: any) {
            console.error("Error detallado de sincronización:", err);
            const detail = err.message || err.details || String(err);
            alert("Error al sincronizar: " + detail + "\n\nTip: Verifica que las columnas coincidan en Supabase.");
        } finally {
            setIsSyncing(false);
        }
    };

    const toggleExpandOrder = (orderId: string) => {
        setExpandedOrderIds(prev => {
            const isExpanding = !prev.includes(orderId);
            if (isExpanding) {
                fetchVouchersForOrder(orderId);
            }
            return isExpanding ? [...prev, orderId] : prev.filter(id => id !== orderId);
        });
    };

    // --------------------------------------------------------------------------
    // RENDER: ORDER DETAIL VIEW
    // --------------------------------------------------------------------------
    if (view === 'DETAIL' && selectedOrder) {
        const orderVouchers = vouchers
            .filter(v => v.orderId === selectedOrder.id)
            .filter(v => itemFilter === 'all' || v.itemId === itemFilter)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
            <div className="space-y-8 pb-12 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('LIST')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Detalle de {selectedOrder.orderNumber}</h1>
                            <p className="text-slate-500 font-medium">{selectedOrder.client}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentUserRole !== 'EXTERNAL' && (
                            <button
                                onClick={() => handleEdit(selectedOrder)}
                                className="btn-secondary flex items-center gap-2 border-slate-200"
                            >
                                <Edit3 size={16} />
                                Editar
                            </button>
                        )}
                        <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${selectedOrder.type === 'SERVICE' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {selectedOrder.type === 'SERVICE' ? 'SERVICIO' : 'COMPRA'}
                        </div>
                    </div>
                </div>

                {/* Item Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {selectedOrder.items.map(item => {
                        const itemVouchers = orderVouchers.filter(v => v.itemId === item.id);
                        const totalDelivered = itemVouchers.reduce((sum, v) => sum + v.quantity, 0);
                        const progress = Math.min((totalDelivered / item.quantity) * 100, 100);

                        return (
                            <div key={item.id} className="premium-card p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary border border-slate-100">
                                        <Package size={20} />
                                    </div>
                                    <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                                        {progress.toFixed(1)}%
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material / Item</p>
                                    <p className="text-sm font-bold text-slate-800 truncate">{item.description}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-500">Progreso: {totalDelivered} {item.unit}</span>
                                        <span className="text-slate-400">Total: {item.quantity} {item.unit}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="col-span-1 lg:col-span-8 space-y-8">
                        {/* Description & Plazos */}
                        <div className="premium-card p-8 space-y-8">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                                <TrendingUp size={18} className="text-primary" />
                                Estructura de Plazos por Ítem
                            </h3>

                            <div className="space-y-8">
                                {selectedOrder.items.map(item => {
                                    const itemVouchers = orderVouchers.filter(v => v.itemId === item.id);
                                    const totalDelivered = itemVouchers.reduce((sum, v) => sum + v.quantity, 0);
                                    let cumulativeGoal = 0;
                                    let cumulativeDays = 0;

                                    return (
                                        <div key={item.id} className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                                    <h4 className="font-bold text-slate-700 text-sm">{item.description}</h4>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                    TOTAL REPORTADO: {totalDelivered} / {item.quantity} {item.unit}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {item.deadlines.map((d) => {
                                                    const prevGoal = cumulativeGoal;
                                                    cumulativeGoal += d.quantity;
                                                    cumulativeDays += d.daysToComplete;

                                                    const isCompleted = totalDelivered >= cumulativeGoal;
                                                    const isInProgress = totalDelivered > prevGoal && totalDelivered < cumulativeGoal;

                                                    return (
                                                        <div
                                                            key={d.id}
                                                            className={`p-4 rounded-2xl border transition-all duration-300 ${isCompleted
                                                                ? 'bg-green-50 border-green-200 shadow-sm shadow-green-100'
                                                                : isInProgress
                                                                    ? 'bg-amber-50 border-amber-200 shadow-sm shadow-amber-100'
                                                                    : 'bg-slate-50 border-slate-100 grayscale-[0.5] opacity-70'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-green-600' : isInProgress ? 'text-amber-600' : 'text-slate-400'
                                                                    }`}>
                                                                    Plazo {d.deadlineNumber}
                                                                </span>
                                                                {isCompleted ? (
                                                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                                                                        <CheckCircle2 size={14} />
                                                                    </div>
                                                                ) : isInProgress ? (
                                                                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white animate-pulse">
                                                                        <Clock size={12} />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-300 border border-slate-200">
                                                                        <Hash size={12} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className={`text-sm font-black ${isCompleted ? 'text-green-800' : 'text-slate-800'}`}>
                                                                    {d.quantity} {item.unit}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-slate-500">
                                                                    {isCompleted ? 'Meta cumplida' : isInProgress ? 'En cumplimiento...' : 'Por entregar'}
                                                                </p>
                                                                {(selectedOrder.notificationDate || selectedOrder.startDate) && (
                                                                    <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-slate-400">
                                                                        <Calendar size={10} />
                                                                        <span>VENCE: {(() => {
                                                                            const baseDateStr = selectedOrder.notificationDate || selectedOrder.startDate;
                                                                            if (!baseDateStr) return '---';
                                                                            const date = parseLimaDateString(baseDateStr);
                                                                            // Se calcula sumando los días calendario a la fecha base
                                                                            date.setDate(date.getDate() + cumulativeDays);
                                                                            return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                        })()}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {isInProgress && (
                                                                <div className="mt-3 h-1 bg-amber-200/50 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-amber-500"
                                                                        style={{ width: `${((totalDelivered - prevGoal) / d.quantity) * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Vouchers Table */}
                        <div className="premium-card p-8 space-y-6">
                            <h3 className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-50 pb-4">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    Vales y Reportes de Campo
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Filter size={14} className="text-slate-400" />
                                        <select
                                            className="text-xs font-bold bg-slate-50 border-none rounded-lg py-1.5 focus:ring-0 cursor-pointer text-slate-600"
                                            value={itemFilter}
                                            onChange={(e) => setItemFilter(e.target.value)}
                                        >
                                            <option value="all">Todos los materiales</option>
                                            {selectedOrder.items.map(item => (
                                                <option key={item.id} value={item.id}>{item.description}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedVoucherIds.length > 0 && (
                                        <button
                                            onClick={handleDeleteSelectedVouchers}
                                            className="btn-secondary py-1.5 px-3 bg-red-50 text-red-600 border-red-100 hover:bg-red-100 flex items-center gap-2 text-xs"
                                        >
                                            <Trash2 size={14} /> Eliminar Seleccionados ({selectedVoucherIds.length})
                                        </button>
                                    )}
                                </div>
                            </h3>

                            <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[800px]">
                                        <thead className="bg-slate-50/50">
                                            <tr className="text-left text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                {currentUserRole !== 'EXTERNAL' && (
                                                    <th className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                            checked={orderVouchers.length > 0 && selectedVoucherIds.length === orderVouchers.length}
                                                            onChange={() => handleSelectAllVouchers(orderVouchers.map(v => v.id))}
                                                        />
                                                    </th>
                                                )}
                                                <th className="px-6 py-4">Fecha</th>
                                                <th className="px-6 py-4">Vale / Guía</th>
                                                <th className="px-6 py-4">Material/Equipo</th>
                                                <th className="px-6 py-4 text-right">Cantidad</th>
                                                <th className="px-6 py-4">Reportado Por</th>
                                                <th className="px-6 py-4 text-center">Evidencia</th>
                                                <th className="px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {orderVouchers.length > 0 ? orderVouchers.map(v => {
                                                const item = selectedOrder.items.find(i => i.id === v.itemId);
                                                return (
                                                    <tr key={v.id} className={`hover:bg-slate-50/50 transition-colors ${selectedVoucherIds.includes(v.id) ? 'bg-primary/5' : ''} ${editingVoucher?.id === v.id ? 'bg-amber-50/30' : ''}`}>
                                                        {currentUserRole !== 'EXTERNAL' && (
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                                    checked={selectedVoucherIds.includes(v.id)}
                                                                    onChange={() => handleToggleSelectVoucher(v.id)}
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                                            {editingVoucher?.id === v.id ? (
                                                                <input
                                                                    type="date"
                                                                    className="w-full bg-white border-2 border-amber-200 rounded-lg p-1 text-[10px] outline-none focus:border-amber-400"
                                                                    value={editingVoucher.date}
                                                                    onChange={(e) => setEditingVoucher({ ...editingVoucher, date: e.target.value })}
                                                                />
                                                            ) : v.date}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-black text-slate-800">
                                                            {editingVoucher?.id === v.id ? (
                                                                <input
                                                                    type="text"
                                                                    className="w-full bg-white border-2 border-amber-200 rounded-lg p-1 text-[10px] outline-none focus:border-amber-400 font-black"
                                                                    value={editingVoucher.voucherNo}
                                                                    onChange={(e) => setEditingVoucher({ ...editingVoucher, voucherNo: e.target.value })}
                                                                />
                                                            ) : v.voucherNo}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{item?.description || '---'}</td>
                                                        <td className="px-6 py-4 text-xs font-black text-slate-800 text-right">
                                                            {editingVoucher?.id === v.id ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <input
                                                                        type="number"
                                                                        className="w-16 bg-white border-2 border-amber-200 rounded-lg p-1 text-[10px] outline-none focus:border-amber-400 text-right font-black"
                                                                        value={editingVoucher.quantity}
                                                                        onChange={(e) => setEditingVoucher({ ...editingVoucher, quantity: parseFloat(e.target.value) || 0 })}
                                                                    />
                                                                    <span>{item?.unit}</span>
                                                                </div>
                                                            ) : (
                                                                <>{v.quantity} {item?.unit}</>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 uppercase">
                                                                    {v.reportedBy?.charAt(0) || 'A'}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600">{v.reportedBy || 'Admin'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {v.photoUrl ? (
                                                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">CON FOTO</span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400">---</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {currentUserRole !== 'EXTERNAL' && (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {editingVoucher?.id === v.id ? (
                                                                        <>
                                                                            <button
                                                                                onClick={handleUpdateVoucher}
                                                                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                                title="Guardar"
                                                                            >
                                                                                <Save size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setEditingVoucher(null)}
                                                                                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                                                                                title="Cancelar"
                                                                            >
                                                                                <X size={16} />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setEditingVoucher(v)}
                                                                            className="p-2 text-slate-300 hover:text-amber-500 transition-colors"
                                                                            title="Editar Vale"
                                                                        >
                                                                            <Edit3 size={16} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeleteVoucher(v.id)}
                                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                                        title="Eliminar Vale"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-12 text-center">
                                                        <AlertCircle size={32} className="text-slate-200 mx-auto mb-2" />
                                                        <p className="text-sm font-bold text-slate-400">No hay vales reportados para esta orden aún.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-4 space-y-6">
                        <div className="premium-card p-8 bg-slate-900 text-white space-y-6">
                            <h3 className="text-lg font-bold">Información Administrativa</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Descripción</p>
                                    <p className="text-sm font-medium leading-relaxed">{selectedOrder.description || 'Sin descripción detallada.'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Inicio / Notif.</p>
                                        <p className="text-sm font-bold">{selectedOrder.notificationDate || selectedOrder.startDate}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Monto Contractual</p>
                                        <p className="text-sm font-black text-primary-light">S/ {selectedOrder.totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                {(() => {
                                    const orderExpenses = expenses.filter(e => e.orderId === selectedOrder.id);
                                    const totalExpensesAmount = orderExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                                    const result = selectedOrder.totalAmount - totalExpensesAmount;
                                    const isPositive = result >= 0;

                                    return (
                                        <div className="pt-4 mt-2 border-t border-white/10 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Gastos Totales</p>
                                                <p className="text-sm font-bold text-red-400">-S/ {totalExpensesAmount.toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Resultado Actual</p>
                                                <p className={`text-base font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                    S/ {result.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <button className="w-full py-3 bg-white/10 text-white border border-white/20 rounded-2xl text-xs font-black hover:bg-white/20 transition-all uppercase tracking-widest">
                                Exportar PDF de Control
                            </button>
                        </div>

                        {/* Simple Expenses List */}
                        <div className="premium-card p-6 space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <TrendingUp size={16} className="text-red-500" />
                                Gastos Asignados
                            </h4>
                            <div className="space-y-3">
                                {expenses.filter(e => e.orderId === selectedOrder.id).length > 0 ? (
                                    expenses.filter(e => e.orderId === selectedOrder.id).map(e => (
                                        <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{e.description}</p>
                                                <p className="text-[10px] text-slate-400">{e.date} • {e.category}</p>
                                            </div>
                                            <span className="text-xs font-black text-red-600">-S/ {e.amount.toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-slate-400 text-center py-4">No hay gastos registrados para esta orden.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --------------------------------------------------------------------------
    // RENDER: LIST VIEW
    // --------------------------------------------------------------------------
    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        {view === 'LIST' ? 'Gestión de Órdenes' : editingOrderId ? 'Editar Orden' : 'Nueva Orden Técnica'}
                        {isSyncing && <Activity size={20} className="text-primary animate-pulse" />}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {view === 'LIST' ? 'Configuración técnica y administrativa del contrato' : 'Complete los campos para registrar la orden en el sistema'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {currentUserRole === 'ADMIN' && view === 'LIST' && (
                        <button
                            onClick={forceSyncToCloud}
                            disabled={isSyncing}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isSyncing
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 shadow-lg shadow-emerald-500/10'
                                }`}
                        >
                            {isSyncing ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                <Cloud size={18} />
                            )}
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar Nube'}
                        </button>
                    )}
                    {currentUserRole !== 'EXTERNAL' && (
                        <button
                            onClick={() => {
                                if (view !== 'LIST') {
                                    setEditingOrderId(null);
                                    setOrderNumber(''); setClient(''); setDescription(''); setNotificationDate(getLimaDate());
                                    setItems([{ id: '1', description: '', quantity: 0, unit: 'm3', unitPrice: 0, total: 0, delivered: 0, deadlines: [{ id: 'd1', deadlineNumber: 1, daysToComplete: 0, quantity: 0, deliveredQuantity: 0, status: 'PENDING' }] }]);
                                }
                                setView(view === 'LIST' ? 'CREATE' : 'LIST');
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            {view === 'LIST' ? (
                                <>
                                    <Plus size={20} />
                                    Nueva Orden
                                </>
                            ) : (
                                'Volver a la lista'
                            )}
                        </button>
                    )}
                </div>
                {currentUserRole === 'EXTERNAL' && view !== 'LIST' && (
                    <button onClick={() => setView('LIST')} className="btn-primary">Volver a la lista</button>
                )}
            </div>

            {view === 'LIST' ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Filtrar por nro de orden, cliente o descripción..." className="w-full pl-12 pr-4 py-2 border-none focus:ring-0 bg-transparent text-sm" />
                        </div>
                        <div className="h-6 w-[1px] bg-slate-100"></div>
                        <button className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-sm font-medium">
                            <Filter size={16} />
                            Filtros
                        </button>
                    </div>

                    <div className="premium-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-left text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-8 py-5">Nro de Orden</th>
                                        <th className="px-8 py-5">Tipo</th>
                                        <th className="px-8 py-5">Entidad Solicitante</th>
                                        <th className="px-8 py-5 text-right">Monto Total</th>
                                        <th className="px-8 py-5">Ítems</th>
                                        <th className="px-8 py-5">Avance Global</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(() => {
                                        const filteredOrders = orders.filter(o =>
                                            currentUserRole !== 'EXTERNAL' ||
                                            (Array.isArray(assignedOrderIds) && assignedOrderIds.includes(o.id))
                                        );

                                        if (filteredOrders.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={8} className="px-8 py-20 text-center text-slate-400">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                                                                <ClipboardList size={32} />
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-800 font-bold">No se encontraron órdenes</p>
                                                                <p className="text-slate-500 text-sm">
                                                                    {currentUserRole === 'EXTERNAL'
                                                                        ? 'Aún no tienes órdenes asignadas para visualizar.'
                                                                        : 'No hay órdenes registradas que coincidan con los filtros.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return filteredOrders.map((order) => {
                                            const orderVouchers = vouchers.filter(v => v.orderId === order.id);
                                            const totalDelivered = orderVouchers.reduce((sum, v) => sum + v.quantity, 0);
                                            const totalTarget = order.items.reduce((sum, i) => sum + i.quantity, 0);
                                            const progress = totalTarget > 0 ? Math.min((totalDelivered / totalTarget) * 100, 100) : 0;
                                            const isExpanded = expandedOrderIds.includes(order.id);

                                            return (
                                                <React.Fragment key={order.id}>
                                                    <tr
                                                        onClick={() => toggleExpandOrder(order.id)}
                                                        className="hover:bg-slate-50/30 transition-colors group cursor-pointer"
                                                    >
                                                        <td className="px-8 py-5">
                                                            <span className="font-bold text-slate-700">{order.orderNumber}</span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${order.type === 'SERVICE' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {order.type === 'SERVICE' ? 'SERVICIO' : 'COMPRA'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-600">{order.client}</td>
                                                        <td className="px-8 py-5 text-right font-black text-slate-800">S/ {order.totalAmount.toLocaleString()}</td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-500 text-sm">
                                                                <Package size={14} /> {order.items.length} ítems
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
                                                                    <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-500">{progress.toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <button
                                                                onClick={(e) => {
                                                                    if (currentUserRole !== 'EXTERNAL') {
                                                                        handleToggleStatus(e, order);
                                                                    } else {
                                                                        e.stopPropagation();
                                                                    }
                                                                }}
                                                                disabled={currentUserRole === 'EXTERNAL'}
                                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${order.status === 'COMPLETED'
                                                                    ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                                                                    }`}
                                                            >
                                                                {order.status === 'COMPLETED' ? 'Archivado' : 'Activo'}
                                                            </button>
                                                        </td>
                                                        <td className="px-8 py-5 text-right relative">
                                                            {currentUserRole === 'EXTERNAL' ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleVisualize(order);
                                                                    }}
                                                                    className="btn-primary py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 w-full max-w-[120px] ml-auto"
                                                                >
                                                                    <Eye size={14} /> Ver Avance
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveMenuId(activeMenuId === order.id ? null : order.id);
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                                    >
                                                                        <MoreVertical size={18} />
                                                                    </button>

                                                                    {activeMenuId === order.id && (
                                                                        <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 w-48 animate-in zoom-in-95 duration-200">
                                                                            <button
                                                                                onClick={() => handleVisualize(order)}
                                                                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <Eye size={16} className="text-primary" /> Visualizar Orden
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleEdit(order)}
                                                                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <Edit3 size={16} className="text-amber-500" /> Editar Orden
                                                                            </button>
                                                                            <button className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                                                                <TrendingUp size={16} className="text-indigo-500" /> Ver Reportes
                                                                            </button>
                                                                            <div className="h-[1px] bg-slate-50 my-1"></div>
                                                                            <button
                                                                                onClick={() => handleDelete(order.id)}
                                                                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <Trash2 size={16} /> Eliminar
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="bg-slate-50/50">
                                                            <td colSpan={8} className="px-12 py-6">
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                    {/* Resumen de Materiales */}
                                                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                                                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                                                <Activity size={14} className="text-primary" />
                                                                                Resumen de Avance
                                                                            </h4>
                                                                            <span className="text-[10px] font-bold text-slate-400">{order.items.length} ítems</span>
                                                                        </div>
                                                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                            {order.items.map(item => {
                                                                                const delivered = orderVouchers.filter(v => v.itemId === item.id).reduce((sum, v) => sum + v.quantity, 0);
                                                                                const itemProgress = Math.min((delivered / item.quantity) * 100, 100);
                                                                                const isExceeded = delivered > item.quantity;

                                                                                return (
                                                                                    <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/30">
                                                                                        <div className="flex justify-between items-center mb-2">
                                                                                            <p className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">{item.description}</p>
                                                                                            <span className={`text-[10px] font-black ${isExceeded ? 'text-red-500' : 'text-primary'}`}>
                                                                                                {delivered} / {item.quantity} {item.unit}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                                            <div
                                                                                                className={`h-full ${isExceeded ? 'bg-red-500' : 'bg-primary'}`}
                                                                                                style={{ width: `${itemProgress}%` }}
                                                                                            ></div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>

                                                                    {/* Últimos Vales */}
                                                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                                                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                                                <FileText size={14} className="text-amber-500" />
                                                                                Últimos Vales Reportados
                                                                            </h4>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleVisualize(order); }}
                                                                                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                                                                            >
                                                                                Ver todos
                                                                            </button>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            {orderVouchers.length > 0 ? (
                                                                                orderVouchers.slice(0, 4).map(v => (
                                                                                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 group/v">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/v:bg-primary/5 group-hover/v:text-primary transition-colors">
                                                                                                <Hash size={14} />
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-[11px] font-bold text-slate-700">{v.voucherNo}</p>
                                                                                                <p className="text-[9px] font-medium text-slate-400">{v.date}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <p className="text-[11px] font-black text-slate-800">{v.quantity} {order.items.find(i => i.id === v.itemId)?.unit || ''}</p>
                                                                                            <p className="text-[9px] font-medium text-slate-500">{v.reportedBy || 'Admin'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="h-full flex flex-col items-center justify-center py-10 text-slate-300">
                                                                                    <AlertCircle size={24} className="mb-2 opacity-20" />
                                                                                    <p className="text-[11px] font-bold">No hay vales registrados</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {orderVouchers.length > 0 && (
                                                                            <div className="pt-2">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleVisualize(order); }}
                                                                                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                                                                >
                                                                                    <Eye size={14} /> Detalle Completo de Avance
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="col-span-1 lg:col-span-8 space-y-8">
                        <div className="premium-card p-8 space-y-8">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                                <FileText size={18} className="text-primary" />
                                Información Básica
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Orden</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setOrderType('SERVICE')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${orderType === 'SERVICE' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            <ClipboardList size={18} /> Servicio (OS)
                                        </button>
                                        <button
                                            onClick={() => setOrderType('PURCHASE')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${orderType === 'PURCHASE' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            <ShoppingCart size={18} /> Compra (OC)
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de Notificación</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="date"
                                            className="input-field pl-12"
                                            value={notificationDate}
                                            onChange={(e) => setNotificationDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nro de Orden</label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="input-field pl-12 font-bold"
                                            placeholder="Ej: OS-2024-001"
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entidad Solicitante</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="input-field pl-12"
                                            placeholder="Ej: Municipalidad de ..."
                                            value={client}
                                            onChange={(e) => setClient(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción del Contrato</label>
                                <textarea
                                    className="input-field min-h-[100px] resize-none"
                                    placeholder="Detalles generales del contrato o servicio..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="premium-card p-8 space-y-8">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Package size={18} className="text-primary" />
                                    Items y Plazos de Entrega
                                </h3>
                                <button onClick={handleAddItem} className="text-xs font-black text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all border border-primary/20 flex items-center gap-2">
                                    <Plus size={14} /> AGREGAR ITEM
                                </button>
                            </div>

                            <div className="space-y-12">
                                {(items || []).map((item, index) => (
                                    <div key={item.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6 relative group/item">
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="absolute -right-2 -top-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-lg border border-red-100 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-50"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-6 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Descripción del Item {index + 1}</label>
                                                <input
                                                    type="text"
                                                    className="input-field bg-white"
                                                    placeholder="Ej: Arena Fina, Alquiler de Camión..."
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Cantidad</label>
                                                <input
                                                    type="number"
                                                    className="input-field bg-white font-bold"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Unidad</label>
                                                <select
                                                    className="input-field bg-white"
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                >
                                                    <option value="m3">m3</option>
                                                    <option value="m2">m2</option>
                                                    <option value="m">m</option>
                                                    <option value="kg">kg</option>
                                                    <option value="und">und</option>
                                                    <option value="viaje">viaje</option>
                                                    <option value="dia">día</option>
                                                    <option value="hora">hora</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">P. Unit</label>
                                                <input
                                                    type="number"
                                                    className="input-field bg-white font-bold text-primary"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-200/50">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                                                    <Clock size={14} /> Cronograma de Entregas (Plazos)
                                                </h4>
                                                <button onClick={() => handleAddDeadline(item.id)} className="text-[10px] font-bold text-primary-dark hover:underline">+ Agregar Plazo</button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {(item.deadlines || []).map((deadline) => (
                                                    <div key={deadline.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 relative group/deadline">
                                                        <button
                                                            onClick={() => handleRemoveDeadline(item.id, deadline.id)}
                                                            className="absolute right-2 top-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/deadline:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                        <span className="text-[10px] font-black text-slate-400">PLAZO {deadline.deadlineNumber}</span>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold text-slate-500 uppercase">Días</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary"
                                                                    value={deadline.daysToComplete}
                                                                    onChange={(e) => handleDeadlineChange(item.id, deadline.id, 'daysToComplete', parseInt(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold text-slate-500 uppercase">Cant.</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary"
                                                                    value={deadline.quantity}
                                                                    onChange={(e) => handleDeadlineChange(item.id, deadline.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-4">
                        <div className="premium-card p-8 bg-slate-900 text-white space-y-8 lg:sticky lg:top-28">
                            <h3 className="text-xl font-bold">Resumen de Activación</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-slate-400 border-b border-white/10 pb-4">
                                    <span className="text-sm">Nro de Orden</span>
                                    <span className="text-white font-bold">{orderNumber || '---'}</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Importe Estimado</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white">${calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSaveOrder} className="w-full btn-primary py-4 bg-white text-slate-900 border-none shadow-2xl flex items-center justify-center gap-3">
                                <Save size={20} /> {editingOrderId ? 'Actualizar Orden' : 'Guardar Orden'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminOrders;
