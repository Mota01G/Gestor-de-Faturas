package fatura

import (
	"database/sql"
	"errors"
	"fmt"
)

type Usuario struct {
	ID          string `json:"id"`
	Nome        string `json:"nome"`
	Email       string `json:"email"`
	Cargo       string `json:"cargo"`
	CentroCusto string `json:"centro_custo"`
}

func (r *Repository) Autenticar(email string, senha string) (Usuario, error) {
	var u Usuario

	err := r.db.QueryRow(`
		SELECT id, nome, email, cargo, centro_custo
		FROM usuarios
		WHERE email = $1 AND senha_hash = $2
	`, email, senha).Scan(&u.ID, &u.Nome, &u.Email, &u.Cargo, &u.CentroCusto)

	if err != nil {
		if err == sql.ErrNoRows {
			return Usuario{}, errors.New("e-mail ou senha incorretos")
		}
		return Usuario{}, err
	}

	return u, nil
}

type Fatura struct {
	ID                 string  `json:"id"`
	TipoVinculo        string  `json:"tipo_vinculo"`
	NumeroVinculo      string  `json:"numero_vinculo"`
	ValorTotal         float64 `json:"valor_total"`
	PossuiAdiantamento bool    `json:"possui_adiantamento"`
	DataVencimento     string  `json:"data_vencimento"`
	CentroCusto        string  `json:"centro_custo"`
	Status             string  `json:"status"`
	CaminhoArquivo     *string `json:"caminho_arquivo"`
	GestorID           *string `json:"gestor_id"`
	FornecedorID       string  `json:"fornecedor_id"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetFaturaByID(id string) (Fatura, error) {
	var f Fatura
	var caminho sql.NullString
	var gestorID sql.NullString

	err := r.db.QueryRow(`
		SELECT id, tipo_vinculo, numero_vinculo, valor_total, possui_adiantamento,
		       data_vencimento, centro_custo, status, caminho_arquivo, gestor_id, fornecedor_id
		FROM faturas
		WHERE id = $1
	`, id).Scan(
		&f.ID, &f.TipoVinculo, &f.NumeroVinculo, &f.ValorTotal, &f.PossuiAdiantamento,
		&f.DataVencimento, &f.CentroCusto, &f.Status, &caminho, &gestorID, &f.FornecedorID,
	)

	if err != nil {
		return Fatura{}, err
	}

	if caminho.Valid {
		f.CaminhoArquivo = &caminho.String
	}
	if gestorID.Valid {
		f.GestorID = &gestorID.String
	}

	return f, nil
}

func (r *Repository) Listar(gestorID string) ([]Fatura, error) {
	query := `SELECT id, tipo_vinculo, numero_vinculo, valor_total, possui_adiantamento,
	                 data_vencimento, centro_custo, status, caminho_arquivo, gestor_id, fornecedor_id
	          FROM faturas`
	var args []interface{}

	if gestorID != "" {
		query += ` WHERE gestor_id = $1`
		args = append(args, gestorID)
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	faturas := []Fatura{}
	for rows.Next() {
		var f Fatura
		var caminho sql.NullString
		var dbGestorID sql.NullString

		if err := rows.Scan(
			&f.ID, &f.TipoVinculo, &f.NumeroVinculo, &f.ValorTotal, &f.PossuiAdiantamento,
			&f.DataVencimento, &f.CentroCusto, &f.Status, &caminho, &dbGestorID, &f.FornecedorID,
		); err != nil {
			return nil, err
		}

		if caminho.Valid {
			f.CaminhoArquivo = &caminho.String
		}
		if dbGestorID.Valid {
			f.GestorID = &dbGestorID.String
		}

		faturas = append(faturas, f)
	}
	return faturas, nil
}

func (r *Repository) Deletar(id string) error {
	_, err := r.db.Exec(`DELETE FROM faturas WHERE id = $1`, id)
	return err
}

func (r *Repository) Criar(f Fatura) (string, error) {
	var id string

	err := r.db.QueryRow(`
		INSERT INTO faturas (
			tipo_vinculo, numero_vinculo, valor_total,
			data_vencimento, centro_custo, possui_adiantamento,
			status, gestor_id, fornecedor_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`,
		f.TipoVinculo,
		f.NumeroVinculo,
		f.ValorTotal,
		f.DataVencimento,
		f.CentroCusto,
		f.PossuiAdiantamento,
		f.Status,
		f.GestorID,
		f.FornecedorID,
	).Scan(&id)

	if err != nil {
		return "", err
	}

	return id, nil
}

func (r *Repository) AtualizarStatus(id string, novoStatus string) error {
	var statusAtualEsperado string

	switch novoStatus {
	case "APROVADA_GESTOR":
		statusAtualEsperado = "PENDENTE_GESTOR"
	case "APROVADA_CONTROLADORIA":
		statusAtualEsperado = "APROVADA_GESTOR"
	default:
		return errors.New("transição invalida: status de destino desconhecido ou não permitido")
	}

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

	if linhasAfetadas == 0 {
		return fmt.Errorf("transição invalida: a fatura não está no status %s esperado", statusAtualEsperado)
	}

	return nil
}

func (r *Repository) SalvarCaminhoArquivo(id string, caminho string) error {
	_, err := r.db.Exec(`
		UPDATE faturas
		SET caminho_arquivo = $1
		WHERE id = $2
	`, caminho, id)
	return err
}
