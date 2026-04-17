package main

import (
	"database/sql"
	"fmt"

	"github.com/Mota01G/Gestor-de-Faturas/internal/domain/entity"
	_ "github.com/lib/pq"
)

func main() {
	db, err := conectar()
	if err != nil {
		panic(err)
	}
	defer db.Close()

	fmt.Println("Conectado ao banco com sucesso!")

	if err := inserirFaturaDeTeste(db); err != nil {
		panic(err)
	}

	faturas, err := entity.ListarFaturas(db)
	if err != nil {
		panic(err)
	}

	fmt.Println("Faturas:", faturas)

}

func conectar() (*sql.DB, error) {
	stringDeConexao := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		"localhost", 5432, "admin", "adminpassword", "controladoria", "disable",
	)

	db, err := sql.Open("postgres", stringDeConexao)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func inserirFaturaDeTeste(db *sql.DB) error {
	_, err := db.Exec(`
        INSERT INTO faturas (numero_vinculo, valor_total, data_vencimento, status)
        VALUES ($1, $2, $3, $4)
    `, "2448", 746.00, "2026-05-11", "pendente")

	return err
}
