import { useState, useEffect } from 'react';
import { Shield, User, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface LoginProps {
    onLogin: (userData: { name: string; role: string }) => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Precargar usuarios de supabase al montar el login para asegurar sincronización
        const syncUsers = async () => {
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                try {
                    const { data, error } = await supabase.from('users').select('*');
                    if (data && !error) {
                        localStorage.setItem('antigravity_users_list', JSON.stringify(data));
                    }
                } catch (err) {
                    console.error("Login Pre-sync error:", err);
                }
            }
        };
        syncUsers();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Intentar primero con Supabase si está configurado
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
            try {
                const { data: dbUsers, error: dbError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', username.trim().toLowerCase())
                    .eq('password', password.trim())
                    .single();

                if (dbUsers && !dbError) {
                    localStorage.setItem('antigravity_logged_user', JSON.stringify(dbUsers));
                    localStorage.setItem('antigravity_user_role', dbUsers.role);
                    onLogin({ name: dbUsers.name, role: dbUsers.role });
                    return;
                }
            } catch (err) {
                console.error("Supabase Login Error:", err);
            }
        }

        const savedUsers = localStorage.getItem('antigravity_users_list');
        const defaultUsers = [
            { id: '1', name: 'Bryan Portilla', username: 'bryanp', password: 'idancelord', role: 'ADMIN' },
            { id: '2', name: 'Juan Operador', username: 'operador', password: '123', role: 'OPERATOR' },
            { id: '3', name: 'Maria Reportes', username: 'reporter', password: '123', role: 'REPORTER' },
        ];

        let users = defaultUsers;
        if (savedUsers) {
            try {
                const parsed = JSON.parse(savedUsers);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    users = parsed;
                }
            } catch (err) {
                console.error("Error parsing users", err);
            }
        }

        const user = users.find((u: any) =>
            String(u.username || '').toLowerCase().trim() === username.toLowerCase().trim() &&
            String(u.password || '').trim() === password.trim()
        );

        if (user) {
            localStorage.setItem('antigravity_logged_user', JSON.stringify(user));
            localStorage.setItem('antigravity_user_role', user.role);
            onLogin({ name: user.name, role: user.role });
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -ml-64 -mb-64"></div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30 rotate-3">
                        <Shield size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">JM Agregados EIRL</h1>
                    <p className="text-slate-500 font-medium mt-2 uppercase tracking-widest text-[10px]">Gestión de Operaciones Premium</p>
                </div>

                <div className="premium-card p-10 space-y-8 bg-white/80 backdrop-blur-xl border-white shadow-2xl shadow-slate-200">
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-slate-800">Bienvenido de nuevo</h2>
                        <p className="text-sm text-slate-500 mt-1">Ingrese sus credenciales para acceder</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Usuario</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 transition-all font-bold text-slate-800 outline-none"
                                    placeholder="Nombre de usuario"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 transition-all font-bold text-slate-800 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 animate-shake">
                                <Shield size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 group"
                        >
                            <span className="font-black uppercase tracking-widest">Entrar al Sistema</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Servidor Estable y Protegido
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 font-bold text-xs">
                        Creado por <span className="text-slate-800">Bryan Paz</span>
                    </p>
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">v 2.1.0 • Antigravity OS</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
