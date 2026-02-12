import { useState, useEffect } from 'react';
import { TrendingDown, Plus, Filter, Search, Download, Trash2, X, Save, AlertCircle } from 'lucide-react';
import type { Order, Expense } from '../types';
import { getLimaDate } from '../utils/dateUtils';

const Expenses = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrder, setFilterOrder] = useState('all');

    const [formData, setFormData] = useState({
        orderId: '',
        description: '',
        amount: '',
        category: 'FUEL' as Expense['category'],
        date: getLimaDate()
    });

    useEffect(() => {
        const savedOrders = localStorage.getItem('antigravity_orders');
        const savedExpenses = localStorage.getItem('antigravity_expenses');
        if (savedOrders) setOrders(JSON.parse(savedOrders));
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    }, []);

    const saveExpenses = (newExpenses: Expense[]) => {
        setExpenses(newExpenses);
        localStorage.setItem('antigravity_expenses', JSON.stringify(newExpenses));
    };

    const handleAddExpense = () => {
        if (!formData.orderId || !formData.amount || !formData.description) {
            alert('Por favor complete los campos obligatorios.');
            return;
        }

        const newExpense: Expense = {
            id: Date.now().toString(),
            orderId: formData.orderId,
            description: formData.description,
            amount: parseFloat(formData.amount),
            date: formData.date,
            category: formData.category,
            reportedBy: 'Administrador'
        };

        saveExpenses([newExpense, ...expenses]);
        setShowModal(false);
        setFormData({
            orderId: '',
            description: '',
            amount: '',
            category: 'FUEL',
            date: getLimaDate()
        });
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Está seguro de eliminar este registro de gasto?')) {
            saveExpenses(expenses.filter(e => e.id !== id));
        }
    };

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOrder = filterOrder === 'all' || e.orderId === filterOrder;
        return matchesSearch && matchesOrder;
    });

    const totalThisMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Control de Gastos</h1>
                    <p className="text-slate-500 font-medium mt-1">Monitoreo de costos operativos por orden</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2">
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                    >
                        <Plus size={18} />
                        Registrar Gasto
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="premium-card p-6 bg-red-50/50 border-red-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Gastos Seleccionados</p>
                        <h3 className="text-3xl font-black text-red-600 mt-1">${totalThisMonth.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-red-500">
                        <TrendingDown size={24} />
                    </div>
                </div>

                <div className="premium-card p-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros de Gasto</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{filteredExpenses.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary">
                        <Plus size={24} />
                    </div>
                </div>
            </div>

            <div className="premium-card p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar descripción..."
                            className="input-field pl-12"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:border-primary"
                            value={filterOrder}
                            onChange={(e) => setFilterOrder(e.target.value)}
                        >
                            <option value="all">Todas las Órdenes</option>
                            {orders.map(o => (
                                <option key={o.id} value={o.id}>{o.orderNumber}</option>
                            ))}
                        </select>
                        <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-colors">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-5 pt-0 px-4">Fecha</th>
                                <th className="pb-5 pt-0 px-4">Orden</th>
                                <th className="pb-5 pt-0 px-4">Categoría</th>
                                <th className="pb-5 pt-0 px-4">Descripción</th>
                                <th className="pb-5 pt-0 px-4 text-right">Monto</th>
                                <th className="pb-5 pt-0 px-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredExpenses.length > 0 ? filteredExpenses.map((exp) => {
                                const order = orders.find(o => o.id === exp.orderId);
                                return (
                                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 px-4 text-sm font-bold text-slate-500">{exp.date}</td>
                                        <td className="py-5 px-4 font-black text-sm text-primary uppercase">
                                            {order ? order.orderNumber : 'N/A'}
                                        </td>
                                        <td className="py-5 px-4">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-sm font-medium text-slate-600">{exp.description}</td>
                                        <td className="py-5 px-4 text-right font-black text-red-500">
                                            -${exp.amount.toLocaleString()}
                                        </td>
                                        <td className="py-5 px-4 text-right">
                                            <button
                                                onClick={() => handleDelete(exp.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-sm font-bold text-slate-400">No se encontraron registros de gastos.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registrar Gasto</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Asignar a Orden</label>
                                    <select
                                        className="input-field"
                                        value={formData.orderId}
                                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                    >
                                        <option value="">Seleccione una orden...</option>
                                        {orders.map(o => (
                                            <option key={o.id} value={o.id}>{o.orderNumber} - {o.client}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Monto ($)</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fecha</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Categoría</label>
                                    <select
                                        className="input-field"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Expense['category'] })}
                                    >
                                        <option value="FUEL">FUEL (Combustible)</option>
                                        <option value="MAINTENANCE">MAINTENANCE (Mantenimiento)</option>
                                        <option value="LABOR">LABOR (Personal)</option>
                                        <option value="FOOD">FOOD (Alimentación)</option>
                                        <option value="OTHER">OTHER (Otros)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
                                    <textarea
                                        className="input-field min-h-[100px] py-3"
                                        placeholder="Detalle del gasto..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <button
                                onClick={handleAddExpense}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                            >
                                <Save size={18} />
                                Guardar Gasto Operativo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
