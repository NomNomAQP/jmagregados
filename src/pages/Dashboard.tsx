import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, ResponsiveContainer,
    Cell, PieChart, Pie, Tooltip
} from 'recharts';
import {
    Activity,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    FileText,
    Package,
    Calendar,
    ChevronRight,
    Search,
    Clock,
    DollarSign,
    MoreHorizontal
} from 'lucide-react';
import type { Order, Voucher, Expense } from '../types';
import { parseLimaDateString } from '../utils/dateUtils';

const Dashboard = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    useEffect(() => {
        const savedOrders = localStorage.getItem('antigravity_orders');
        const savedVouchers = localStorage.getItem('antigravity_vouchers');
        const savedExpenses = localStorage.getItem('antigravity_expenses');

        if (savedOrders) setOrders(JSON.parse(savedOrders));
        if (savedVouchers) setVouchers(JSON.parse(savedVouchers));
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    }, []);

    // --- Data Calculations ---
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const activeOrdersCount = orders.filter(o => o.status === 'IN_PROGRESS').length;

    // Delivery Progress Data
    const deliveryProgress = orders.map(o => {
        const orderVouchers = vouchers.filter(v => v.orderId === o.id);
        const delivered = orderVouchers.reduce((sum, v) => sum + v.quantity, 0);
        const total = o.items.reduce((sum, i) => sum + i.quantity, 0);
        return {
            name: o.orderNumber,
            progress: total > 0 ? (delivered / total) * 100 : 0,
            full: 100
        };
    }).slice(0, 5);

    // Expenses by Category for Pie Chart
    const categoriesMap: Record<string, number> = {};
    expenses.forEach(e => {
        categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
    });
    const pieData = Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));
    const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

    // Upcoming Deadlines (Next 5)
    const upcomingDeadlines = orders.flatMap(o =>
        (o.items || []).flatMap(item => {
            let cumulativeDays = 0;
            const baseDateStr = o.notificationDate || o.startDate;
            if (!baseDateStr) return [];

            return (item.deadlines || [])
                .filter(d => d.status === 'PENDING')
                .map(d => {
                    cumulativeDays += d.daysToComplete || 0;
                    const baseDate = parseLimaDateString(baseDateStr);
                    const deadlineDate = new Date(baseDate);
                    deadlineDate.setDate(deadlineDate.getDate() + cumulativeDays);
                    return {
                        orderNo: o.orderNumber,
                        item: item.description,
                        deadlineNo: d.deadlineNumber,
                        date: deadlineDate,
                        daysLeft: Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                    };
                });
        })
    ).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section with real-time greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100/50">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
                    <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <Activity size={16} className="text-primary animate-pulse" />
                        Monitoreo en tiempo real de JM Agregados
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-10 h-10 rounded-2xl border-4 border-white shadow-sm" alt="team" />
                        ))}
                        <div className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">
                            +12
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="premium-card p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-xl shadow-indigo-200 group hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-black bg-white/20 px-2 py-1 rounded-lg">EJECUCION</span>
                    </div>
                    <div className="mt-8">
                        <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest">Ingreso Proyectado</h3>
                        <p className="text-3xl font-black mt-1">S/ {totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="premium-card p-6 bg-white border-slate-100 group hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg">-12.5%</span>
                    </div>
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Gastos Operativos</h3>
                        <p className="text-3xl font-black text-slate-800 mt-1">S/ {totalExpenses.toLocaleString()}</p>
                    </div>
                </div>

                <div className="premium-card p-6 bg-white border-slate-100 group hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">{profitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Utilidad Neta</h3>
                        <p className="text-3xl font-black text-slate-800 mt-1">S/ {netProfit.toLocaleString()}</p>
                    </div>
                </div>

                <div className="premium-card p-6 bg-slate-900 border-none text-white group hover:scale-[1.02] transition-transform shadow-xl shadow-slate-200">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <Package size={24} className="text-primary-light" />
                        </div>
                        <span className="text-xs font-black text-primary-light bg-white/10 px-2 py-1 rounded-lg">{activeOrdersCount} ACTIVAS</span>
                    </div>
                    <div className="mt-8">
                        <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest">Ordenes Totales</h3>
                        <p className="text-3xl font-black mt-1">{orders.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Visualizations */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Progress Chart */}
                    <div className="premium-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Despacho vs. Metas</h3>
                                <p className="text-sm text-slate-400 font-medium">Avance porcentual de las últimas 5 órdenes técnicas</p>
                            </div>
                            <button className="flex items-center gap-2 text-xs font-black text-primary bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors uppercase tracking-widest">
                                Reporte Detallado <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deliveryProgress} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <XAxis type="category" dataKey="name" hide />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10">
                                                        <p className="text-xs font-black uppercase tracking-widest">{payload[0].payload.name}</p>
                                                        <p className="text-lg font-black text-primary-light">{payload[0].value.toFixed(1)}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="progress" radius={[0, 10, 10, 0]} barSize={32}>
                                        {deliveryProgress.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.progress > 80 ? '#10b981' : entry.progress > 40 ? '#6366f1' : '#f59e0b'} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="full" radius={[0, 10, 10, 0]} barSize={32} fill="#f1f5f9" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-50 mt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efectividad</span>
                                <span className="text-xl font-black text-slate-800">94.2%</span>
                            </div>
                            <div className="flex flex-col gap-1 text-center border-x border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumplimiento</span>
                                <span className="text-xl font-black text-emerald-500">A TIEMPO</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntualidad</span>
                                <span className="text-xl font-black text-slate-800">92%</span>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Deadlines Table */}
                    <div className="premium-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Próximos Vencimientos</h3>
                                <p className="text-sm text-slate-400 font-medium tracking-tight">Cierre de plazos contractuales críticos</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input type="text" placeholder="Buscar hito..." className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/20 w-48" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">
                                        <th className="pb-4">Orden / Ítem</th>
                                        <th className="pb-4">Plazo</th>
                                        <th className="pb-4">Vence</th>
                                        <th className="pb-4 text-right">Prioridad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((d, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-black text-xs">
                                                        {d.orderNo.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{d.orderNo}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 truncate max-w-[150px]">{d.item}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 uppercase">Hito {d.deadlineNo}</span>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-2 font-bold text-slate-600 text-xs text-left">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {d.date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                                </div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${d.daysLeft < 3 ? 'bg-red-50 text-red-500' : d.daysLeft < 7 ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}>
                                                    {d.daysLeft <= 0 ? 'Expirado' : `En ${d.daysLeft} días`}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400 font-medium text-sm italic">No hay plazos pendientes registrados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Global Stats Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Financial Breakdown */}
                    <div className="premium-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-800 text-lg">Distribución de Costos</h3>
                            <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <MoreHorizontal size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="h-60 relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Total Egresos</p>
                                    <p className="text-2xl font-black text-slate-800 leading-tight">S/ {totalExpenses.toLocaleString()}</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData.length > 0 ? pieData : [{ name: 'Sin datos', value: 1 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                        {pieData.length === 0 && <Cell fill="#f1f5f9" />}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 mt-8">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800">S/ {entry.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Action / Status */}
                    <div className="premium-card p-8 bg-indigo-50 border-indigo-100 flex flex-col items-center text-center space-y-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="p-4 bg-white rounded-3xl shadow-xl shadow-indigo-200/50 text-indigo-600 mb-2 relative z-10">
                            <Clock size={32} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-lg font-black text-indigo-900">Mantenimiento de Datos</h4>
                            <p className="text-xs font-medium text-indigo-600/80 leading-relaxed max-w-[200px] mt-2">
                                Recuerda registrar los vales diarios para mantener el balance real actualizado.
                            </p>
                        </div>
                        <button className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 relative z-10">
                            <FileText size={18} /> Registrar Vales Hoy
                        </button>
                    </div>

                    {/* Performance Widget */}
                    <div className="premium-card p-8 border-none bg-slate-900 shadow-2xl shadow-slate-300 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-white font-black uppercase tracking-widest text-[10px] opacity-60">Rentabilidad Global</h4>
                                <ArrowUpRight className="text-primary-light" size={20} />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                                    <DollarSign size={24} className="text-primary-light" />
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-white">S/ {netProfit.toLocaleString()}</p>
                                    <p className="text-[10px] font-black text-emerald-400 mt-0.5">ESTADO: SALUDABLE</p>
                                </div>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-light" style={{ width: `${Math.min(profitMargin, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
