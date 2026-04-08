package patterns

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// Pattern: SIEM — structured audit log for every request.
// Adapt: add authentication fields (user ID, role) from your auth layer.
func AuditLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		slog.Info("audit",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"client_ip", c.ClientIP(),
			"user_agent", c.Request.UserAgent(),
			"latency_ms", time.Since(start).Milliseconds(),
		)
	}
}
