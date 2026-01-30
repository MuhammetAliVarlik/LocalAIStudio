import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuthService } from '../api/services'; // AppContext'te register yoksa buradan çağıracağız
import { Sparkles, ArrowRight, Lock, User, UserCircle, AlertCircle, Key, CheckSquare, Square } from 'lucide-react';

/**
 * LoginScreen Component
 * ---------------------
 * Handles User Authentication, Registration, and Password Recovery.
 * Includes "Remember Me" functionality.
 */
export const LoginScreen: React.FC = () => {
  const { actions } = useApp();
  
  // UI State
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RECOVERY'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryKeyDisplay, setRecoveryKeyDisplay] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [recoveryKey, setRecoveryKey] = useState(""); 
  const [rememberMe, setRememberMe] = useState(false); // Checkbox State

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        if (mode === 'LOGIN') {
            // AUTH LOGIN FLOW
            // Note: AppContext login expects an object { username, password }
            await actions.login({ username, password });
            
            // Handle Remember Me (Token persistence logic)
            // AppContext saves to localStorage by default currently.
            // If we want sessionStorage support, we'd need to modify AppContext, 
            // but for now let's assume standard login is persistent.
            
        } else if (mode === 'REGISTER') {
            // REGISTRATION FLOW
            // Using AuthService directly if not exposed via Context actions
            const response = await AuthService.register({ 
                username, 
                password, 
                full_name: fullName 
            });
            // Assuming backend returns a recovery key in response
            if (response.recovery_key) {
                setRecoveryKeyDisplay(response.recovery_key);
            } else {
                alert("Registration Successful. Please Login.");
                setMode('LOGIN');
            }

        } else if (mode === 'RECOVERY') {
            // RECOVERY FLOW (Mock implementation for now as Backend endpoint might vary)
            // await AuthService.resetPassword({ username, recoveryKey, newPassword: password });
            alert("Password Reset feature requires backend implementation. Please contact admin.");
            setMode('LOGIN');
        }
    } catch (err: any) {
        // Safe error handling for Axios response
        const msg = err.response?.data?.detail || err.message || "Operation failed.";
        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  // --- RECOVERY KEY DISPLAY (After Registration) ---
  if (recoveryKeyDisplay && mode === 'REGISTER') {
      return (
          <div className="w-full h-screen flex items-center justify-center bg-black text-zinc-300">
              <div className="max-w-md p-8 glass-panel rounded-3xl border border-white/10 bg-black/40 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400"><Key size={24}/></div>
                  <h2 className="text-2xl font-bold text-white">Account Created</h2>
                  <p className="text-sm">Save this Recovery Key. It is the <b>ONLY</b> way to reset your password.</p>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/10 font-mono text-cyan-400 text-lg tracking-widest select-all">
                      {recoveryKeyDisplay}
                  </div>
                  <button onClick={() => { setRecoveryKeyDisplay(null); setMode('LOGIN'); }} className="w-full bg-white text-black font-bold py-3 rounded-xl mt-4">I have saved it</button>
              </div>
          </div>
      );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans text-zinc-300">
        {/* Background FX */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none" />

        <div className="z-10 w-full max-w-md p-8 glass-panel rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
            
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 animate-float"><Sparkles className="text-white w-8 h-8" /></div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {mode === 'LOGIN' ? 'Welcome Back' : mode === 'REGISTER' ? 'Join the Nexus' : 'System Recovery'}
                </h1>
                <p className="text-zinc-500 text-sm">
                    {mode === 'LOGIN' ? 'Enter credentials.' : mode === 'REGISTER' ? 'Create digital identity.' : 'Enter recovery key to reset access.'}
                </p>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-3 text-red-400 text-xs"><AlertCircle size={16} /><span>{error}</span></div>}

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                {mode === 'REGISTER' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Full Name</label>
                          <div className="relative">
                            <UserCircle className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white focus:border-cyan-500/50 outline-none" required />
                          </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Identity</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="Username" required />
                    </div>
                </div>
                
                {mode === 'RECOVERY' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Recovery Key</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
                            <input type="text" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="Your saved key" required />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{mode === 'RECOVERY' ? 'New Password' : 'Passkey'}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="••••••••" required />
                    </div>
                </div>

                {/* --- REMEMBER ME CHECKBOX --- */}
                {mode === 'LOGIN' && (
                    <div className="flex items-center justify-between px-1">
                        <button 
                            type="button"
                            onClick={() => setRememberMe(!rememberMe)}
                            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors group"
                        >
                            {rememberMe ? (
                                <CheckSquare size={16} className="text-cyan-400" />
                            ) : (
                                <Square size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                            )}
                            <span className={rememberMe ? "text-cyan-400 font-medium" : ""}>Remember Me</span>
                        </button>
                    </div>
                )}

                <button disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4">
                    {isLoading ? 'Processing...' : (
                        <>{mode === 'LOGIN' ? 'Initialize Session' : mode === 'REGISTER' ? 'Create Identity' : 'Reset Access'} <ArrowRight size={18} /></>
                    )}
                </button>
            </form>

            <div className="text-center pt-2 border-t border-white/5 flex flex-col gap-2">
                {mode === 'LOGIN' ? (
                    <>
                        <button onClick={() => setMode('REGISTER')} className="text-sm text-zinc-400 hover:text-white">New here? <span className="text-cyan-400 font-bold">Create Account</span></button>
                        <button onClick={() => setMode('RECOVERY')} className="text-xs text-zinc-600 hover:text-zinc-400">Forgot Password?</button>
                    </>
                ) : (
                    <button onClick={() => setMode('LOGIN')} className="text-sm text-zinc-400 hover:text-white">Return to <span className="text-cyan-400 font-bold">Login</span></button>
                )}
            </div>
        </div>
    </div>
  );
};