import { FileText, Clock, CheckCircle2, Send } from 'lucide-react';
import { mockFaturas } from '@/lib/mock-data';
import { FaturaStatus } from '@/lib/types';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Pendentes', status: 'PENDENTE_GESTOR' as FaturaStatus, icon: Clock, colorClass: 'bg-warning/10 text-warning' },
  { label: 'Aprovadas Gestor', status: 'APROVADA_GESTOR' as FaturaStatus, icon: FileText, colorClass: 'bg-info/10 text-info' },
  { label: 'Aprovadas Controladoria', status: 'APROVADA_CONTROLADORIA' as FaturaStatus, icon: CheckCircle2, colorClass: 'bg-success/10 text-success' },
  { label: 'Enviadas p/ Pagamento', status: 'ENVIADA_PAGAMENTO' as FaturaStatus, icon: Send, colorClass: 'bg-primary/10 text-primary' },
];

export default function Dashboard() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral das faturas</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const count = mockFaturas.filter((f) => f.status === s.status).length;
          const total = mockFaturas
            .filter((f) => f.status === s.status)
            .reduce((acc, f) => acc + f.valor_total, 0);
          return (
            <Link
              to="/faturas"
              key={s.status}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                <div className={`rounded-lg p-2 ${s.colorClass}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
