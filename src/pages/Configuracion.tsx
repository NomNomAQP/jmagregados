import { useState, useEffect } from 'react';
import { Shield, Database, Save, CheckCircle2, Users, AlertCircle, Eye, EyeOff, UserPlus, Trash2, X, CloudSync } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface User {
    id: string;
    name: string;
    role: 'ADMIN' | 'OPERATOR' | 'REPORTER' | 'EXTERNAL';
    avatar: string;
    username?: string;
    password?: string;
    assignedOrderIds?: string[];
}

const Configuracion = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPasswords, setShowPasswords] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        username: '',
        password: '',
        role: 'OPERATOR' as User['role']
    });

    useEffect(() => {
        fetchUsers();

        const savedOrders = localStorage.getItem('antigravity_orders');
        if (savedOrders) {
            setOrders(JSON.parse(savedOrders));
        }
    }, []);

    const fetchUsers = async () => {
        setIsSyncing(true);

        // Intentar primero con Supabase
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
            try {
                const { data, error } = await supabase.from('users').select('*');
                if (data && !error) {
                    setUsers(data);
                    localStorage.setItem('antigravity_users_list', JSON.stringify(data));
                    setIsSyncing(false);
                    return;
                }
            } catch (err) {
                console.error("Supabase Fetch Error:", err);
            }
        }

        // Respaldo en LocalStorage
        const savedUsers = localStorage.getItem('antigravity_users_list');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
        } else {
            const initialUsers: User[] = [
                { id: '1', name: 'Bryan Portilla', role: 'ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bryan', username: 'bryanp', password: 'idancelord', assignedOrderIds: [] },
                { id: '2', name: 'Juan Operador', role: 'OPERATOR', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan', username: 'operador', password: '123', assignedOrderIds: [] },
                { id: '3', name: 'Maria Reportes', username: 'reporter', password: '123', role: 'REPORTER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', assignedOrderIds: [] },
            ];
            setUsers(initialUsers);
            localStorage.setItem('antigravity_users_list', JSON.stringify(initialUsers));
        }
        setIsSyncing(false);
    };

    const handleRoleChange = (userId: string, newRole: User['role']) => {
        const updatedUsers = users.map((user: User) =>
            user.id === userId ? { ...user, role: newRole } : user
        );
        setUsers(updatedUsers);
    };

    const togglePasswordVisibility = (userId: string) => {
        setShowPasswords((prev: string[]) =>
            prev.includes(userId) ? prev.filter((id: string) => id !== userId) : [...prev, userId]
        );
    };

    const handlePasswordChange = (userId: string, newPassword: string) => {
        const updatedUsers = users.map((user: User) =>
            user.id === userId ? { ...user, password: newPassword } : user
        );
        setUsers(updatedUsers);
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.username || !newUser.password) {
            alert('Por favor complete todos los campos');
            return;
        }

        const userToAdd: User = {
            id: Date.now().toString(),
            name: newUser.name,
            username: newUser.username.trim().toLowerCase(),
            password: newUser.password.trim(),
            role: newUser.role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`,
            assignedOrderIds: []
        };

        // Guardar en Supabase si está configurado
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
            try {
                const { error } = await supabase.from('users').insert([userToAdd]);
                if (error) console.error("Supabase Save Error:", error);
            } catch (err) {
                console.error("Supabase Save Exception:", err);
            }
        }

        const updatedUsers = [...users, userToAdd];
        setUsers(updatedUsers);
        localStorage.setItem('antigravity_users_list', JSON.stringify(updatedUsers));

        setIsCreating(false);
        setNewUser({ name: '', username: '', password: '', role: 'OPERATOR' });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === '1') {
            alert('No se puede eliminar al administrador principal');
            return;
        }
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            // Eliminar de Supabase si está configurado
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                try {
                    await supabase.from('users').delete().eq('id', userId);
                } catch (err) {
                    console.error("Supabase Delete Error:", err);
                }
            }

            const updatedUsers = users.filter(u => u.id !== userId);
            setUsers(updatedUsers);
            localStorage.setItem('antigravity_users_list', JSON.stringify(updatedUsers));
        }
    };

    const toggleOrderForUser = (userId: string, orderId: string) => {
        const updatedUsers = users.map((user: User) => {
            if (user.id === userId) {
                const currentAssigned = user.assignedOrderIds || [];
                const newAssigned = currentAssigned.includes(orderId)
                    ? currentAssigned.filter((id: string) => id !== orderId)
                    : [...currentAssigned, orderId];
                return { ...user, assignedOrderIds: newAssigned };
            }
            return user;
        });
        setUsers(updatedUsers);
        if (editingUser && editingUser.id === userId) {
            setEditingUser(updatedUsers.find((u: User) => u.id === userId) || null);
        }
    };

    const saveChanges = () => {
        localStorage.setItem('antigravity_users_list', JSON.stringify(users));

        // Actualizar el rol del usuario actual si está en la lista (basado en el nombre para este demo)
        const currentUser = users.find((u: User) => u.name === 'Bryan Portilla');
        if (currentUser) {
            localStorage.setItem('antigravity_user_role', currentUser.role);
        }

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            window.location.reload();
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Configuración de Sistema</h1>
                    <p className="text-slate-500 font-medium mt-1">Control de accesos, roles y mantenimiento de datos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Menu */}
                <div className="lg:col-span-3 space-y-2">
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all border border-primary">
                        <div className="flex items-center gap-3">
                            <Shield size={20} />
                            <span>Control de Accesos</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-white rounded-2xl font-bold transition-all border border-transparent hover:border-slate-100">
                        <Users size={20} />
                        Gestión de Usuarios
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-white rounded-2xl font-bold transition-all border border-transparent hover:border-slate-100">
                        <Database size={20} />
                        Mantenimiento
                    </button>
                </div>

                {/* Main Panel */}
                <div className="lg:col-span-9 space-y-8">
                    <div className="premium-card p-8 space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                            <div className="text-left">
                                <h2 className="text-xl font-black text-slate-800">Asignación de Roles</h2>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Configure los permisos específicos para cada usuario del sistema.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={fetchUsers}
                                    className={`p-2.5 rounded-xl transition-all ${isSyncing ? 'animate-spin text-primary' : 'text-slate-400 hover:bg-slate-50'}`}
                                    title="Sincronizar con Supabase"
                                >
                                    <CloudSync size={20} />
                                </button>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl font-bold text-xs hover:bg-primary/20 transition-all"
                                >
                                    <UserPlus size={16} />
                                    Nuevo Usuario
                                </button>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                                    <Shield size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="overflow-hidden border border-slate-100 rounded-3xl bg-slate-50/30">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Usuario</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Usuario (Login)</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Contraseña</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Rol Asignado</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user: User) => (
                                        <tr key={user.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3 text-left">
                                                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl border-2 border-slate-50" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user.id === '1' ? 'Propietario' : 'Personal'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-lg">{user.username || '---'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 group/pass max-w-[150px]">
                                                    <input
                                                        type={showPasswords.includes(user.id) ? "text" : "password"}
                                                        value={user.password}
                                                        onChange={(e) => handlePasswordChange(user.id, e.target.value)}
                                                        className="bg-slate-100 border-none rounded-lg px-2 py-1 text-xs font-bold text-slate-800 font-mono w-full focus:ring-1 focus:ring-primary/30 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => togglePasswordVisibility(user.id)}
                                                        className="p-1 text-slate-300 hover:text-primary transition-colors shrink-0"
                                                    >
                                                        {showPasswords.includes(user.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                    className="bg-slate-100 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer outline-none w-full"
                                                >
                                                    <option value="ADMIN">Administrador</option>
                                                    <option value="OPERATOR">Operador</option>
                                                    <option value="REPORTER">Reportador</option>
                                                    <option value="EXTERNAL">Externo (Visualizador)</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="p-2 text-slate-300 hover:text-primary transition-colors bg-slate-50 rounded-xl"
                                                        title="Asignar Órdenes"
                                                    >
                                                        <Database size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-xl"
                                                        title="Eliminar Usuario"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary of what they see */}
                        <div className="p-8 bg-slate-900 rounded-3xl space-y-6 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <h3 className="font-bold text-white flex items-center gap-2 relative z-10">
                                <AlertCircle size={18} className="text-primary-light" />
                                Importante: Efecto de los Roles
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-primary-light text-[10px] font-black uppercase mb-2">Administrador</p>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Acceso total. Puede ver Dashboard, Gastos, Equipo y Configuración.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-amber-400 text-[10px] font-black uppercase mb-2">Operador / Reportador</p>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Acceso restringido. Solo ven los Reportes de Servicio y Compras.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-emerald-400 text-[10px] font-black uppercase mb-2">Externo</p>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Acceso hiper-restringido. Solo ve reportes de órdenes asignadas por Admin.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Seguridad</p>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">La configuración de roles solo es accesible para Administradores.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={saveChanges}
                                className="btn-primary py-4 px-12 flex items-center gap-3 shadow-2xl shadow-primary/30"
                                disabled={showSuccess}
                            >
                                {showSuccess ? (
                                    <>
                                        <CheckCircle2 size={20} /> Actualizando Accesos...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} /> Guardar Privilegios de Usuarios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal de Asignación de Órdenes */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <img src={editingUser.avatar} className="w-10 h-10 rounded-xl" alt="" />
                                <div>
                                    <h3 className="font-bold text-slate-800">Gestionar Órdenes Asignadas</h3>
                                    <p className="text-xs text-slate-400 font-medium">{editingUser.name} • {editingUser.role}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
                                <AlertCircle size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 text-blue-700">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <div className="text-xs font-medium leading-relaxed">
                                    Marque las órdenes que desea que este usuario pueda visualizar en su apartado de reportes. Si el rol es <b>Externo</b>, solo verá las que estén seleccionadas aquí.
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {orders.map((order: any) => {
                                    const isChecked = (editingUser.assignedOrderIds || []).includes(order.id);
                                    return (
                                        <div
                                            key={order.id}
                                            onClick={() => toggleOrderForUser(editingUser.id, order.id)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isChecked ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200'}`}>
                                                    {isChecked && <CheckCircle2 size={12} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{order.orderNumber}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase">{order.type === 'SERVICE' ? 'Servicio' : 'Compra'} • {order.client}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${order.status === 'COMPLETED' ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-600'}`}>
                                                {order.status === 'COMPLETED' ? 'ARCHIVADO' : 'ACTIVO'}
                                            </span>
                                        </div>
                                    );
                                })}
                                {orders.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        <Database size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm font-bold">No hay órdenes registradas en el sistema aún.</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="w-full py-4 rounded-2xl font-bold text-white bg-slate-900 shadow-xl hover:bg-slate-800 transition-all"
                                >
                                    Cerrar y Continuar Configuraciones
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Creación de Usuario */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus size={20} className="text-primary" />
                                Nuevo Registro de Usuario
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: Carlos Mendivil"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre de Usuario (Login)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: carlosm"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
                                <input
                                    type="text"
                                    className="input-field font-mono"
                                    placeholder="Asigne una contraseña"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rol en la Empresa</label>
                                <select
                                    className="input-field"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                >
                                    <option value="ADMIN">Administrador</option>
                                    <option value="OPERATOR">Operador</option>
                                    <option value="REPORTER">Reportador</option>
                                    <option value="EXTERNAL">Externo (Visualizador)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all border border-slate-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-primary shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
                                >
                                    Registrar Usuario
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuracion;
