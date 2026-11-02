import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CandidateRanking } from '../../types';
import { useThemeStore } from '../../stores/themeStore';

interface VoteShareDonutProps {
  rankings: CandidateRanking[];
}

export const VoteShareDonut: React.FC<VoteShareDonutProps> = ({ rankings }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const COLORS = [
    '#F5C451',
    '#94A3B8',
    '#CD7F32',
    '#3B82F6',
    '#8B5CF6',
    '#10B981',
    '#EC4899',
    '#06B6D4',
    '#F97316',
    '#64748B',
  ];

  const chartData = rankings.map((r, i) => ({
    name: `No.${r.candidateNumber} ${r.nickname}`,
    value: r.votes,
    percentage: r.percentage,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
          Pangsa Suara (% Vote Share)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Proporsi persentase suara kandidat dari total suara sah
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0B1630' : '#FFFFFF',
                borderColor: isDark ? '#1E3E6E' : '#E2E8F0',
                borderRadius: '12px',
                color: isDark ? '#FFFFFF' : '#0F172A',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
              formatter={(val: any, name: any, item: any) => [
                `${val} suara (${item.payload.percentage}%)`,
                name,
              ]}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                fontSize: '10px',
                paddingTop: '8px',
                maxHeight: '60px',
                overflowY: 'auto',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
