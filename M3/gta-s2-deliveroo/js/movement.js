class StraightMovement {
    constructor(angleDeg) {
        this.angle = angleDeg * Math.PI / 180;
        this.dx = Math.cos(this.angle);
        this.dy = Math.sin(this.angle);
    }

    updatePosition(car, dt) {
        car.x += this.dx * car.speed * dt;
        car.y += this.dy * car.speed * dt;
    }

    handleWraparound(car) {
        if (this.dx > 0.5 && car.x > canvas.width + car.l) {
            car.isWaitingToSpawn = true;
            car.spawnPos = { x: -car.l, y: car.y };
            car.x = -car.l - 500;
            car.speed = 0;
        } else if (this.dx < -0.5 && car.x < -car.l) {
            car.isWaitingToSpawn = true;
            car.spawnPos = { x: canvas.width + car.l, y: car.y };
            car.x = canvas.width + car.l + 500;
            car.speed = 0;
        } else if (this.dy > 0.5 && car.y > canvas.height + car.l) {
            car.isWaitingToSpawn = true;
            car.spawnPos = { x: car.x, y: -car.l };
            car.y = -car.l - 500;
            car.speed = 0;
        } else if (this.dy < -0.5 && car.y < -car.l) {
            car.isWaitingToSpawn = true;
            car.spawnPos = { x: car.x, y: canvas.height + car.l };
            car.y = canvas.height + car.l + 500;
            car.speed = 0;
        }
    }

    canSpawn(car, game) {
        for (const otherCar of game.currentCars) {
            if (car === otherCar) continue;
            if (otherCar instanceof NpcCar && otherCar.isWaitingToSpawn) continue;

            // Odległość prostopadła do kierunku ruchu (sprawdzenie tego samego pasa)
            const perpDist = Math.abs(this.dx * (otherCar.y - car.y) - this.dy * (otherCar.x - car.x));
            if (perpDist > 50) continue;

            // Odległość wzdłuż kierunku ruchu od miejsca spawnu
            const relX = otherCar.x - car.spawnPos.x;
            const relY = otherCar.y - car.spawnPos.y;
            const distance = relX * this.dx + relY * this.dy;

            if (distance >= 0 && distance < car.minSpawnDistance) return false;
        }
        return true;
    }
}
