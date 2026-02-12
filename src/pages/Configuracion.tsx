import { useState, useEffect } from 'react';
import { Shield, Database, Save, CheckCircle2, Users, MoreHorizontal, AlertCircle } from 'lucide-react';

interface User {
    id: string;
    name: string;
    role: 'ADMIN' | 'OPERATOR' | 'REPORTER';
    avatar: string;
    username?: string;
    password?: string;
}

const Configuracion = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        // Cargar usuarios de localStorage o usar una lista por defecto si no hay
        const savedUsers = localStorage.getItem('antigravity_users_list');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
        } else {
            const initialUsers: User[] = [
                { id: '1', name: 'Bryan Portilla', role: 'ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bryan', username: 'admin', password: '123' },
                { id: '2', name: 'Juan Operador', role: 'OPERATOR', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan', username: 'operador', password: '123' },
                { id: '3', name: 'Maria Reportes', role: 'REPORTER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', username: 'reporter', password: '123' },
            ];
            setUsers(initialUsers);
            localStorage.setItem('antigravity_users_list', JSON.stringify(initialUsers));
        }
    }, []);

    const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'OPERATOR' | 'REPORTER') => {
        const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
        );
        setUsers(updatedUsers);
    };

    const saveChanges = () => {
        localStorage.setItem('antigravity_users_list', JSON.stringify(users));

        // Actualizar el rol del usuario actual si está en la lista (basado en el nombre para este demo)
        const currentUser = users.find(u => u.name === 'Bryan Portilla');
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
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                                <Shield size={24} />
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="overflow-hidden border border-slate-100 rounded-3xl bg-slate-50/30">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Usuario</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Estado</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Rol Asignado</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(user => (
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
                                                <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase border border-green-100">Activo</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                    className="bg-slate-100 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer outline-none"
                                                >
                                                    <option value="ADMIN">Administrador</option>
                                                    <option value="OPERATOR">Operador</option>
                                                    <option value="REPORTER">Reportador</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                                    <MoreHorizontal size={20} />
                                                </button>
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
        </div>
    );
};

export default Configuracion;
