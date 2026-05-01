/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingDown, 
  LogOut, 
  Cloud, 
  AlertCircle,
  Menu,
  X,
  Server,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import SalesSection from './components/SalesSection';
import ExpensesSection from './components/ExpensesSection';
import DatabaseSection from './components/DatabaseSection';

type Page = 'dashboard' | 'sales' | 'expenses' | 'database';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isBoss, setIsBoss] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Special case for the bootstrapped admin
        if (user.email === 'aryan075sharma@gmail.com') {
          setIsAdmin(true);
          setIsBoss(true);
        } else {
          try {
            // Find admin by UID or by email transformation (matching how we save them)
            const pseudoId = user.email?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') || user.uid;
            const adminDoc = await getDoc(doc(db, 'admins', pseudoId));
            
            if (adminDoc.exists()) {
              const data = adminDoc.data();
              setIsAdmin(true);
              setIsBoss(data.role === 'BOSS');
            } else {
              // Fallback check by UID directly in case it was added manually in console
              const uidDoc = await getDoc(doc(db, 'admins', user.uid));
              if (uidDoc.exists()) {
                const data = uidDoc.data();
                setIsAdmin(true);
                setIsBoss(data.role === 'BOSS');
              } else {
                setIsAdmin(false);
                setIsBoss(false);
              }
            }
          } catch (e) {
            setIsAdmin(false);
            setIsBoss(false);
          }
        }
      } else {
        setIsAdmin(null);
        setIsBoss(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="flex flex-col items-center gap-4">
          <Cloud className="w-12 h-12 text-blue-500 animate-pulse" />
          <p className="text-sm font-mono tracking-widest text-blue-500">INITIALIZING SYSTEMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] grid-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0B]/80 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-8 glass-panel max-w-md w-full text-center space-y-8 backdrop-blur-sm"
        >
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Cloud className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter">RIFTCLOUD</h1>
            <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Admin Control Terminal</p>
          </div>
          
          <button
            onClick={() => loginWithGoogle()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            Authenticate with Google
          </button>
          
          <p className="text-xs text-zinc-600">
            Access restricted to authorized Riftcloud personnel only.
          </p>
        </motion.div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="p-8 glass-panel max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-zinc-400">Your account ({user.email}) is not authorized to access this terminal.</p>
          <button
            onClick={() => logout()}
            className="px-6 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'sales': return <SalesSection />;
      case 'expenses': return <ExpensesSection />;
      case 'database': return <DatabaseSection />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col md:flex-row font-sans">
      {/* Sidebar Mobile Toggle */}
      <div className="md:hidden p-4 flex justify-between items-center border-b border-white/5 bg-[#141416]">
        <div className="flex items-center gap-2">
          <Cloud className="w-6 h-6 text-blue-500" />
          <span className="font-bold tracking-tighter">RIFTCLOUD</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <nav className={`
        fixed md:relative z-40 w-64 h-full min-h-screen bg-[#141416] border-r border-white/5 
        transition-transform duration-300 md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <Cloud className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold tracking-tighter">RIFTCLOUD</h1>
        </div>

        <div className="px-4 py-8 space-y-2">
          <p className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">Operations</p>
          
          <button 
            onClick={() => { setCurrentPage('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'dashboard' ? 'bg-blue-500/10 text-blue-500' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          <button 
            onClick={() => { setCurrentPage('sales'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'sales' ? 'bg-blue-500/10 text-blue-500' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <Server size={20} />
            <span className="text-sm font-medium">Sales & Provisioning</span>
          </button>

          <button 
            onClick={() => { setCurrentPage('expenses'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'expenses' ? 'bg-blue-500/10 text-blue-500' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <TrendingDown size={20} />
            <span className="text-sm font-medium">Spendings</span>
          </button>

          {isBoss && (
            <button 
              onClick={() => { setCurrentPage('database'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'database' ? 'bg-red-500/10 text-red-500 font-bold' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <ShieldCheck size={20} />
              <span className="text-sm font-medium">Authority</span>
            </button>
          )}
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-4 mb-2">
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <div className="text-xs uppercase">{user.email?.[0]}</div>}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user.displayName || 'Admin'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Terminate Session</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto bg-[#0A0A0B] grid-bg">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.3em] mb-1">System Module</p>
                  <h2 className="text-4xl font-bold tracking-tighter capitalize">{currentPage}</h2>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Network Status</p>
                  <p className="text-xs font-mono text-green-500 flex items-center gap-2 justify-end">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    ENCRYPTED_CONNECTION
                  </p>
                </div>
              </div>
              
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
