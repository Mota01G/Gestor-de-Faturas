export type FaturaStatus = 
  | 'PENDENTE_GESTOR' 
  | 'APROVADA_GESTOR' 
  | 'APROVADA_CONTROLADORIA' 
  | 'ENVIADA_PAGAMENTO';

export interface Fatura {
  id: string;
  caminho_arquivo: string;
  tipo_vinculo: string;
  numero_vinculo: string;
  assinatura_gestor: boolean;
  valor_total: number;
  possui_adiantamento: boolean;
  data_vencimento: string;
  centro_custo: string;
  ja_lancada: boolean;
  status: FaturaStatus;
  criado_em: string;
}

export const STATUS_LABELS: Record<FaturaStatus, string> = {
  PENDENTE_GESTOR: 'Pendente Gestor',
  APROVADA_GESTOR: 'Aprovada Gestor',
  APROVADA_CONTROLADORIA: 'Aprovada Controladoria',
  ENVIADA_PAGAMENTO: 'Enviada p/ Pagamento',
};

export const STATUS_COLORS: Record<FaturaStatus, string> = {
  PENDENTE_GESTOR: 'bg-warning/15 text-warning',
  APROVADA_GESTOR: 'bg-info/15 text-info',
  APROVADA_CONTROLADORIA: 'bg-success/15 text-success',
  ENVIADA_PAGAMENTO: 'bg-primary/15 text-primary',
};
