package patterns

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Pattern: Profiling — CPU-intensive nested loop aggregation.
//
//dd:span cpu.aggregate
func CpuIntensiveHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		counts := make(map[string]int)
		for i := 0; i < 100; i++ {
			for k := range counts {
				delete(counts, k)
			}
			for j := 0; j < 10000; j++ {
				key := fmt.Sprintf("bucket-%d", j%50)
				counts[key]++
			}
		}
		c.JSON(http.StatusOK, gin.H{"buckets": len(counts), "iterations": 100 * 10000})
	}
}
