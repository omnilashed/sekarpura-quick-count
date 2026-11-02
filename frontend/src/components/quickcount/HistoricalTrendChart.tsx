import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { QuickCountData } from '../../types';
import { useThemeStore } from '../../stores/themeStore';

interface HistoricalTrendChartProps {
  timeline: QuickCountData['timeline'];
  top5: QuickCountData['top5'];
}

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({ timeline, top5 }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  if (!timeline || timeline.length === 0) {
    return null;
  }

  const COLORS = ['#F5C451', '#94A3B8', '#CD7F32', '#3B82F6', '#8B5CF6'];

  const chartData = timeline.map((entry) => {
    const timeStr = new Date(entry.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const point: any = {
      name: `${entry.sourceCode}\n${timeStr}`,
      sourceCode: entry.sourceCode,
      time: timeStr,
      total: entry.totalVotes,
    };

    top5.forEach((c) => {
      point[c.nickname] = entry[c.candidateId] || 0;
    });

    return point;
  });

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
          Tren Akumulasi Suara Masuk
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Perkembangan perolehan suara Top 5 kandidat per urutan rekapitulasi TPS
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full overflow-x-auto">
        <div className="min-w-[280px] xs:min-w-[340px] h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 15 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#1E293B' : '#E2E8F0'}
                vertical={false}
              />
              <XAxis
                dataKey="sourceCode"
                stroke={isDark ? '#94A3B8' : '#64748B'}
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke={isDark ? '#94A3B8' : '#64748B'}
                fontSize={10}
                allowDecimals={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0B1630' : '#FFFFFF',
                  borderColor: isDark ? '#1E3E6E' : '#E2E8F0',
                  borderRadius: '12px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '10px', paddingBottom: '8px' }}
              />
              {top5.map((c, i) => (
                <Line
                  key={c.candidateId}
                  type="monotone"
                  dataKey={c.nickname}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
