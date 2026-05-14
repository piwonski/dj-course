package vehicle_availability

import "time"

// VehicleAvailability represents a time window when a vehicle is available.
type VehicleAvailability struct {
	ID            int
	VehicleID     int
	AvailableFrom time.Time
	AvailableTo   time.Time
}
