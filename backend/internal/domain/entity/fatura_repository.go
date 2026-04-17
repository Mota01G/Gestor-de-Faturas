package entity

import (
	"database/sql"
)

func ListarFaturas(db *sql.DB) ([]Fatura, error) {
	rows, err := db.Query(`
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

		if err := rows.Scan(&f.ID, &f.NumeroVinculo, &f.ValorTotal, &f.DataVenc, &f.Status); err != nil {
			return nil, err
		}

		faturas = append(faturas, f)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return faturas, nil
}
