import { Link } from 'react-router-dom';
import { Eye, Trash2, PlusCircle } from 'lucide-react';
import { mockFaturas } from '@/lib/mock-data';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

export default function FaturasList() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Faturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mockFaturas.length} faturas registradas</p>
        </div>
        <Link to="/faturas/nova">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Fatura
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Vínculo</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Centro Custo</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Vencimento</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockFaturas.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{f.numero_vinculo}</p>
                    <p className="text-xs text-muted-foreground">{f.tipo_vinculo}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{f.centro_custo}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {f.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/faturas/${f.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
