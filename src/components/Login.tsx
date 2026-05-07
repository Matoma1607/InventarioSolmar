import React, { useState } from "react";
import { User, UserRole } from "../types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setError("");

    // Verify against Firestore
    try {
      const q = query(collection(db, "users"), where("username", "==", username), where("password", "==", password));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userFound = snap.docs[0].data();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userData } = userFound;
        onLogin(userData as User);
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-[var(--bg2)] border border-[var(--line2)] rounded-[var(--r3)] shadow-[0_40px_100px_rgba(0,0,0,0.6)] p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
          <div>
            <div className="font-bold text-[15px] text-[var(--txt)]">Óptica Solmar</div>
            <div className="text-[11px] text-[var(--txt3)] uppercase tracking-widest mt-0.5">
              IT Asset Manager
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-[var(--txt)] tracking-tight mb-1">Iniciar sesión</h1>
        <p className="text-[12px] text-[var(--txt3)] mb-8">Accedé con tu usuario del sistema.</p>

        {error && (
          <div className="mb-6 p-3 bg-[var(--rs)] border border-[rgba(239,68,68,0.25)] rounded-[var(--r)] text-[12px] text-[var(--red)] animate-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[var(--txt2)] pl-1">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-10 px-3.5 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[14px] text-[var(--txt)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ag)] transition-all"
              placeholder="ej: admin"
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[var(--txt2)] pl-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3.5 bg-[var(--bg3)] border border-[var(--line2)] rounded-[var(--r)] text-[14px] text-[var(--txt)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ag)] transition-all"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[var(--accent)] hover:bg-[var(--accent2)] disabled:opacity-50 text-white font-semibold rounded-[var(--r)] text-[14px] shadow-[0_8px_20px_rgba(99,102,241,0.2)] transition-all mt-4"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-8 p-4 bg-[var(--bg3)] border border-[var(--line)] rounded-[var(--r)] text-[11px] leading-relaxed">
          <div className="font-bold text-[var(--txt2)] mb-1 uppercase tracking-tight">Usuarios demo:</div>
          <div className="text-[var(--txt3)]">
            admin / admin123 <br />
            sistemas / sistemas <br />
            gabi / solmar2026 (Lectura)
          </div>
        </div>
      </div>
    </div>
  );
}
