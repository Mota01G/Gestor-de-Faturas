import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext"; // 1. Importamos o AuthContext!

export default function FaturaCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); // 2. Puxamos o utilizador logado
  const [file, setFile] = useState<File | null>(null);

  const criarFatura = useMutation({
    mutationFn: async ({
      dados,
      arquivo,
    }: {
      dados: any;
      arquivo: File | null;
    }) => {
      // Usando a variável de ambiente global
      const resFatura = await fetch(`${import.meta.env.VITE_API_URL}/faturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resFatura.ok) throw new Error("Erro ao criar os dados da fatura");

      const faturaCriada = await resFatura.json();
      const faturaId = faturaCriada.id || faturaCriada.ID;

      if (!faturaId) throw new Error("Backend não devolveu o ID da fatura");

      if (arquivo) {
        const formData = new FormData();
        formData.append("file", arquivo);

        const resUpload = await fetch(
          `${import.meta.env.VITE_API_URL}/faturas/${faturaId}/upload`,
          { method: "POST", body: formData },
        );

        if (!resUpload.ok)
          throw new Error("Fatura criada, mas erro ao anexar o PDF");
      }

      return faturaId;
    },
    onSuccess: (idCriado) => {
      toast({
        title: "Fatura criada com sucesso!",
        description: "A fatura foi vinculada ao seu usuário.",
      });
      navigate(`/faturas/${idCriado}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na operação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    criarFatura.mutate({
      dados: {
        // 3. Tudo em minúsculas para o Go entender e com o ID do Gestor!
        numero_vinculo: formData.get("numero_vinculo"),
        valor_total: Number(formData.get("valor_total")),
        data_vencimento: formData.get("data_vencimento"),
        status: "PENDENTE_GESTOR",
        gestor_id: user?.id, // <-- AQUI! O ID VAI ESCONDIDO PARA O GO
      },
      arquivo: file,
    });
  };

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Nova Fatura</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados para registrar uma nova fatura
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-border bg-card p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Tipo de Vínculo */}
          <div className="space-y-2">
            <Label htmlFor="tipo_vinculo">Tipo de Vínculo</Label>
            <Select required>
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
            <Input
              id="numero_vinculo"
              name="numero_vinculo"
              placeholder="Ex: CTR-2024-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_total">Valor Total (R$)</Label>
            <Input
              id="valor_total"
              name="valor_total"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Data de Vencimento</Label>
            <Input
              id="data_vencimento"
              name="data_vencimento"
              type="date"
              required
            />
          </div>

          {/* Centro de Custo */}
          <div className="space-y-2">
            <Label htmlFor="centro_custo">Centro de Custo</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Produção">Produção</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-6 pb-1">
            <div className="flex items-center gap-2">
              <Switch id="possui_adiantamento" />
              <Label htmlFor="possui_adiantamento" className="text-sm">
                Possui adiantamento
              </Label>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="space-y-2">
          <Label>Arquivo PDF</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-accent/50">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {file ? file.name : "Clique para enviar ou arraste o arquivo"}
            </p>
            <p className="text-xs text-muted-foreground">PDF até 10MB</p>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={criarFatura.isPending}
          >
            {criarFatura.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Criar Fatura
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/faturas")}
            disabled={criarFatura.isPending}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
