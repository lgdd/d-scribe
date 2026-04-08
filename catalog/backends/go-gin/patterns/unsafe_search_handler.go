package patterns

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Pattern: Security — SQL injection via string concatenation.
// Intentionally vulnerable; do NOT use parameterized queries here.
func UnsafeSearchHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		term := c.Query("q")
		query := fmt.Sprintf("SELECT * FROM items WHERE name LIKE '%%%s%%'", term)
		rows, err := db.Query(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()
		var results []string
		for rows.Next() {
			var name string
			rows.Scan(&name)
			results = append(results, name)
		}
		c.JSON(http.StatusOK, gin.H{"results": results})
	}
}
