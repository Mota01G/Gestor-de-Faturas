package fatura

import (
	"database/sql"
	"errors"
	"fmt"
)

type Fatura struct {
	ID             string
	NumeroVinculo  string
	ValorTotal     float64
	DataVencimento string
	Status         string
	CaminhoArquivo *string
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetFaturaByID(id string) (Fatura, error) {
	var f Fatura
	err := r.db.QueryRow(`
		SELECT id, numero_vinculo, valor_total, data_vencimento, status, caminho_arquivo
		FROM faturas
		WHERE id = $1
	`, id).Scan(
		&f.ID,
		&f.NumeroVinculo,
		&f.ValorTotal,
		&f.DataVencimento,
		&f.Status,
		&f.CaminhoArquivo,
	)
	if err != nil {
		return Fatura{}, err
	}
	return f, nil
}

func (r *Repository) Listar() ([]Fatura, error) {
	rows, err := r.db.Query(`
		SELECT id, numero_vinculo, valor_total, data_vencimento, status
		FROM faturas
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var faturas []Fatura
	for rows.Next() {
		var f Fatura
		if err := rows.Scan(&f.ID,
			&f.NumeroVinculo,
			&f.ValorTotal,
			&f.DataVencimento,
			&f.Status,
			&f.CaminhoArquivo); err != nil {
			return nil, err
		}
		faturas = append(faturas, f)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return faturas, nil
}

func (r *Repository) Deletar(id string) error {
	_, err := r.db.Exec(`DELETE FROM faturas WHERE id = $1`, id)
	return err
}

func (r *Repository) Criar(f Fatura) (string, error) {
	var id string

	// Adicionamos "RETURNING id" no final da query
	err := r.db.QueryRow(`
		INSERT INTO faturas (numero_vinculo, valor_total, data_vencimento, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`,
		f.NumeroVinculo,
		f.ValorTotal,
		f.DataVencimento,
		f.Status,
	).Scan(&id) // O Scan coloca o ID gerado na nossa variável

	if err != nil {
		return "", err
	}

	return id, nil
}

func (r *Repository) AtualizarStatus(id string, novoStatus string) error {
	var statusAtualEsperado string

	// A nossa Máquina de Estados definida em código!
	switch novoStatus {
	case "APROVADA_GESTOR":
		statusAtualEsperado = "PENDENTE_GESTOR"
	case "APROVADA_CONTROLADORIA":
		statusAtualEsperado = "APROVADA_GESTOR"
	default:
		return errors.New("transição invalida: status de destino desconhecido ou não permitido")
	}

	// O banco agora usa a variável statusAtualEsperado
	resultado, err := r.db.Exec(`
		UPDATE faturas
		SET status = $1, assinatura_gestor = true
		WHERE id = $2 AND status = $3
	`, novoStatus, id, statusAtualEsperado)

	if err != nil {
		return err
	}

	linhasAfetadas, err := resultado.RowsAffected()
	if err != nil {
		return err
	}

	// Usando fmt.Errorf para uma mensagem dinâmica baseada no status esperado
	if linhasAfetadas == 0 {
		return fmt.Errorf("transição invalida: a fatura não está no status %s esperado", statusAtualEsperado)
	}

	return nil
}

func (r *Repository) SalvarCaminhoArquivo(id string, caminho string) error {
	_, err := r.db.Exec(`
        UPDATE faturas
        SET caminho_arquivo = $1, status = 'APROVADA_GESTOR'
        WHERE id = $2
    `, caminho, id)
	return err
}
