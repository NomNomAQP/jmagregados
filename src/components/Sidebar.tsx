import React from 'react';
import {
    ClipboardList,
    ShoppingCart,
    Users,
    Settings,
    LayoutDashboard,
    LogOut,
    ChevronRight,
    HelpCircle,
    TrendingDown,
    X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    // Para efectos de demostración, obtenemos el rol de localStorage o por defecto 'ADMIN'
    const currentRole = localStorage.getItem('antigravity_user_role') || 'ADMIN';

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['ADMIN'] },
        { icon: ClipboardList, label: 'Reporte de Servicio', path: '/servicios', roles: ['ADMIN', 'OPERATOR', 'REPORTER'] },
        { icon: ShoppingCart, label: 'Reporte de Compras', path: '/compras', roles: ['ADMIN', 'OPERATOR', 'REPORTER'] },
        { icon: TrendingDown, label: 'Gastos', path: '/gastos', roles: ['ADMIN'] },
        { icon: ClipboardList, label: 'Órdenes', path: '/ordenes', roles: ['ADMIN', 'EXTERNAL', 'OBSERVER'] },
        { icon: Users, label: 'Equipo', path: '/equipo', roles: ['ADMIN'] },
        { icon: Settings, label: 'Configuración', path: '/configuracion', roles: ['ADMIN'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(currentRole));

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed left-0 top-0 h-screen bg-white border-r border-slate-100 flex flex-col p-6 z-50 transition-transform duration-300 lg:translate-x-0 w-72
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between mb-10 px-2 text-primary">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white rounded-full"></div>
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                            JM Agregados EIRL
                        </h1>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <nav className="flex-1 space-y-2">
                    {filteredItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => `
                  nav-link ${isActive ? 'active' : ''}
                  group flex items-center justify-between
                `}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-primary">
                                <HelpCircle size={18} />
                                <span className="font-semibold text-sm">Soporte IA</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                ¿Necesitas ayuda con el reporte de horometros?
                            </p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem('antigravity_logged_user');
                            localStorage.removeItem('antigravity_user_role');
                            window.location.reload();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                    <div className="text-center pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creado por Bryan Paz</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
