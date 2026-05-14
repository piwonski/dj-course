package delivery

import "time"

// DeliveryStatus represents the current status of a delivery.
type DeliveryStatus string

const (
	DeliveryPlanned    DeliveryStatus = "PLANNED"
	DeliveryInProgress DeliveryStatus = "IN_PROGRESS"
	DeliveryCompleted  DeliveryStatus = "COMPLETED"
	DeliveryCancelled  DeliveryStatus = "CANCELLED"
)

// Delivery represents a delivery entity.
type Delivery struct {
	ID            int
	OrderID       int
	DriverID      int
	VehicleID     int
	Status        DeliveryStatus
	ScheduledFrom time.Time
	ScheduledTo   time.Time
}
