import { Link } from "react-router-dom";
import { Eye, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Tipo que reflete o que o nosso backend Go (Struct) devolve
type Fatura = {
  ID: string;
  NumeroVinculo: string;
  ValorTotal: number;
  DataVencimento: string;
  Status: any;
  CaminhoArquivo: string | null;
  GestorID: string | null;
};

export default function FaturasList() {
  const { user } = useAuth(); // 1. Pegamos o utilizador logado!

  // 2. Trocamos o mock pelo nosso Backend Real
  const {
    data: faturas,
    isLoading,
    isError,
  } = useQuery<Fatura[]>({
    queryKey: ["faturas", user?.id], // A chave atualiza caso troquemos de usuário
    queryFn: async () => {
      // Monta a URL dependendo do cargo da pessoa logada
      let url = "http://localhost:8080/faturas";
      if (user?.cargo === "GESTOR") {
        url += `?gestor_id=${user.id}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar faturas");
      return res.json();
    },
  });

  // 3. A Lógica de Filtro (RBAC) na interface:
  // Se for GESTOR, filtra apenas as que têm o ID dele. Se for CONTROLADORIA/ADMIN, mostra todas.
  const faturasFiltradas =
    faturas?.filter((f) => {
      if (user?.cargo === "GESTOR") {
        return f.GestorID === user.id;
      }
      return true;
    }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 py-10">
        Erro ao carregar as faturas. O backend está a correr?
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Faturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {faturasFiltradas.length} faturas encontradas
          </p>
        </div>

        {/* REGRAS DE NEGÓCIO: O botão só aparece para o GESTOR */}
        {user?.cargo === "GESTOR" && (
          <Link to="/faturas/nova">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nova Fatura
            </Button>
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Vínculo
                </th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                  Valor
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {faturasFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              )}
              {faturasFiltradas.map((f) => (
                <tr
                  key={f.ID}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{f.NumeroVinculo}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {f.ValorTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(f.DataVencimento).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.Status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/faturas/${f.ID}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
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
