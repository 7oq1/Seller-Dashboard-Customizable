import React, { useEffect, useState } from 'react';
import { db, Sale, Expense, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  LucideIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface StatsCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  color: string;
}

const StatsCard = ({ title, value, subValue, icon: Icon, trend, color }: StatsCardProps) => (
  <div className="glass-panel p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-mono ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend === 'up' ? '+12.5%' : '-4.2%'}
        </div>
      )}
    </div>
    <div>
      <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
      <p className="text-zinc-600 text-[10px] uppercase tracking-wider mt-1">{subValue}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('dateSoldOn', 'desc')), 
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'sales')
    );

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), 
      (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'expenses')
    );

    return () => {
      unsubSales();
      unsubExpenses();
    };
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.soldFor, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  if (loading) return <div className="animate-pulse flex space-x-4">Loading stats...</div>;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Gross Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          subValue={`${sales.length} successful transactions`}
          icon={DollarSign}
          color="blue"
        />
        <StatsCard 
          title="Total Spendings" 
          value={`$${totalExpenses.toLocaleString()}`} 
          subValue={`${expenses.length} operating costs`}
          icon={TrendingDown}
          color="red"
        />
        <StatsCard 
          title="Net Profit" 
          value={`$${totalProfit.toLocaleString()}`} 
          subValue="Calculated from all data points"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard 
          title="Active Customers" 
          value={`${new Set(sales.map(s => s.soldTo)).size}`} 
          subValue="Unique client identifiers"
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Latest Provisioning
            </h3>
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Server</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="technical-table-row">
                      <td className="p-4">
                        <p className="font-bold">{sale.customerName}</p>
                        <p className="text-[10px] text-zinc-500 mono">{sale.soldTo}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-zinc-300 truncate max-w-[200px]">{sale.serverSpecs}</p>
                      </td>
                      <td className="p-4 font-mono text-green-500">${sale.soldFor}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-mono border border-green-500/20 rounded">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500 font-mono italic">No transaction data logged</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expense Categories or Mini Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Expense Breakdown</h3>
          <div className="glass-panel p-6 space-y-6">
            {expenses.length === 0 ? (
              <p className="text-zinc-500 italic font-mono text-xs">Waiting for data...</p>
            ) : (
              ['Infrastructure', 'Marketing', 'Wages', 'Legal', 'Other'].map(cat => {
                const total = expenses.filter(e => e.category === cat).reduce((a, b) => a + b.amount, 0);
                const perc = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-xs font-mono uppercase tracking-widest">
                      <span className="text-zinc-400">{cat}</span>
                      <span className="text-zinc-200">${total.toLocaleString()}</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${perc}%` }}
                        className="h-full bg-blue-500/50" 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
