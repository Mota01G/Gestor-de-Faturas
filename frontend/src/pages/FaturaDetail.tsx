import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Loader2, ArrowLeft, CheckCircle, FileText } from "lucide-react";
import { Fatura } from "@/lib/types"; // Importando a nossa interface oficial

export default function FaturaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: fatura,
    isLoading,
    isError,
  } = useQuery<Fatura>({
    queryKey: ["fatura", id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/faturas/${id}`);
      if (!res.ok) throw new Error("Erro ao procurar fatura");
      return res.json();
    },
  });

  const aprovarMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/faturas/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APROVADA_GESTOR" }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao atualizar status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fatura", id] });
      toast({
        title: "Sucesso",
        description: "Fatura assinada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ação negada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !fatura) {
    return (
      <div className="text-center py-12 text-red-500">
        Não foi possível carregar os detalhes desta fatura.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho de Navegação */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/faturas")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Fatura #{fatura.numero_vinculo}
          </h1>
          <p className="text-sm text-muted-foreground">
            ID Interno: {fatura.id}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={fatura.status} />

          {/* Regra de Negócio: Apenas o Gestor assina se estiver pendente */}
          {user?.cargo === "GESTOR" && fatura.status === "PENDENTE_GESTOR" && (
            <Button
              onClick={() => aprovarMutation.mutate()}
              disabled={aprovarMutation.isPending}
              className="gap-2"
            >
              {aprovarMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Assinar como Gestor
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Painel de Informações Financeiras */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">
              Valor Total
            </h3>
            <p className="text-2xl font-bold text-primary">
              {fatura.valor_total?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">
              Data de Vencimento
            </h3>
            <p className="font-medium">
              {fatura.data_vencimento
                ? new Date(fatura.data_vencimento).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })
                : "N/D"}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">
              Centro de Custo
            </h3>
            <p className="font-medium">
              {fatura.centro_custo || "Não informado"}
            </p>
          </div>
        </div>

        {/* Visualização do Documento (PDF/Imagem) */}
        <div className="md:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="border-b px-4 py-3 bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold">Documento Digitalizado</h3>
          </div>
          <div className="flex-1 bg-muted/10 min-h-[500px] flex items-center justify-center p-4">
            {fatura.caminho_arquivo ? (
              <iframe
                src={`${import.meta.env.VITE_API_URL}/${fatura.caminho_arquivo}`}
                className="w-full h-[600px] rounded border bg-white"
                title="Visualização da Fatura"
              />
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center">
                <FileText className="h-12 w-12 mb-3 opacity-20" />
                <p>Nenhum arquivo anexado a esta fatura.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
