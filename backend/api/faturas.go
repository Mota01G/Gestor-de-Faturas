package main

type Fatura struct {
	ID             int     `json:"id"`
	Valor          float64 `json:"valor"`
	DataVencimento string  `json:"data_vencimento"`
}
