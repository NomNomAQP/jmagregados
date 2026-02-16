import { useState, useEffect } from 'react';
import { Camera, Hash, Layers, FileCheck, Send, Clock, Clipboard, AlertCircle } from 'lucide-react';
import type { Order, Voucher } from '../types';
import { getLimaDate } from '../utils/dateUtils';

const PurchaseOrderReport = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('');

    const [formData, setFormData] = useState({
        orderId: '',
        itemId: '',
        quantityDelivered: '',
        voucherNo: '',
        date: getLimaDate()
    });

    const [preview, setPreview] = useState<string | null>(null);

    // Load data from localStorage
    useEffect(() => {
        const savedOrders = localStorage.getItem('antigravity_orders');
        const savedVouchers = localStorage.getItem('antigravity_vouchers');
        const loggedUserStr = localStorage.getItem('antigravity_logged_user');

        let assignedIds: string[] = [];
        let isExternal = false;

        if (loggedUserStr) {
            const loggedUser = JSON.parse(loggedUserStr);
            const savedUsersStr = localStorage.getItem('antigravity_users_list');
            if (savedUsersStr) {
                const users = JSON.parse(savedUsersStr);
                const fullUser = users.find((u: any) => u.name === loggedUser.name);
                if (fullUser) {
                    assignedIds = fullUser.assignedOrderIds || [];
                    isExternal = fullUser.role === 'EXTERNAL';
                    setUserRole(fullUser.role);
                }
            } else {
                setUserRole(loggedUser.role || '');
            }
        }

        if (savedOrders) {
            const parsed = JSON.parse(savedOrders) as Order[];
            let filtered = parsed.filter(o => o.type === 'PURCHASE');
            if (isExternal) {
                filtered = filtered.filter(o => assignedIds.includes(o.id));
            }
            setOrders(filtered);
        }

        if (savedVouchers) {
            setVouchers(JSON.parse(savedVouchers));
        }
    }, []);

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        setError(null);

        if (!selectedOrderId || !formData.itemId || !formData.quantityDelivered || !formData.voucherNo) {
            alert('Por favor complete todos los campos obligatorios.');
            return;
        }

        // 1. Check for duplicate voucher number
        const isDuplicate = vouchers.some(v => v.voucherNo.toLowerCase() === formData.voucherNo.toLowerCase());
        if (isDuplicate) {
            setError(`El número de guía/vale "${formData.voucherNo}" ya existe en el sistema.`);
            return;
        }

        const newVoucher: Voucher = {
            id: crypto.randomUUID(),
            orderId: selectedOrderId,
            itemId: formData.itemId,
            date: formData.date,
            quantity: parseFloat(formData.quantityDelivered),
            voucherNo: formData.voucherNo,
            type: 'PURCHASE',
            reportedBy: (JSON.parse(localStorage.getItem('antigravity_logged_user') || '{}')).name || 'Anónimo',
            photoUrl: preview || undefined
        };

        const updatedVouchers = [...vouchers, newVoucher];
        localStorage.setItem('antigravity_vouchers', JSON.stringify(updatedVouchers));
        setVouchers(updatedVouchers);

        // --- NUEVO: Sincronización Automática con la Nube ---
        const syncToCloud = async () => {
            const { supabase } = await import('../utils/supabase');
            try {
                const { error } = await supabase.from('vouchers').upsert({
                    id: newVoucher.id,
                    orderId: newVoucher.orderId,
                    itemId: newVoucher.itemId,
                    date: newVoucher.date,
                    quantity: newVoucher.quantity,
                    voucherNo: newVoucher.voucherNo,
                    type: newVoucher.type,
                    reportedBy: newVoucher.reportedBy,
                    photoUrl: newVoucher.photoUrl
                });
                if (error) console.warn("Aviso: Guardado local, pero error al subir a nube.", error);
            } catch (err) {
                console.error("Error de conexión:", err);
            }
        };
        syncToCloud();

        alert('Reporte de entrega guardado exitosamente.');

        // Reset form
        setFormData({ ...formData, itemId: '', quantityDelivered: '', voucherNo: '' });
        setPreview(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reporte de Entrega (OC)</h1>
                    <p className="text-slate-500 font-medium mt-1">Suministros y recepción de materiales</p>
                </div>
                <div className="px-4 py-2 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20 flex items-center justify-center gap-2 self-start md:self-auto">
                    <Clock size={18} />
                    <span className="font-bold">{formData.date}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="premium-card p-8 space-y-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                            <Clipboard size={18} className="text-primary" />
                            Selección de Suministro
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orden de Compra</label>
                                <select
                                    className="input-field appearance-none bg-slate-50"
                                    value={selectedOrderId}
                                    onChange={(e) => {
                                        setSelectedOrderId(e.target.value);
                                        setFormData(prev => ({ ...prev, orderId: e.target.value, itemId: '' }));
                                    }}
                                >
                                    <option value="" disabled>Seleccione una OC activa...</option>
                                    {orders.map(order => (
                                        <option key={order.id} value={order.id}>{order.orderNumber} - {order.client}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedOrder && (
                                <div className="space-y-2 animate-in fade-in">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Material / Producto</label>
                                    <select
                                        className="input-field appearance-none bg-slate-50"
                                        value={formData.itemId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, itemId: e.target.value }))}
                                    >
                                        <option value="">Seleccione el material...</option>
                                        {selectedOrder.items.map(item => (
                                            <option key={item.id} value={item.id}>{item.description} ({item.unit})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nro de Guía/Vale</label>
                                <input
                                    type="text"
                                    className={`input-field ${error ? 'border-red-500 bg-red-50/10' : ''}`}
                                    placeholder="Ej: GV-00123"
                                    value={formData.voucherNo}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, voucherNo: e.target.value }));
                                        setError(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-8 space-y-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                            <Layers size={18} className="text-primary" />
                            Cantidades Recibidas
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cant. Despachada</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        className="input-field pl-12"
                                        placeholder="0.00"
                                        value={formData.quantityDelivered}
                                        onChange={(e) => setFormData(prev => ({ ...prev, quantityDelivered: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="premium-card p-8 space-y-6 h-full flex flex-col">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                            <Camera size={18} className="text-primary" />
                            Evidencia de Recepción
                        </h3>

                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all group relative overflow-hidden min-h-[200px]">
                            {preview ? (
                                <div className="w-full h-full relative group">
                                    <img src={preview} alt="Voucher" className="w-full h-64 object-cover rounded-2xl" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <button onClick={() => setPreview(null)} className="btn-primary bg-red-500 hover:bg-red-600">Cambiar Foto</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto group-hover:text-primary transition-colors">
                                        <Camera size={32} />
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageChange}
                                    />
                                    <p className="font-bold text-slate-700">Subir foto de guía</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-xs font-bold animate-in shake">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={userRole === 'OBSERVER'}
                            className={`w-full flex items-center justify-center gap-2 py-4 shadow-xl mt-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${userRole === 'OBSERVER'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10'
                                }`}
                        >
                            <Send size={20} />
                            {userRole === 'OBSERVER' ? 'Acceso de Solo Lectura' : 'Enviar Reporte de Despacho'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="premium-card p-6 border-l-4 border-l-amber-500 bg-amber-50/5">
                <div className="flex items-center gap-3 text-amber-700">
                    <FileCheck size={20} />
                    <p className="text-sm font-medium">Reportado por: <b>Administrador</b></p>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderReport;
