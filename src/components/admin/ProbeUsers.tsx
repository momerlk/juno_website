import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, TrendingUp } from 'lucide-react';

const ProbeUsers: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">User Growth</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-1">Acquisition & Retention Insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '18,420', icon: Users, color: 'text-blue-400' },
          { label: 'New Today', value: '+142', icon: UserPlus, color: 'text-green-400' },
          { label: 'Active (MAU)', value: '8,240', icon: UserCheck, color: 'text-primary' },
          { label: 'Growth Rate', value: '12%', icon: TrendingUp, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-5 border-white/5 bg-white/[0.02]">
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 border-white/5 bg-white/[0.02] min-h-[400px]">
        <h3 className="text-lg font-bold text-white mb-6">Retention Cohorts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10px] uppercase tracking-widest">
            <thead>
              <tr className="border-b border-white/5 text-white/40">
                <th className="py-4 font-normal">Cohort</th>
                <th className="py-4 font-normal">Size</th>
                <th className="py-4 font-normal">W1</th>
                <th className="py-4 font-normal">W2</th>
                <th className="py-4 font-normal">W3</th>
                <th className="py-4 font-normal">W4</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {[
                { date: 'Mar 20', size: '1,200', w1: '42%', w2: '30%', w3: '22%', w4: '18%' },
                { date: 'Mar 27', size: '1,450', w1: '45%', w2: '32%', w3: '24%', w4: '-' },
                { date: 'Apr 03', size: '1,120', w1: '40%', w2: '28%', w3: '-', w4: '-' },
                { date: 'Apr 10', size: '1,680', w1: '48%', w2: '-', w3: '-', w4: '-' },
              ].map((row) => (
                <tr key={row.date} className="border-b border-white/5">
                  <td className="py-4 text-white font-bold">{row.date}</td>
                  <td className="py-4">{row.size}</td>
                  <td className="py-4 bg-primary/20 text-primary">{row.w1}</td>
                  <td className="py-4 bg-primary/15 text-primary/80">{row.w2}</td>
                  <td className="py-4 bg-primary/10 text-primary/60">{row.w3}</td>
                  <td className="py-4 bg-primary/5 text-primary/40">{row.w4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProbeUsers;
