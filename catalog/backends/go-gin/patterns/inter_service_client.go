package patterns

import (
	"io"
	"net/http"
	"os"
)

// Pattern: Cross-service HTTP call — tracing headers propagated automatically.
// Orchestrion auto-instruments net/http at compile time.
func CallService(path string) (string, error) {
	baseURL := os.Getenv("TARGET_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	resp, err := http.Get(baseURL + path)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	return string(body), err
}
