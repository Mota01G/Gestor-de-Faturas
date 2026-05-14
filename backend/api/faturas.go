package main

type Fatura struct {
	ID                 string
	TipoVinculo        string
	NumeroVinculo      string
	ValorTotal         float64
	PossuiAdiantamento bool
	DataVencimento     string
	CentroCusto        string
	Status             string
	CaminhoArquivo     *string
	GestorID           *string
}
