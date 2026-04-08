package patterns

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

// Pattern: Profiling — gradual memory allocation in a cache.
// Each call stores 100KB; entries are never evicted.
var leakyCache sync.Map
var leakCounter int

//dd:span memory.leak
func MemoryLeakHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		leakCounter++
		data := make([]byte, 100*1024)
		leakyCache.Store(leakCounter, data)
		c.JSON(http.StatusOK, gin.H{"cached_entries": leakCounter})
	}
}
