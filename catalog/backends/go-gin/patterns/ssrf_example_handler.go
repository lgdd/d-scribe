package patterns

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Pattern: Security — SSRF via unvalidated URL parameter.
// Orchestrion auto-instruments net/http at compile time.
func SsrfExampleHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		url := c.Query("url")
		resp, err := http.Get(url)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), body)
	}
}
