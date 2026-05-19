package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/Mota01G/Gestor-de-Faturas/backend/internal/fatura"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

var repo *fatura.Repository

func main() {
	connStr := "host=localhost port=5432 user=postgres password=postgres dbname=gestor_faturas sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	repo = fatura.NewRepository(db)

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	r.Static("/uploads", "./uploads")

	r.POST("/login", loginHandler)
	r.GET("/faturas", listFaturasHandler)
	r.GET("/faturas/:id", getFaturaHandler)
	r.POST("/faturas", addFaturaHandler)
	r.DELETE("/faturas/:id", deleteFaturaHandler)
	r.POST("/faturas/:id/upload", uploadFaturaHandler)
	r.PATCH("/faturas/:id/status", updateStatusHandler)

	fmt.Println("Servidor rodando em http://localhost:8080")
	r.Run(":8080")
}

func loginHandler(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
		Senha string `json:"senha"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	user, err := repo.Autenticar(req.Email, req.Senha)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func listFaturasHandler(c *gin.Context) {
	gestorID := c.Query("gestor_id")
	faturas, err := repo.Listar(gestorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, faturas)
}

func getFaturaHandler(c *gin.Context) {
	id := c.Param("id")
	f, err := repo.GetFaturaByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fatura não encontrada"})
		return
	}
	c.JSON(http.StatusOK, f)
}

func addFaturaHandler(c *gin.Context) {
	var req struct {
		NumeroVinculo      string  `json:"numero_vinculo"`
		TipoVinculo        string  `json:"tipo_vinculo"`
		ValorTotal         float64 `json:"valor_total"`
		DataVencimento     string  `json:"data_vencimento"`
		CentroCusto        string  `json:"centro_custo"`
		PossuiAdiantamento bool    `json:"possui_adiantamento"`
		Status             string  `json:"status"`
		GestorID           string  `json:"gestor_id"`
		FornecedorID       string  `json:"fornecedor_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	var gestorPtr *string
	if req.GestorID != "" {
		gestorPtr = &req.GestorID
	}

	novaFatura := fatura.Fatura{
		TipoVinculo:        req.TipoVinculo,
		NumeroVinculo:      req.NumeroVinculo,
		ValorTotal:         req.ValorTotal,
		DataVencimento:     req.DataVencimento,
		CentroCusto:        req.CentroCusto,
		PossuiAdiantamento: req.PossuiAdiantamento,
		Status:             req.Status,
		GestorID:           gestorPtr,
		FornecedorID:       req.FornecedorID,
	}

	idGerado, err := repo.Criar(novaFatura)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	novaFatura.ID = idGerado
	c.JSON(http.StatusCreated, novaFatura)
}

func deleteFaturaHandler(c *gin.Context) {
	id := c.Param("id")
	if err := repo.Deletar(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Fatura removida"})
}

func uploadFaturaHandler(c *gin.Context) {
	id := c.Param("id")
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não enviado"})
		return
	}

	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", os.ModePerm)
	}

	ext := filepath.Ext(file.Filename)
	newFileName := uuid.New().String() + ext
	filePath := filepath.Join("uploads", newFileName)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar arquivo"})
		return
	}

	if err := repo.SalvarCaminhoArquivo(id, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar banco"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": filePath})
}

func updateStatusHandler(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	err := repo.AtualizarStatus(id, req.Status)
	if err != nil {
		if strings.Contains(err.Error(), "transição invalida") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": req.Status})
}
