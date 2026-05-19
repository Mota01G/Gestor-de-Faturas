import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, CheckCircle2, Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface Fornecedor {
  id: string;
  nome: string;
  centro_custo: string;
}

export default function FaturaCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [tipoVinculo, setTipoVinculo] = useState("");
  const [centroCusto, setCentroCusto] = useState(user?.centro_custo || "");
  const [fornecedorId, setFornecedorId] = useState("");
  const [possuiAdiantamento, setPossuiAdiantamento] = useState(false);

  // Simulação de dados (Substituir por fetch real posteriormente)
  const fornecedoresMock: Fornecedor[] = [
    { id: "1", nome: "Amazon AWS", centro_custo: "Produção" },
    { id: "2", nome: "Google Cloud", centro_custo: "Produção" },
    { id: "3", nome: "Agência Criativa", centro_custo: "Marketing" },
    { id: "4", nome: "Papelaria Central", centro_custo: "Financeiro" },
  ];

  const fornecedoresFiltrados =
    user?.cargo === "Controladoria"
      ? fornecedoresMock
      : fornecedoresMock.filter((f) => f.centro_custo === user?.centro_custo);

  const criarFatura = useMutation({
    mutationFn: async ({
      dados,
      arquivo,
    }: {
      dados: Record<string, unknown>;
      arquivo: File | null;
    }) => {
      const resFatura = await fetch(`${import.meta.env.VITE_API_URL}/faturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resFatura.ok) throw new Error("Erro ao criar os dados da fatura");

      const faturaCriada = await resFatura.json();
      const faturaId = faturaCriada.id || faturaCriada.ID;

      if (arquivo && faturaId) {
        const formData = new FormData();
        formData.append("file", arquivo);
        await fetch(
          `${import.meta.env.VITE_API_URL}/faturas/${faturaId}/upload`,
          {
            method: "POST",
            body: formData,
          },
        );
      }

      return faturaId;
    },
    onSuccess: (idCriado) => {
      toast({
        title: "Sucesso!",
        description: "Operação realizada com sucesso.",
      });
      navigate(`/faturas/${idCriado}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na operação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = (statusFinal: string) => {
    const form = document.querySelector("form") as HTMLFormElement;
    if (
      !form.reportValidity() ||
      !tipoVinculo ||
      !centroCusto ||
      !fornecedorId
    ) {
      toast({
        title: "Campos obrigatórios",
        description:
          "Por favor, preencha todos os campos e selecione o fornecedor.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(form);

    criarFatura.mutate({
      dados: {
        tipo_vinculo: tipoVinculo,
        numero_vinculo: formData.get("numero_vinculo")?.toString() || "",
        valor_total: Number(formData.get("valor_total")),
        data_vencimento: formData.get("data_vencimento")?.toString() || "",
        centro_custo: centroCusto,
        fornecedor_id: fornecedorId,
        possui_adiantamento: possuiAdiantamento,
        status: statusFinal,
        gestor_id: user?.id,
      },
      arquivo: file,
    });
  };

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Nova Fatura</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registe os dados da fatura e selecione o fornecedor
        </p>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6 rounded-xl border border-border bg-card p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Centro de Custo</Label>
            <Select
              required
              value={centroCusto}
              onValueChange={setCentroCusto}
              disabled={user?.cargo === "Gestor"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Produção">Produção</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
            {user?.cargo === "Gestor" && (
              <p className="text-[10px] text-muted-foreground">
                Vinculado ao seu setor atual
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select required onValueChange={setFornecedorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedoresFiltrados.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Vínculo</Label>
            <Select required onValueChange={setTipoVinculo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Contrato">Contrato</SelectItem>
                <SelectItem value="Ordem de Compra">Ordem de Compra</SelectItem>
                <SelectItem value="Nota Fiscal">Nota Fiscal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_vinculo">Número do Vínculo</Label>
            <Input id="numero_vinculo" name="numero_vinculo" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_total">Valor Total (R$)</Label>
            <Input
              id="valor_total"
              name="valor_total"
              type="number"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Vencimento</Label>
            <Input
              id="data_vencimento"
              name="data_vencimento"
              type="date"
              required
            />
          </div>

          <div className="flex items-end pb-2">
            <div className="flex items-center gap-2">
              <Switch
                id="adiantamento"
                checked={possuiAdiantamento}
                onCheckedChange={setPossuiAdiantamento}
              />
              <Label htmlFor="adiantamento" className="text-sm cursor-pointer">
                Possui adiantamento
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Arquivo PDF</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 hover:bg-accent/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {file ? file.name : "Clique para enviar o PDF"}
            </p>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            className="flex-1 gap-2"
            disabled={criarFatura.isPending}
            onClick={() => handleAction("APROVADA_GESTOR")}
          >
            {criarFatura.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Criar e Assinar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            disabled={criarFatura.isPending}
            onClick={() => handleAction("PENDENTE_GESTOR")}
          >
            <Save className="h-4 w-4" /> Apenas Guardar
          </Button>
        </div>
      </form>
    </div>
  );
}
