package patterns

import (
	"database/sql"
	"fmt"
)

// Pattern: DBM slow query — artificial delay via pg_sleep.
// Orchestrion auto-instruments database/sql at compile time.
func FindAllSlow(db *sql.DB, table string) ([]map[string]any, error) {
	query := fmt.Sprintf("SELECT *, pg_sleep(0.3) FROM %s ORDER BY created_at DESC LIMIT 50", table)
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	cols, _ := rows.Columns()
	var results []map[string]any
	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		rows.Scan(ptrs...)
		row := make(map[string]any)
		for i, c := range cols {
			row[c] = vals[i]
		}
		results = append(results, row)
	}
	return results, nil
}
