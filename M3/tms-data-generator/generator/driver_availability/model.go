package driver_availability

import "time"

// DriverAvailability represents a time window when a driver is available.
type DriverAvailability struct {
	ID            int
	DriverID      int
	AvailableFrom time.Time
	AvailableTo   time.Time
}
