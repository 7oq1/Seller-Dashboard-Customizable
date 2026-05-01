import React, { useEffect, useState } from 'react';
import { db, auth, Sale, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Plus, Search, Calendar, DollarSign, User, Link as LinkIcon, Server, ShieldCheck, X } from 'lucide-react';
import { format } from 'date-fns';

export default function SalesSection() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    soldFor: '',
    soldTo: '',
    serverLink: '',
    customerName: '',
    dateSoldOn: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: '',
    assignedBy: auth.currentUser?.displayName || auth.currentUser?.email || '',
    serverSpecs: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'sales'), orderBy('dateSoldOn', 'desc')), 
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Sale)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'sales')
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'sales'), {
        ...formData,
        soldFor: parseFloat(formData.soldFor),
        dateSoldOn: Timestamp.fromDate(new Date(formData.dateSoldOn)),
        expiryDate: Timestamp.fromDate(new Date(formData.expiryDate)),
        createdAt: Timestamp.now()
      });
      setIsAdding(false);
      setFormData({
        soldFor: '',
        soldTo: '',
        serverLink: '',
        customerName: '',
        dateSoldOn: format(new Date(), 'yyyy-MM-dd'),
        expiryDate: '',
        assignedBy: auth.currentUser?.displayName || auth.currentUser?.email || '',
        serverSpecs: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    }
  };

  const filteredSales = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.soldTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search records by customer or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          Provision New Server
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#141416] z-10">
              <h3 className="text-xl font-bold tracking-tight">Add New Sale Record</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Customer Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <input 
                      required
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                      value={formData.customerName}
                      onChange={e => setFormData({...formData, customerName: e.target.value})}
                      placeholder="Full Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Sold To (Identifier)</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <input 
                      required
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                      value={formData.soldTo}
                      onChange={e => setFormData({...formData, soldTo: e.target.value})}
                      placeholder="Email or Discord ID"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Sale Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                      value={formData.soldFor}
                      onChange={e => setFormData({...formData, soldFor: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Server Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <input 
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                      value={formData.serverLink}
                      onChange={e => setFormData({...formData, serverLink: e.target.value})}
                      placeholder="https://console.riftcloud.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Date Sold On</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <input 
                      required
                      type="date"
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                      value={formData.dateSoldOn}
                      onChange={e => setFormData({...formData, dateSoldOn: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Expiry Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <input 
                      required
                      type="date"
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                      value={formData.expiryDate}
                      onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Server Specifications</label>
                <div className="relative">
                  <Server className="absolute left-3 top-3 text-zinc-500" size={16} />
                  <textarea 
                    rows={3}
                    className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none resize-none"
                    value={formData.serverSpecs}
                    onChange={e => setFormData({...formData, serverSpecs: e.target.value})}
                    placeholder="e.g. 8GB RAM, 4 vCPU, 100GB NVMe"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold text-sm"
                >
                  Confirm Provisioning
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 border border-white/10 hover:bg-white/5 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              <tr>
                <th className="p-4">Crediting Details</th>
                <th className="p-4">Server Context</th>
                <th className="p-4">Timeline</th>
                <th className="p-4">Pricing</th>
                <th className="p-4">Assigned By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="technical-table-row">
                  <td className="p-4">
                    <p className="font-bold text-zinc-100">{sale.customerName}</p>
                    <p className="text-[10px] text-zinc-500 mono">{sale.soldTo}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-zinc-300 mb-1">{sale.serverSpecs}</p>
                    {sale.serverLink && (
                      <a 
                        href={sale.serverLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <LinkIcon size={10} /> Access Console
                      </a>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Sold: {format((sale.dateSoldOn as any).toDate?.() || new Date(sale.dateSoldOn as any), 'MMM d, yyyy')}</p>
                    <p className="text-[10px] text-red-400 uppercase tracking-tighter">Expires: {format((sale.expiryDate as any).toDate?.() || new Date(sale.expiryDate as any), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400">${sale.soldFor}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-400/10 text-blue-400 border border-blue-400/20 rounded">PAID</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-xs italic text-zinc-400">{sale.assignedBy}</p>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500 font-mono italic">No sale records match your criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
