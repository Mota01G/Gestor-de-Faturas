package main

type Fatura struct {
	ID                 string
	TipoVinculo        string // Faltava este
	NumeroVinculo      string
	ValorTotal         float64
	PossuiAdiantamento bool // Faltava este
	DataVencimento     string
	CentroCusto        string // Faltava este
	Status             string
	CaminhoArquivo     *string
	GestorID           *string
}
