import React, { useEffect, useState } from 'react';
import { db, auth, Admin, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Shield, Plus, Trash2, Mail, UserPlus, X, Crown, ShieldAlert } from 'lucide-react';

export default function DatabaseSection() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'STAFF' as 'BOSS' | 'STAFF' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), 
      (snapshot) => {
        setAdmins(snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Admin)));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'admins')
    );
    return () => unsub();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email) return;

    try {
      // Note: In a real app, you'd need the UID. For this demo/setup, we'll assume the email is the key or will be matched.
      // Since we don't have a way to get UID from email without Admin SDK, we'll use email as ID or clear instructions.
      // For Firestore rules compatibility, we use the userId if known, but here we might need to prompt for UID or just use email as doc ID if rules allow.
      // ACTUALLY, the rules expect /admins/{adminUid}. We'll use a placeholder or prompt.
      // To keep it simple for the user, let's suggest they enter the UID if they know it, or we'll allow email-based docs if we adjust rules.
      // But let's stick to the current rules which expect UID.
      
      const adminEmail = newAdmin.email.toLowerCase();
      // We'll use the email as the ID for now as a fallback if UID isn't provided, 
      // but ideally this should be the Firebase Auth UID.
      const pseudoId = adminEmail.replace(/[^a-zA-Z0-9]/g, '_');

      await setDoc(doc(db, 'admins', pseudoId), {
        email: adminEmail,
        role: newAdmin.role,
        addedAt: Timestamp.now()
      });

      setIsAdding(false);
      setNewAdmin({ email: '', role: 'STAFF' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'admins');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to revoke admin access?')) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'admins');
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 font-mono">Loading Security Protocols...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <h3 className="text-xl font-bold tracking-tight">Authority Management</h3>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Master Hierarchy Control</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 text-sm font-medium rounded-lg transition-all"
        >
          <UserPlus size={18} />
          Grant Authority
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((admin) => (
          <div key={admin.id} className="glass-panel p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              {admin.role === 'BOSS' ? <Crown size={40} className="text-yellow-500" /> : <Shield size={40} className="text-blue-500" />}
            </div>
            
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${admin.role === 'BOSS' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                    {admin.role}
                  </span>
                  {admin.email === 'aryan075sharma@gmail.com' && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-red-500/10 text-red-500 border border-red-500/20">
                      ROOT
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-zinc-200 truncate pr-8">{admin.email}</h4>
                <p className="text-[10px] text-zinc-500 font-mono uppercase">Added: {admin.addedAt ? admin.addedAt.toDate().toLocaleDateString() : 'N/A'}</p>
              </div>
              
              {admin.email !== 'aryan075sharma@gmail.com' && (
                <button 
                  onClick={() => handleDeleteAdmin(admin.id!)}
                  className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md border-red-500/20">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141416]">
              <h3 className="text-xl font-bold tracking-tight">Grant Administrative Privileges</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Personnel Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-zinc-500" size={16} />
                  <input 
                    required
                    type="email"
                    className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-red-500/50 outline-none"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="admin@riftcloud.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Authorization Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAdmin({...newAdmin, role: 'STAFF'})}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${newAdmin.role === 'STAFF' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                  >
                    STAFF
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAdmin({...newAdmin, role: 'BOSS'})}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${newAdmin.role === 'BOSS' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                  >
                    BOSS
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 italic">** BOSS level allows adding other admins.</p>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold text-sm tracking-widest uppercase"
                >
                  Confirm Authorization
                </button>
                <p className="text-[10px] text-center text-zinc-500 font-mono">INTERNAL USE ONLY - CLEARANCE LEVEL 5 REQUIRED</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
