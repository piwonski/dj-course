package delivery

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"tms-data-generator/generator/driver_availability"
	"tms-data-generator/generator/drivers"
	"tms-data-generator/generator/transportation_orders"
	"tms-data-generator/generator/vehicle_availability"
	"tms-data-generator/generator/vehicles"
)

type timeWindow struct {
	from time.Time
	to   time.Time
}

var windowTypes = []struct{ startHour, endHour int }{
	{8, 16},
	{8, 12},
	{12, 16},
}

func windowOverlap(a, b timeWindow) (timeWindow, bool) {
	from := a.from
	if b.from.After(from) {
		from = b.from
	}
	to := a.to
	if b.to.Before(to) {
		to = b.to
	}
	if to.Sub(from) >= 30*time.Minute {
		return timeWindow{from, to}, true
	}
	return timeWindow{}, false
}

func hasConflict(slot timeWindow, booked []timeWindow) bool {
	for _, b := range booked {
		if slot.from.Before(b.to) && slot.to.After(b.from) {
			return true
		}
	}
	return false
}

func findFreeSlot(window timeWindow, driverBooked, vehicleBooked []timeWindow) (time.Time, bool) {
	slotStart := window.from
	for !slotStart.Add(30 * time.Minute).After(window.to) {
		slotEnd := slotStart.Add(30 * time.Minute)
		slot := timeWindow{slotStart, slotEnd}
		if !hasConflict(slot, driverBooked) && !hasConflict(slot, vehicleBooked) {
			return slotStart, true
		}
		slotStart = slotStart.Add(30 * time.Minute)
	}
	return time.Time{}, false
}

func orderDeliveryStatus(status transportation_orders.OrderStatus) DeliveryStatus {
	switch status {
	case transportation_orders.OrderProcessing:
		return DeliveryPlanned
	case transportation_orders.OrderInTransit:
		return DeliveryInProgress
	case transportation_orders.OrderReadyForPickup:
		return DeliveryCompleted
	case transportation_orders.OrderDelivered:
		return DeliveryCompleted
	case transportation_orders.OrderCancelled:
		return DeliveryCancelled
	default:
		return DeliveryPlanned
	}
}

