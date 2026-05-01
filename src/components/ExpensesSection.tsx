import React, { useEffect, useState } from 'react';
import { db, auth, Expense, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Plus, Search, Calendar, DollarSign, Tag, FileText, X, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export default function ExpensesSection() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Infrastructure'
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), 
      (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Expense)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'expenses')
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'expenses'), {
        ...formData,
        amount: parseFloat(formData.amount),
        date: Timestamp.fromDate(new Date(formData.date)),
        createdAt: Timestamp.now()
      });
      setIsAdding(false);
      setFormData({
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: 'Infrastructure'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenseAmount = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          Log New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Costs</p>
            <h4 className="text-xl font-bold text-red-400">${totalExpenseAmount.toLocaleString()}</h4>
          </div>
          <TrendingDown className="text-red-500/50" size={24} />
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141416]">
              <h3 className="text-xl font-bold tracking-tight">Log Operating Expense</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-zinc-500" size={16} />
                  <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-zinc-500" size={16} />
                  <input 
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g. Server hosting fees - April"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <select 
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Wages">Wages</option>
                      <option value="Legal">Legal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-zinc-500" size={16} />
                    <input 
                      required
                      type="date"
                      className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold text-sm"
                >
                  Log Spending
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

      {/* Expenses Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              <tr>
                <th className="p-4">Description</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="technical-table-row">
                  <td className="p-4 font-medium text-zinc-100">{exp.description}</td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 bg-white/5 uppercase tracking-widest font-mono text-zinc-400">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-500 font-mono underline decoration-white/5">
                    {format((exp.date as any).toDate?.() || new Date(exp.date as any), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-right font-mono text-red-400">-${exp.amount.toLocaleString()}</td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-zinc-500 font-mono italic">No spending records recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
