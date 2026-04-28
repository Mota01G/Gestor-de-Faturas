// @title           API Gestor de Faturas
// @version         1.0
// @description     API para gestão de faturas
// @host            localhost:8080
// @BasePath        /
package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	_ "github.com/Mota01G/Gestor-de-Faturas/api/docs"
	"github.com/Mota01G/Gestor-de-Faturas/internal/fatura"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

var repo *fatura.Repository

func main() {
	db, err := conectar()
	if err != nil {
		panic(err)
	}

	repo = fatura.NewRepository(db)
	router := gin.Default()
	corsConfig := cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
		},
		ExposeHeaders: []string{
			"Content-Length",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	router.Use(cors.New(corsConfig))
	router.GET("/faturas", getFaturasHandler)
	router.GET("/faturas/:id", getFaturaByIDHandler)
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	router.POST("/faturas", addFaturaHandler)
	router.POST("/faturas/:id/upload", uploadFaturaHandler)
	router.DELETE("/faturas/:id", deleteFaturaHandler)
	router.PATCH("/faturas/:id/status", updateStatusHandler)
	router.Static("/uploads", "./uploads")
	router.POST("/login", loginHandler)
	router.Run("localhost:8080")
}

func loginHandler(c *gin.Context) {
	var credenciais struct {
		Email string `json:"email"`
		Senha string `json:"senha"`
	}

	// 1. Lê o JSON que vem do frontend
	if err := c.ShouldBindJSON(&credenciais); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados em formato inválido"})
		return
	}

	// 2. Tenta autenticar no banco
	usuario, err := repo.Autenticar(credenciais.Email, credenciais.Senha)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 3. Se der certo, devolve os dados do utilizador (e ele entra no sistema!)
	c.JSON(http.StatusOK, usuario)
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

func helloHandler(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, "Meu primeiro enfpoint GET em golang")
}

// @Summary      Lista todas as faturas
// @Description  Retorna a lista completa de faturas do banco
// @Tags         faturas
// @Produce      json
// @Success      200  {array}   fatura.Fatura
// @Failure      500  {object}  map[string]string
// @Router       /faturas [get]
func getFaturasHandler(c *gin.Context) {
	// Captura o parâmetro da URL (se não existir, o Go assume string vazia "")
	gestorID := c.Query("gestor_id")

	// Passamos o parâmetro para a nossa nova função inteligente
	faturas, err := repo.Listar(gestorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, faturas)
}

// @Summary      Cria uma nova fatura
// @Description  Insere uma nova fatura no banco
// @Tags         faturas
// @Accept       json
// @Produce      json
// @Param        fatura  body      fatura.Fatura  true  "Dados da fatura"
// @Success      201     {object}  fatura.Fatura
// @Failure      400     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /faturas [post]
func addFaturaHandler(c *gin.Context) {
	// Estrutura completa para ler tudo o que vem do formulário
	var req struct {
		TipoVinculo        string  `json:"tipo_vinculo"`
		NumeroVinculo      string  `json:"numero_vinculo"`
		ValorTotal         float64 `json:"valor_total"`
		DataVencimento     string  `json:"data_vencimento"`
		CentroCusto        string  `json:"centro_custo"`
		PossuiAdiantamento bool    `json:"possui_adiantamento"`
		Status             string  `json:"status"`
		GestorID           string  `json:"gestor_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	var gestorPtr *string
	if req.GestorID != "" {
		gestorPtr = &req.GestorID
	}

	// Montamos a fatura completa
	novaFatura := fatura.Fatura{
		TipoVinculo:        req.TipoVinculo,
		NumeroVinculo:      req.NumeroVinculo,
		ValorTotal:         req.ValorTotal,
		DataVencimento:     req.DataVencimento,
		CentroCusto:        req.CentroCusto,
		PossuiAdiantamento: req.PossuiAdiantamento,
		Status:             req.Status,
		GestorID:           gestorPtr,
	}

	idGerado, err := repo.Criar(novaFatura)
	if err != nil {
		c.JSON(500, gin.H{"error": "Erro ao salvar no banco: " + err.Error()})
		return
	}

	novaFatura.ID = idGerado
	c.JSON(201, novaFatura)
}

// @Summary      Deleta uma fatura
// @Description  Remove uma fatura do banco pelo ID
// @Tags         faturas
// @Param        id   path      string  true  "ID da fatura"
// @Success      200  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /faturas/{id} [delete]
func deleteFaturaHandler(c *gin.Context) {
	id := c.Param("id")
	if err := repo.Deletar(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Fatura deletada com sucesso"})

}

// @Summary      Atualiza o status de uma fatura
// @Description  Altera o status de uma fatura pelo ID
// @Tags         faturas
// @Accept       json
// @Produce      json
// @Param        id      path      string              true  "ID da fatura"
// @Param        status  body      map[string]string   true  "Novo status"
// @Success      200     {object}  map[string]string
// @Failure      400     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /faturas/{id}/status [patch]
func updateStatusHandler(c *gin.Context) {
	id := c.Param("id")

	var body map[string]string
	if err := c.BindJSON(&body); err != nil {
		return
	}

	status, ok := body["status"]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "campo status é obrigatório"})
		return
	}

	if err := repo.AtualizarStatus(id, status); err != nil {
		// 1. Verifica se é o nosso erro customizado de regra de negócio
		if strings.Contains(err.Error(), "transição") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 2. Se não contiver a palavra, é um erro real (banco caiu, etc), então devolve 500
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status atualizado com sucesso"})
}

// @Summary      Upload de arquivo da fatura
// @Description  Recebe o PDF da fatura, salva em disco e atualiza o status para APROVADA_GESTOR
// @Tags         faturas
// @Accept       multipart/form-data
// @Produce      json
// @Param        id    path      string  true  "ID da fatura"
// @Param        file  formData  file    true  "Arquivo PDF da fatura"
// @Success      200   {object}  map[string]string
// @Failure      400   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /faturas/{id}/upload [post]
func uploadFaturaHandler(c *gin.Context) {
	id := c.Param("id")

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "arquivo não encontrado"})
		return
	}

	caminho := fmt.Sprintf("uploads/%s_%s", id, file.Filename)

	if err := c.SaveUploadedFile(file, caminho); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao salvar arquivo"})
		return
	}

	if err := repo.SalvarCaminhoArquivo(id, caminho); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Upload realizado com sucesso",
		"caminho": caminho,
	})
}

func getFaturaByIDHandler(c *gin.Context) {
	id := c.Param("id")

	fatura, err := repo.GetFaturaByID(id)
	if err != nil {
		// se não encontrar, devolve 404
		c.JSON(http.StatusNotFound, gin.H{"error": "fatura não encontrada"})
		return
	}

	c.JSON(http.StatusOK, fatura)
}
