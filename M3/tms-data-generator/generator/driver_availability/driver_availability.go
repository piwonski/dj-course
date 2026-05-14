package driver_availability

import (
	"fmt"
	"strings"
)

// GenerateInsertStatements generates a single INSERT statement for a slice of driver availabilities.
func GenerateInsertStatements(availabilities []DriverAvailability) string {
	if len(availabilities) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.Grow(len(availabilities) * 100)
	sb.WriteString("INSERT INTO driver_availability (id, driver_id, available_from, available_to) VALUES\n")

	for i, a := range availabilities {
		sb.WriteString(fmt.Sprintf("    (%d, %d, '%s', '%s')",
			a.ID,
			a.DriverID,
			a.AvailableFrom.Format("2006-01-02 15:04:05"),
			a.AvailableTo.Format("2006-01-02 15:04:05")))

		if i < len(availabilities)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString(";\n")
		}
	}

	return sb.String()
}
