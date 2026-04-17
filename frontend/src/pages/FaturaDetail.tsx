import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, CheckCircle2, PenTool } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type StatusFatura =
  | "PENDENTE_GESTOR"
  | "APROVADA_GESTOR"
  | "APROVADA_CONTROLADORIA"
  | "ENVIADA_PAGAMENTO";

type FaturaApi = {
  ID: string;
  NumeroVinculo: string;
  ValorTotal: number;
  DataVencimento: string;
  Status: StatusFatura;
  CaminhoArquivo: string | null;
  // quando sua API devolver mais campos, você pode ir adicionando aqui
};

export default function FaturaDetail() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    data: fatura,
    isLoading,
    isError,
  } = useQuery<FaturaApi>({
    queryKey: ["fatura", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`http://localhost:8080/faturas/${id}`);
      if (!res.ok) {
        throw new Error("Erro ao buscar fatura");
      }
      return res.json();
    },
  });
  const atualizarStatus = useMutation({
    mutationFn: async (novoStatus: string) => {
      const res = await fetch(`http://localhost:8080/faturas/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) {
        // Se a API retornar erro (como o nosso 400 de transição inválida), extraímos a mensagem
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao atualizar status");
      }
      return res.json();
    },
    onSuccess: () => {
      // Se der certo, avisa o React Query para buscar os dados da fatura novamente e atualizar a tela sozinho!
      queryClient.invalidateQueries({ queryKey: ["fatura", id] });
      toast({
        title: "Sucesso!",
        description: "O status da fatura foi atualizado.",
      });
    },
    onError: (error) => {
      // Se der erro (ex: Transição Inválida), mostra na tela vermelha
      toast({
        title: "Operação bloqueada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium">Carregando fatura...</p>
      </div>
    );
  }

  if (isError || !fatura) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium">Fatura não encontrada</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/faturas")}
        >
          Voltar
        </Button>
      </div>
    );
  }

  const canSign = fatura.Status === "PENDENTE_GESTOR";
  const canApprove = fatura.Status === "APROVADA_GESTOR";

  const fields = [
    { label: "Número do Vínculo", value: fatura.NumeroVinculo },
    {
      label: "Valor Total",
      value: fatura.ValorTotal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    },
    {
      label: "Data de Vencimento",
      value: new Date(fatura.DataVencimento).toLocaleDateString("pt-BR"),
    },
    { label: "Status", value: fatura.Status },
  ];

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate("/faturas")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para faturas
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {fatura.NumeroVinculo}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detalhes da fatura
          </p>
        </div>
        <StatusBadge status={fatura.Status} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">
          Detalhes da Fatura
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {f.label}
              </dt>
              <dd className="mt-1 font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Por enquanto mantemos os botões só com toast; depois viram chamadas PATCH reais */}
      {(canSign || canApprove) && (
        <div className="flex gap-3">
          {canSign && (
            <Button
              className="gap-2"
              onClick={() => atualizarStatus.mutate("APROVADA_GESTOR")}
            >
              <PenTool className="h-4 w-4" />
              Assinar como Gestor
            </Button>
          )}
          {canApprove && (
            <Button
              className="gap-2"
              onClick={() => atualizarStatus.mutate("APROVADA_CONTROLADORIA")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprovar Controladoria
            </Button>
          )}
        </div>
      )}
      {/* Visualizador de PDF */}
      {fatura.CaminhoArquivo ? (
        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden h-[600px]">
          <iframe
            src={`http://localhost:8080/${fatura.CaminhoArquivo}`}
            className="w-full h-full border-0"
            title="Visualização da Fatura"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 opacity-60">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Nenhum arquivo anexado</p>
            <p className="text-xs text-muted-foreground">
              Esta fatura ainda não possui um documento PDF.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