// GenerateDeliveries generates deliveries, driver availabilities, and vehicle availabilities.
// Orders without an available slot are set to PENDING status.
func GenerateDeliveries(
	orders []transportation_orders.TransportationOrder,
	driversList []drivers.Driver,
	vehiclesList []vehicles.Vehicle,
) ([]Delivery, []driver_availability.DriverAvailability, []vehicle_availability.VehicleAvailability) {

	// Group non-PENDING order indices by expected delivery date
	orderIndicesByDate := make(map[string][]int)
	for i, order := range orders {
		if order.Status == transportation_orders.OrderPending {
			continue
		}
		dateKey := order.ExpectedDelivery.Format("2006-01-02")
		orderIndicesByDate[dateKey] = append(orderIndicesByDate[dateKey], i)
	}

	var deliveries []Delivery
	var driverAvailabilities []driver_availability.DriverAvailability
	var vehicleAvailabilities []vehicle_availability.VehicleAvailability

	deliveryID := 1
	driverAvailID := 1
	vehicleAvailID := 1

	driverBookedSlots := make(map[string][]timeWindow)
	vehicleBookedSlots := make(map[string][]timeWindow)
	driverWindows := make(map[string]timeWindow)
	vehicleWindows := make(map[string]timeWindow)

	for dateKey, orderIndices := range orderIndicesByDate {
		date, _ := time.Parse("2006-01-02", dateKey)

		// Pick random subset of drivers for this day
		numDrivers := rand.Intn(len(driversList)) + 1
		shuffledDrivers := make([]drivers.Driver, len(driversList))
		copy(shuffledDrivers, driversList)
		rand.Shuffle(len(shuffledDrivers), func(i, j int) {
			shuffledDrivers[i], shuffledDrivers[j] = shuffledDrivers[j], shuffledDrivers[i]
		})
		dayDrivers := shuffledDrivers[:numDrivers]

		// Pick random subset of vehicles for this day
		numVehicles := rand.Intn(len(vehiclesList)) + 1
		shuffledVehicles := make([]vehicles.Vehicle, len(vehiclesList))
		copy(shuffledVehicles, vehiclesList)
		rand.Shuffle(len(shuffledVehicles), func(i, j int) {
			shuffledVehicles[i], shuffledVehicles[j] = shuffledVehicles[j], shuffledVehicles[i]
		})
		dayVehicles := shuffledVehicles[:numVehicles]

		// Generate availability windows for drivers
		for _, driver := range dayDrivers {
			wt := windowTypes[rand.Intn(len(windowTypes))]
			from := time.Date(date.Year(), date.Month(), date.Day(), wt.startHour, 0, 0, 0, time.UTC)
			to := time.Date(date.Year(), date.Month(), date.Day(), wt.endHour, 0, 0, 0, time.UTC)

			key := fmt.Sprintf("%d_%s", driver.ID, dateKey)
			driverWindows[key] = timeWindow{from, to}

			driverAvailabilities = append(driverAvailabilities, driver_availability.DriverAvailability{
				ID:            driverAvailID,
				DriverID:      driver.ID,
				AvailableFrom: from,
				AvailableTo:   to,
			})
			driverAvailID++
		}

		// Generate availability windows for vehicles
		for _, vehicle := range dayVehicles {
			wt := windowTypes[rand.Intn(len(windowTypes))]
			from := time.Date(date.Year(), date.Month(), date.Day(), wt.startHour, 0, 0, 0, time.UTC)
			to := time.Date(date.Year(), date.Month(), date.Day(), wt.endHour, 0, 0, 0, time.UTC)

			key := fmt.Sprintf("%d_%s", vehicle.ID, dateKey)
			vehicleWindows[key] = timeWindow{from, to}

			vehicleAvailabilities = append(vehicleAvailabilities, vehicle_availability.VehicleAvailability{
				ID:            vehicleAvailID,
				VehicleID:     vehicle.ID,
				AvailableFrom: from,
				AvailableTo:   to,
			})
			vehicleAvailID++
		}

		// Assign each order to a driver+vehicle pair with a free slot
		for _, orderIdx := range orderIndices {
			order := orders[orderIdx]
			assigned := false

		outerLoop:
			for _, driver := range dayDrivers {
				driverKey := fmt.Sprintf("%d_%s", driver.ID, dateKey)
				driverWindow, ok := driverWindows[driverKey]
				if !ok {
					continue
				}

				for _, vehicle := range dayVehicles {
					vehicleKey := fmt.Sprintf("%d_%s", vehicle.ID, dateKey)
					vehicleWindow, ok := vehicleWindows[vehicleKey]
					if !ok {
						continue
					}

					overlap, hasOverlap := windowOverlap(driverWindow, vehicleWindow)
					if !hasOverlap {
						continue
					}

					slotStart, found := findFreeSlot(overlap, driverBookedSlots[driverKey], vehicleBookedSlots[vehicleKey])
					if !found {
						continue
					}

					slotEnd := slotStart.Add(30 * time.Minute)
					driverBookedSlots[driverKey] = append(driverBookedSlots[driverKey], timeWindow{slotStart, slotEnd})
					vehicleBookedSlots[vehicleKey] = append(vehicleBookedSlots[vehicleKey], timeWindow{slotStart, slotEnd})

					deliveries = append(deliveries, Delivery{
						ID:            deliveryID,
						OrderID:       order.ID,
						DriverID:      driver.ID,
						VehicleID:     vehicle.ID,
						Status:        orderDeliveryStatus(order.Status),
						ScheduledFrom: slotStart,
						ScheduledTo:   slotEnd,
					})
					deliveryID++
					assigned = true
					break outerLoop
				}
			}

			if !assigned {
				orders[orderIdx].Status = transportation_orders.OrderPending
			}
		}
	}

	return deliveries, driverAvailabilities, vehicleAvailabilities
}

// GenerateInsertStatements generates a single INSERT statement for a slice of deliveries.
func GenerateInsertStatements(deliveries []Delivery) string {
	if len(deliveries) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.Grow(len(deliveries) * 150)
	sb.WriteString("INSERT INTO delivery (id, order_id, driver_id, vehicle_id, status, scheduled_from, scheduled_to) VALUES\n")

	for i, d := range deliveries {
		sb.WriteString(fmt.Sprintf("    (%d, %d, %d, %d, '%s', '%s', '%s')",
			d.ID,
			d.OrderID,
			d.DriverID,
			d.VehicleID,
			d.Status,
			d.ScheduledFrom.Format("2006-01-02 15:04:05"),
			d.ScheduledTo.Format("2006-01-02 15:04:05")))

		if i < len(deliveries)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString(";\n")
		}
	}

	return sb.String()
}
