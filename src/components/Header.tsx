import { Search, Bell, Mail, ChevronDown, Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const loggedUserStr = localStorage.getItem('antigravity_logged_user');
    const loggedUser = loggedUserStr ? JSON.parse(loggedUserStr) : null;

    return (
        <header className="h-20 flex items-center justify-between px-4 lg:px-8 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-2 lg:hidden hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <Menu size={24} className="text-slate-600" />
                </button>

                <div className="hidden md:block flex-1 max-w-xl">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar ordenes, facturas, personal..."
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-100/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative">
                        <Mail size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
                    </button>
                    <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-slate-200"></div>

                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right">
                        <h3 className="text-sm font-bold text-slate-800">
                            {loggedUser?.name || 'Administrador'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            {loggedUser?.role === 'ADMIN' ? 'Administrador' :
                                loggedUser?.role === 'EXTERNAL' ? 'Cliente Externo' :
                                    loggedUser?.role === 'OPERATOR' ? 'Operador' : 'Reportador'}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-light p-[2px]">
                        <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${loggedUser?.name || 'Bryan'}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <ChevronDown size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                </div>
            </div>
        </header>
    );
};

export default Header;
