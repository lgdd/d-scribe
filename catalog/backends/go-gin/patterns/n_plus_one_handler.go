package patterns

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Pattern: DBM N+1 — queries children per parent in a loop.
// Orchestrion auto-instruments database/sql at compile time.
func NplusOneHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		parents, _ := db.Query("SELECT id FROM parents LIMIT 20")
		defer parents.Close()
		var all []map[string]any
		for parents.Next() {
			var id int
			parents.Scan(&id)
			children, _ := db.Query(fmt.Sprintf("SELECT * FROM children WHERE parent_id = %d", id))
			for children.Next() {
				all = append(all, map[string]any{"parent_id": id})
			}
			children.Close()
		}
		c.JSON(http.StatusOK, gin.H{"count": len(all)})
	}
}
