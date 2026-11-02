import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Filter, Clock } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { VoteAuditLog } from '../../types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<VoteAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await settingsService.getAuditLogs({
        entityType: entityFilter || undefined,
        limit: 100,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">
            Audit Trail & Catatan Integritas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rekam jejak digital yang tidak dapat diubah (immutable log) dari seluruh tindakan perubahan data dan suara
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs font-bold"
        >
          <option value="">Semua Tindakan & Entitas</option>
          <option value="VoteSubmission">Perolehan Suara (VoteSubmission)</option>
          <option value="Candidate">Kandidat (Candidate)</option>
          <option value="ElectionStage">Tahapan Pemilihan (ElectionStage)</option>
          <option value="SystemSettings">Pengaturan Sistem (SystemSettings)</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-navy-950/40">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Aktor / Petugas</th>
                <th className="py-3 px-4">Tindakan / Event</th>
                <th className="py-3 px-4">Entitas Terkait</th>
                <th className="py-3 px-4">Alasan Perubahan (Audit Reason)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-medium">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <p className="font-bold text-navy-900 dark:text-white">{log.actorName}</p>
                    <p className="text-[10px] text-gold-500 font-semibold">{log.actorRole}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-electric-500/10 text-electric-600 dark:text-electric-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                    {log.entityType} ({log.entityId.slice(-6)})
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 italic">
                    "{log.reason}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
