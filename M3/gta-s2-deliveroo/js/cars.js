class ObstacleCar {
    constructor(props) {
        this.x = props.x;
        this.y = props.y;
        this.angle = props.angle * (Math.PI / 180);

        // Randomize size slightly based on type if not provided
        const type = props.type || 'sedan';
        if (type === 'suv') { this.w = 50; this.l = 115; }
        else if (type === 'compact') { this.w = 40; this.l = 80; }
        else { this.w = 44; this.l = 90; } // Sedan default

        this.color = props.color || `hsl(${Math.random()*360}, 60%, 50%)`;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-this.l/2 + 5, -this.w/2 + 5, this.l, this.w);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-this.l/2, -this.w/2, this.l, this.w, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Windshield (Front) - Trapezoid
        ctx.fillStyle = 'rgba(180, 200, 255, 0.4)'; // Bluish glass
        ctx.beginPath();
        ctx.moveTo(this.l/2 - 10, -this.w/2 + 5);
        ctx.lineTo(this.l/2 - 10, this.w/2 - 5);
        ctx.lineTo(this.l/2 - 25, this.w/2 - 8);
        ctx.lineTo(this.l/2 - 25, -this.w/2 + 8);
        ctx.closePath();
        ctx.fill();

        // Rear window
        ctx.beginPath();
        ctx.moveTo(-this.l/2 + 10, -this.w/2 + 5);
        ctx.lineTo(-this.l/2 + 10, this.w/2 - 5);
        ctx.lineTo(-this.l/2 + 20, this.w/2 - 8);
        ctx.lineTo(-this.l/2 + 20, -this.w/2 + 8);
        ctx.closePath();
        ctx.fill();

        // Headlights (Front)
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.l/2 - 4, -this.w/2 + 4, 4, 8);
        ctx.fillRect(this.l/2 - 4, this.w/2 - 12, 4, 8);

        // Taillights (Rear)
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-this.l/2, -this.w/2 + 4, 2, 8);
        ctx.fillRect(-this.l/2, this.w/2 - 12, 2, 8);

        ctx.restore();
    }
}

class NpcCar extends ObstacleCar {
    constructor(props) {
        super(props);
        this.originalSpeed = props.speed || -2;
        this.speed = this.originalSpeed;
        this.isStopped = false;
        this.kind = props.kind;

        // Dźwięk klaksonu dla tego samochodu
        this.hornSound = new Audio('horn.wav');
        this.hornSound.loop = true;
        this.hornSound.volume = 0.4;

        // Deadlock prevention
        this.stuckTimer = 0;
        this.stuckThreshold = 60; // ~1 sekunda przy 60 FPS - agresywniejsze!

        // Spawn queue system
        this.isWaitingToSpawn = false;
        this.spawnX = 0; // Pozycja gdzie samochód czeka na spawn
        this.minSpawnDistance = 200; // Minimalna odległość do najbliższego samochodu
    }

    stop() {
        this.speed = 0;
        this.isStopped = true;

        // Zatrzymaj klakson gdy samochód się zatrzymuje
        if (this.hornSound && !this.hornSound.paused) {
            this.hornSound.pause();
            this.hornSound.currentTime = 0;
        }
    }

    update(game, deltaTime) {
        // Normalize deltaTime to 60 FPS
        const dt = deltaTime * 60;

        // === SPAWN QUEUE SYSTEM ===
        if (this.isWaitingToSpawn) {
            // Sprawdź czy jest wolna przestrzeń do spawnu
            if (this.canSpawn(game)) {
                // Spawn samochód
                this.x = this.spawnX;
                this.isWaitingToSpawn = false;
                this.speed = this.originalSpeed;
            } else {
                // Czekaj na wolne miejsce
                return;
            }
        }

        // === DEADLOCK PREVENTION - Sprawdź czy stuck nawet gdy isStopped ===
        if (this.isStopped) {
            this.stuckTimer += dt;

            // Jeśli stuck zbyt długo - ODBLOKUJ!
            if (this.stuckTimer > this.stuckThreshold) {
                // console.log(`🔓 NPC UNLOCKING: was stuck for ${this.stuckTimer} frames`);

                // Odblokuj samochód
                this.isStopped = false;

                // Przywróć prędkość
                this.speed = this.originalSpeed;

                // Resetuj timer
                this.stuckTimer = 0;

                // Zatrzymaj klakson
                if (this.hornSound && !this.hornSound.paused) {
                    this.hornSound.pause();
                    this.hornSound.currentTime = 0;
                }
            }
            return;
        }

        // === Normalny update fizyki ===
        const oldX = this.x;
        const oldY = this.y;

        const isAggressive = this.kind === 'aggressive';
        const sensorLength = isAggressive ? 80 : 150;
        const acceleration = isAggressive ? 0.3 : 0.1;
        const brakingFactor = isAggressive ? 0.90 : 0.95;

        const sensorX = this.x + Math.cos(this.angle) * (this.l / 2 + sensorLength / 2);
        const sensorY = this.y + Math.sin(this.angle) * (this.l / 2 + sensorLength / 2);

        const sensor = {
            x: sensorX,
            y: sensorY,
            w: this.w - 10,
            l: sensorLength,
            angle: this.angle
        };

        let obstacleAhead = false;
        let playerAhead = false;

        if (checkRectCollision(sensor, game.player)) {
            obstacleAhead = true;
            playerAhead = true;
        } else {
            for (const otherCar of game.currentCars) {
                if (this === otherCar) continue;
                if (checkRectCollision(sensor, otherCar)) {
                    obstacleAhead = true;
                    break;
                }
            }
        }

        // Kontroluj odtwarzanie klaksonu - graj tak długo jak gracz blokuje
        if (playerAhead) {
            if (this.hornSound.paused) {
                this.hornSound.play().catch(e => console.log('Horn play prevented:', e));
            }
        } else {
            if (!this.hornSound.paused) {
                this.hornSound.pause();
                this.hornSound.currentTime = 0;
            }
        }

        if (obstacleAhead) {
            this.speed *= Math.pow(brakingFactor, dt);
            if (Math.abs(this.speed) < 0.1) this.speed = 0;
        } else {
            if (Math.abs(this.speed) < Math.abs(this.originalSpeed)) {
                this.speed += Math.sign(this.originalSpeed) * acceleration * dt;
            } else {
                this.speed = this.originalSpeed;
            }
        }

        this.x += this.speed * dt;

        // === WRAPAROUND Z KOLEJKOWANIEM ===
        if (this.speed > 0 && this.x > canvas.width + this.l) {
            // Jadący w prawo wychodzi za prawą krawędź - czeka na lewo
            this.isWaitingToSpawn = true;
            this.spawnX = -this.l;
            this.x = -this.l - 500; // Ukryj poza ekranem
            this.speed = 0;
        } else if (this.speed < 0 && this.x < -this.l) {
            // Jadący w lewo wychodzi za lewą krawędź - czeka na prawo
            this.isWaitingToSpawn = true;
            this.spawnX = canvas.width + this.l;
            this.x = canvas.width + this.l + 500; // Ukryj poza ekranem
            this.speed = 0;
        }

        // Resetuj stuck timer gdy samochód się normalnie porusza
        this.stuckTimer = 0;
    }

    canSpawn(game) {
        // Sprawdź czy jest wystarczająco dużo miejsca do spawnu
        const spawnThreshold = this.minSpawnDistance;

        for (const otherCar of game.currentCars) {
            if (this === otherCar) continue;

            // Sprawdź tylko samochody w tym samym pasie (podobna pozycja Y)
            const sameY = Math.abs(otherCar.y - this.y) < 50;
            if (!sameY) continue;

            // Sprawdź czy samochód nie jest w trakcie spawnu
            if (otherCar instanceof NpcCar && otherCar.isWaitingToSpawn) continue;

            // Oblicz odległość w kierunku ruchu
            let distance;
            if (this.originalSpeed > 0) {
                // Spawnimy po lewej (-this.l), sprawdź odległość do samochodów przed nami
                distance = otherCar.x - this.spawnX;
            } else {
                // Spawnimy po prawej (canvas.width + this.l), sprawdź odległość do samochodów przed nami
                distance = this.spawnX - otherCar.x;
            }

            // Jeśli jakiś samochód jest zbyt blisko, nie spawnuj
            if (distance >= 0 && distance < spawnThreshold) {
                return false;
            }
        }

        return true;
    }

    draw(ctx) {
        // Nie rysuj samochodów czekających na spawn
        if (this.isWaitingToSpawn) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-this.l/2 + 5, -this.w/2 + 5, this.l, this.w);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-this.l/2, -this.w/2, this.l, this.w, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(180, 200, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(this.l/2 - 10, -this.w/2 + 5);
        ctx.lineTo(this.l/2 - 10, this.w/2 - 5);
        ctx.lineTo(this.l/2 - 25, this.w/2 - 8);
        ctx.lineTo(this.l/2 - 25, -this.w/2 + 8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-this.l/2 + 10, -this.w/2 + 5);
        ctx.lineTo(-this.l/2 + 10, this.w/2 - 5);
        ctx.lineTo(-this.l/2 + 20, this.w/2 - 8);
        ctx.lineTo(-this.l/2 + 20, -this.w/2 + 8);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
        const beamLength = 150;
        const beamSpread = 60;
        const headlightHeight = 8;
        const headlightY1 = -this.w/2 + 4 + headlightHeight/2;
        const headlightY2 = this.w/2 - 12 + headlightHeight/2;

        ctx.beginPath();
        ctx.moveTo(this.l/2, headlightY1);
        ctx.lineTo(this.l/2 + beamLength, headlightY1 - beamSpread);
        ctx.lineTo(this.l/2 + beamLength, headlightY2 + beamSpread);
        ctx.lineTo(this.l/2, headlightY2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#f1c40f';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 15;
        ctx.fillRect(this.l/2 - 4, -this.w/2 + 4, 4, 8);
        ctx.fillRect(this.l/2 - 4, this.w/2 - 12, 4, 8);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-this.l/2, -this.w/2 + 4, 2, 8);
        ctx.fillRect(-this.l/2, this.w/2 - 12, 2, 8);

        ctx.restore();
    }
}

class PlayerCar {
    constructor(x, y, angleDeg) {
        this.reset(x, y, angleDeg);
    }

    reset(x, y, angleDeg) {
        this.x = x;
        this.y = y;
        this.angle = angleDeg * (Math.PI / 180);
        this.speed = 0;

        // Wektor prędkości dla zaawansowanej fizyki
        this.velocityX = 0;
        this.velocityY = 0;
        this.angularVelocity = 0; // Prędkość rotacji

        this.steeringAngle = 0;
        this.w = CONFIG.carWidth;
        this.l = CONFIG.carLength;
        this.engineOn = true;
        this.enterKeyProcessed = false;
        this.steeringMode = 'DRIVING';

        // Tryb zimowy - domyślnie wyłączony (bezpieczna jazda)
        if (this.winterMode === undefined) {
            this.winterMode = false;
        }

        // Stan poślizgu
        this.isDrifting = false;
        this.driftAngle = 0; // Kąt poślizgu
        this.skidMarks = []; // Ślady opon

        // Hamulec ręczny - startowanie
        this.handbrakeBoost = 0; // Zgromadzona moc (0-1)
        this.previousSpaceKey = false; // Czy w poprzedniej klatce trzymał SPACE
    }

    toggleSteeringMode() {
        if (this.steeringMode === 'DRIVING') {
            this.steeringMode = 'PARKING';
            document.getElementById('toggle-steering-mode').innerText = 'Asystent Kierownicy: WYŁ';
        } else {
            this.steeringMode = 'DRIVING';
            document.getElementById('toggle-steering-mode').innerText = 'Asystent Kierownicy: WŁ';
        }
    }

    toggleWinterMode() {
        this.winterMode = !this.winterMode;
        const btn = document.getElementById('toggle-winter-mode');
        if (this.winterMode) {
            btn.innerText = 'Poślizgi Zimowe: WŁ';
        } else {
            btn.innerText = 'Poślizgi Zimowe: WYŁ';
            // Wyczyść ślady opon przy wyłączeniu trybu zimowego
            this.skidMarks = [];
            this.isDrifting = false;
            // Zatrzymaj dźwięk poślizgu
            if (driftOscillator) {
                stopDriftSound();
            }
        }
    }

    update(input, deltaTime) {
        // Engine toggle
        if (input.keys.Enter) {
            if (!this.enterKeyProcessed) {
                this.engineOn = !this.engineOn;
                this.enterKeyProcessed = true;
            }
        } else {
            this.enterKeyProcessed = false;
        }

        // Wybierz fizykę w zależności od trybu
        if (this.winterMode) {
            this.updateWinterPhysics(input, deltaTime);
        } else {
            this.updateSimplePhysics(input, deltaTime);
        }
    }

    // === PROSTA FIZYKA (bezpieczna, przewidywalna) ===
    updateSimplePhysics(input, deltaTime) {
        // Normalize deltaTime to 60 FPS (deltaTime * 60 gives us a frame multiplier)
        const dt = deltaTime * 60;

        // === HAMULEC RĘCZNY - STARTOWANIE ===
        const isHandbraking = input.keys.Space;
        const isThrottling = input.keys.ArrowUp || input.keys.ArrowDown;

        // Budowanie boost gdy trzyma hamulec + gaz
        if (isHandbraking && isThrottling && this.engineOn) {
            this.handbrakeBoost = Math.min(CONFIG.handbrakeBoostMax, this.handbrakeBoost + CONFIG.handbrakeBoostRate * dt);

            // Hamuj auto podczas budowania boost
            this.speed *= Math.pow(0.8, dt); // Mocne hamowanie
            if (Math.abs(this.speed) < 0.5) this.speed = 0;

            // Dźwięk silnika na wysokich obrotach
            if (!engineRevOscillator) {
                startEngineRevSound(this.handbrakeBoost);
            } else {
                updateEngineRevSound(this.handbrakeBoost);
            }
        }
        // Jeśli puścił hamulec (ale dalej trzyma gaz) - LAUNCH!
        else if (!isHandbraking && this.previousSpaceKey && isThrottling && this.handbrakeBoost > 0.1) {
            // MOCNY START!
            const boostDirection = input.keys.ArrowUp ? 1 : -1;
            this.speed += boostDirection * this.handbrakeBoost * CONFIG.handbrakeBoostMultiplier;
            this.handbrakeBoost = 0; // Zużyte!

            // Zatrzymaj dźwięk silnika
            if (engineRevOscillator) {
                stopEngineRevSound();
            }
        }
        // Normalne zmniejszanie boost gdy nie używany
        else if (this.handbrakeBoost > 0) {
            this.handbrakeBoost = Math.max(0, this.handbrakeBoost - CONFIG.handbrakeBoostDecay * dt);

            // Zatrzymaj dźwięk gdy boost spada
            if (this.handbrakeBoost < 0.1 && engineRevOscillator) {
                stopEngineRevSound();
            }
        }

        this.previousSpaceKey = isHandbraking;

        // === NORMALNA FIZYKA ===
        if (this.engineOn) {
            // 1. Acceleration (tylko jeśli NIE buduje boost)
            if (!(isHandbraking && isThrottling)) {
                if (input.keys.ArrowUp) this.speed += CONFIG.acceleration * dt;
                else if (input.keys.ArrowDown) this.speed -= CONFIG.acceleration * dt;
            }

            // 2. Braking (tylko jeśli NIE trzyma gazu równocześnie)
            if (input.keys.Space && !isThrottling) {
                if (this.speed > 0) this.speed -= CONFIG.brakingForce * dt;
                else if (this.speed < 0) this.speed += CONFIG.brakingForce * dt;
                if (Math.abs(this.speed) < 0.5) this.speed = 0;
            }
        }

        // 3. Friction
        if (!input.keys.ArrowUp && !input.keys.ArrowDown && !input.keys.Space) {
            this.speed *= Math.pow(1 - CONFIG.friction, dt);
            if (Math.abs(this.speed) < 0.05) this.speed = 0;
        }
        if (!this.engineOn) {
            this.speed *= Math.pow(1 - CONFIG.friction, dt);
            if (Math.abs(this.speed) < 0.05) this.speed = 0;
        }

        // Limits
        if (this.speed > CONFIG.maxSpeed) this.speed = CONFIG.maxSpeed;
        if (this.speed < CONFIG.maxReverseSpeed) this.speed = CONFIG.maxReverseSpeed;

        // 4. Steering
        if (this.engineOn) {
            if (input.keys.ArrowLeft) {
                this.steeringAngle -= CONFIG.steerSpeed * dt;
            } else if (input.keys.ArrowRight) {
                this.steeringAngle += CONFIG.steerSpeed * dt;
            } else {
                if (this.steeringMode === 'DRIVING') {
                    // Auto-straighten in Driving Mode
                    if (this.steeringAngle > 0) {
                        this.steeringAngle -= CONFIG.steerRestoringDriving * dt;
                        if (this.steeringAngle < 0) this.steeringAngle = 0;
                    } else if (this.steeringAngle < 0) {
                        this.steeringAngle += CONFIG.steerRestoringDriving * dt;
                        if (this.steeringAngle > 0) this.steeringAngle = 0;
                    }
                }
            }
        }

        // Clamp steer
        if (this.steeringAngle > CONFIG.maxSteerAngle) this.steeringAngle = CONFIG.maxSteerAngle;
        if (this.steeringAngle < -CONFIG.maxSteerAngle) this.steeringAngle = -CONFIG.maxSteerAngle;

        // 5. Movement - prosty model kinematyczny
        if (Math.abs(this.speed) > 0.05) {
            const L = CONFIG.wheelBase;
            const oldAngle = this.angle;

            this.angle += (this.speed / L) * Math.tan(this.steeringAngle) * dt;

            const rearAxleX = this.x - (L / 2) * Math.cos(oldAngle);
            const rearAxleY = this.y - (L / 2) * Math.sin(oldAngle);

            const newRearAxleX = rearAxleX + this.speed * Math.cos(oldAngle) * dt;
            const newRearAxleY = rearAxleY + this.speed * Math.sin(oldAngle) * dt;

            this.x = newRearAxleX + (L / 2) * Math.cos(this.angle);
            this.y = newRearAxleY + (L / 2) * Math.sin(this.angle);
        } else {
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;
        }

        // Synchronizuj velocityX/Y dla kompatybilności
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.angularVelocity = 0;
        this.isDrifting = false;
        this.driftAngle = 0;
    }

    // === ZAAWANSOWANA FIZYKA Z POŚLIZGAMI (tryb zimowy) ===
    updateWinterPhysics(input, deltaTime) {
        // Normalize deltaTime to 60 FPS (deltaTime * 60 gives us a frame multiplier)
        const dt = deltaTime * 60;

        // === HAMULEC RĘCZNY - STARTOWANIE ===
        const isHandbraking = input.keys.Space;
        const isThrottling = input.keys.ArrowUp || input.keys.ArrowDown;

        // Budowanie boost gdy trzyma hamulec + gaz
        if (isHandbraking && isThrottling && this.engineOn) {
            this.handbrakeBoost = Math.min(CONFIG.handbrakeBoostMax, this.handbrakeBoost + CONFIG.handbrakeBoostRate * dt);

            // Hamuj auto podczas budowania boost
            this.velocityX *= Math.pow(0.75, dt);
            this.velocityY *= Math.pow(0.75, dt);
            const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            if (currentSpeed < 0.5) {
                this.velocityX = 0;
                this.velocityY = 0;
            }

            // Dźwięk silnika na wysokich obrotach
            if (!engineRevOscillator) {
                startEngineRevSound(this.handbrakeBoost);
            } else {
                updateEngineRevSound(this.handbrakeBoost);
            }
        }
        // Jeśli puścił hamulec (ale dalej trzyma gaz) - LAUNCH!
        else if (!isHandbraking && this.previousSpaceKey && isThrottling && this.handbrakeBoost > 0.1) {
            // MOCNY START!
            const boostDirection = input.keys.ArrowUp ? 1 : -1;
            const boostPower = boostDirection * this.handbrakeBoost * CONFIG.handbrakeBoostMultiplier;

            // Dodaj boost w kierunku samochodu
            this.velocityX += Math.cos(this.angle) * boostPower;
            this.velocityY += Math.sin(this.angle) * boostPower;

            this.handbrakeBoost = 0; // Zużyte!

            // Zatrzymaj dźwięk silnika
            if (engineRevOscillator) {
                stopEngineRevSound();
            }
        }
        // Normalne zmniejszanie boost gdy nie używany
        else if (this.handbrakeBoost > 0) {
            this.handbrakeBoost = Math.max(0, this.handbrakeBoost - CONFIG.handbrakeBoostDecay * dt);

            // Zatrzymaj dźwięk gdy boost spada
            if (this.handbrakeBoost < 0.1 && engineRevOscillator) {
                stopEngineRevSound();
            }
        }

        this.previousSpaceKey = isHandbraking;

        // 1. Sterowanie - kąt skrętu
        if (this.engineOn) {
            if (input.keys.ArrowLeft) {
                this.steeringAngle -= CONFIG.steerSpeed * dt;
            } else if (input.keys.ArrowRight) {
                this.steeringAngle += CONFIG.steerSpeed * dt;
            } else {
                if (this.steeringMode === 'DRIVING') {
                    // Auto-prostowanie w trybie jazdy
                    if (this.steeringAngle > 0) {
                        this.steeringAngle -= CONFIG.steerRestoringDriving * dt;
                        if (this.steeringAngle < 0) this.steeringAngle = 0;
                    } else if (this.steeringAngle < 0) {
                        this.steeringAngle += CONFIG.steerRestoringDriving * dt;
                        if (this.steeringAngle > 0) this.steeringAngle = 0;
                    }
                }
            }
        }

        // Ogranicz kąt skrętu - zawsze maksymalny, niezależnie od prędkości
        // Fizyka zadba o poślizg przy dużych prędkościach!
        this.steeringAngle = Math.max(-CONFIG.maxSteerAngle, Math.min(CONFIG.maxSteerAngle, this.steeringAngle));

        // 2. Akceleracja i hamowanie
        const isBraking = input.keys.Space && !isThrottling; // Hamowanie tylko bez gazu
        let throttle = 0;

        // Akceleracja tylko jeśli NIE buduje boost (hamulec + gaz)
        if (this.engineOn && !(isHandbraking && isThrottling)) {
            if (input.keys.ArrowUp) throttle = CONFIG.acceleration * dt;
            else if (input.keys.ArrowDown) throttle = -CONFIG.acceleration * dt;
        }

        // 3. Oblicz prędkość w lokalnym układzie samochodu (forward/lateral)
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // Prędkość w kierunku "do przodu" i "na boki" względem auta
        const forwardVelocity = this.velocityX * cos + this.velocityY * sin;
        const lateralVelocity = -this.velocityX * sin + this.velocityY * cos;

        // 4. Zastosuj akcelerację do przodu
        let newForwardVelocity = forwardVelocity + throttle;

        // 5. Oblicz siłę boczną z powodu skrętu kół
        // FIZYKA: Siła odśrodkowa F = m*v²/r, więc rośnie KWADRATOWO z prędkością!
        const baseLateralVelocity = newForwardVelocity * Math.tan(this.steeringAngle);

        // Dodatkowy mnożnik dla dużych prędkości (symuluje v² efekt)
        const speedMagnitude = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        const speedSquaredFactor = 1.0 + (speedMagnitude / CONFIG.maxSpeed) * CONFIG.lateralForceMultiplier;

        const desiredLateralVelocity = baseLateralVelocity * speedSquaredFactor;

        // 6. Określ przyczepność opon (grip)
        let currentGrip = isBraking ? CONFIG.tireGripBraking : CONFIG.tireGrip;

        // 7. Sprawdź warunek poślizgu
        const lateralChange = desiredLateralVelocity - lateralVelocity;

        // Jeśli zmiana prędkości bocznej jest zbyt duża = poślizg!
        const lateralAcceleration = Math.abs(lateralChange);

        // Przyczepność rośnie tylko liniowo z prędkością (nie kwadratowo!)
        // To sprawia że przy dużych prędkościach łatwo przekroczyć limit
        const maxGrip = currentGrip * Math.abs(newForwardVelocity);

        if (lateralAcceleration > maxGrip && speedMagnitude > CONFIG.driftThreshold) {
            // POŚLIZG!
            this.isDrifting = true;

            // Ograniczona zmiana prędkości bocznej - opony nie nadążają
            const actualLateralChange = Math.sign(lateralChange) * maxGrip;
            const newLateralVelocity = lateralVelocity + actualLateralChange;

            // Kąt poślizgu
            this.driftAngle = Math.atan2(newLateralVelocity, newForwardVelocity);

            // Podczas poślizgu - wolniejsza rotacja
            this.angularVelocity = (newForwardVelocity / CONFIG.wheelBase) * Math.tan(this.steeringAngle) * currentGrip * dt;

            // Zastosuj tarcie podczas poślizgu
            newForwardVelocity *= Math.pow(CONFIG.driftFriction, dt);

            // Konwersja z powrotem do współrzędnych globalnych
            this.velocityX = newForwardVelocity * cos - newLateralVelocity * sin;
            this.velocityY = newForwardVelocity * sin + newLateralVelocity * cos;

            // Dodaj ślad opon podczas poślizgu
            if (Math.abs(this.driftAngle) > 0.15) { // Minimum kąt dla śladów
                this.addSkidMark();
            }

            // Dźwięk piszczących opon - intensywność zależy od kąta poślizgu
            const driftIntensity = Math.min(1.0, Math.abs(this.driftAngle) / 0.5);
            if (!driftOscillator) {
                startDriftSound(driftIntensity);
            } else {
                updateDriftSound(driftIntensity);
            }
        } else {
            // Normalna jazda - pełna przyczepność
            this.isDrifting = false;
            this.driftAngle = 0;

            const newLateralVelocity = desiredLateralVelocity;

            // Normalna rotacja
            this.angularVelocity = (newForwardVelocity / CONFIG.wheelBase) * Math.tan(this.steeringAngle) * dt;

            // Konwersja z powrotem do współrzędnych globalnych
            this.velocityX = newForwardVelocity * cos - newLateralVelocity * sin;
            this.velocityY = newForwardVelocity * sin + newLateralVelocity * cos;

            // Zatrzymaj dźwięk poślizgu
            if (driftOscillator) {
                stopDriftSound();
            }
        }

        // 8. Hamowanie
        if (isBraking) {
            const brakingDeceleration = CONFIG.brakingForce * dt;
            const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);

            if (currentSpeed > 0.1) {
                const brakeMultiplier = Math.max(0, (currentSpeed - brakingDeceleration) / currentSpeed);
                this.velocityX *= brakeMultiplier;
                this.velocityY *= brakeMultiplier;
            } else {
                this.velocityX = 0;
                this.velocityY = 0;
            }
        }

        // 9. Tarcie naturalne
        if (!input.keys.ArrowUp && !input.keys.ArrowDown && !isBraking) {
            this.velocityX *= Math.pow(1 - CONFIG.friction, dt);
            this.velocityY *= Math.pow(1 - CONFIG.friction, dt);
        }

        if (!this.engineOn) {
            this.velocityX *= Math.pow(1 - CONFIG.friction, dt);
            this.velocityY *= Math.pow(1 - CONFIG.friction, dt);
        }

        // Zatrzymaj jeśli bardzo wolno
        const finalSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (finalSpeed < 0.05) {
            this.velocityX = 0;
            this.velocityY = 0;
            this.angularVelocity = 0;
        }

        // 10. Ogranicz maksymalną prędkość
        if (finalSpeed > CONFIG.maxSpeed) {
            const ratio = CONFIG.maxSpeed / finalSpeed;
            this.velocityX *= ratio;
            this.velocityY *= ratio;
        }

        // 11. Aktualizuj rotację
        this.angle += this.angularVelocity;
        this.angularVelocity *= Math.pow(CONFIG.angularDamping, dt);

        // 12. Aktualizuj pozycję
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        // 13. Aktualizuj zmienną speed dla kompatybilności
        this.speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY) *
                     Math.sign(Math.cos(this.angle) * this.velocityX + Math.sin(this.angle) * this.velocityY);

        // 14. Zarządzaj śladami opon (max 200 punktów)
        if (this.skidMarks.length > 200) {
            this.skidMarks.shift();
        }
    }

    addSkidMark() {
        // Dodaj ślad pod tylnymi kołami
        const rearAxleOffset = -CONFIG.wheelBase / 2;
        const wheelOffset = CONFIG.carWidth / 3;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // Lewe tylne koło
        const leftX = this.x + (rearAxleOffset * cos - wheelOffset * sin);
        const leftY = this.y + (rearAxleOffset * sin + wheelOffset * cos);

        // Prawe tylne koło
        const rightX = this.x + (rearAxleOffset * cos + wheelOffset * sin);
        const rightY = this.y + (rearAxleOffset * sin - wheelOffset * cos);

        this.skidMarks.push({ x: leftX, y: leftY, angle: this.angle, alpha: 1.0 });
        this.skidMarks.push({ x: rightX, y: rightY, angle: this.angle, alpha: 1.0 });
    }

    drawSkidMarks(ctx) {
        // Rysuj ślady opon
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 30, 30, 0.7)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (let i = 1; i < this.skidMarks.length; i++) {
            const prev = this.skidMarks[i - 1];
            const curr = this.skidMarks[i];

            // Zanikaj starsze ślady
            const fadeIndex = Math.max(0, this.skidMarks.length - 150);
            const alpha = i < fadeIndex ? 0.3 : 0.7;

            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Symmetrical positions for wheels and lights
        const wheelCenterY = 15;
        const wheelTopY_L = -wheelCenterY - CONFIG.wheelWidth / 2;
        const wheelTopY_R = wheelCenterY - CONFIG.wheelWidth / 2;

        const headlightCenterY = 12;
        const headlightHeight = 10;
        const headlightTopY_L = -headlightCenterY - headlightHeight / 2;
        const headlightTopY_R = headlightCenterY - headlightHeight / 2;


        // Draw Projection (Trajectory)
        // Draw faintly where the car is going
        if (this.engineOn && Math.abs(this.steeringAngle) > 0.05) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();

            const steer = this.steeringAngle;
            const wx = CONFIG.wheelBase/2;

            // Left Wheel projection
            let wy_L = -wheelCenterY;
            ctx.moveTo(wx, wy_L);
            ctx.lineTo(wx + Math.cos(steer)*100, wy_L + Math.sin(steer)*100);

            // Right Wheel projection
            let wy_R = wheelCenterY;
            ctx.moveTo(wx, wy_R);
            ctx.lineTo(wx + Math.cos(steer)*100, wy_R + Math.sin(steer)*100);

            ctx.stroke();
            ctx.restore();
        }

        // --- WHEELS ---
        ctx.fillStyle = '#222';
        // Rear
        this.drawWheel(ctx, -CONFIG.wheelBase/2, wheelTopY_L, 0);
        this.drawWheel(ctx, -CONFIG.wheelBase/2, wheelTopY_R, 0);
        // Front
        this.drawWheel(ctx, CONFIG.wheelBase/2, wheelTopY_L, this.steeringAngle);
        this.drawWheel(ctx, CONFIG.wheelBase/2, wheelTopY_R, this.steeringAngle);

        // --- BODY ---
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.roundRect(-CONFIG.carLength/2, -CONFIG.carWidth/2, CONFIG.carLength, CONFIG.carWidth, 6);
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Roof
        ctx.fillStyle = '#85c1e9';
        ctx.beginPath();
        ctx.roundRect(-CONFIG.carLength/4, -CONFIG.carWidth/2 + 6, CONFIG.carLength/2, CONFIG.carWidth - 12, 3);
        ctx.fill();

        // Windshield indication (Front)
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(CONFIG.carLength/4, -CONFIG.carWidth/2 + 7, 5, CONFIG.carWidth - 14);

        if (this.engineOn) {
            // Lights
            const isReversing = this.speed < -0.1; // Cofanie
            const isBraking = input.keys.Space || (this.speed > 0 && input.keys.ArrowDown) || (this.speed < 0 && input.keys.ArrowUp) || isReversing;

            // Brake Lights (also light up when reversing)
            ctx.fillStyle = isBraking ? '#ff0000' : '#8b0000';
            if(isBraking) { ctx.shadowColor = '#f00'; ctx.shadowBlur = 15; }
            ctx.beginPath();
            ctx.rect(-CONFIG.carLength/2, headlightTopY_L, 3, headlightHeight);
            ctx.rect(-CONFIG.carLength/2, headlightTopY_R, 3, headlightHeight);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Headlights (Beams always on if engine is on)
            ctx.fillStyle = '#f1c40f';
            { // Removed if (this.speed > 0.5)
                 ctx.save();
                 ctx.globalCompositeOperation = 'screen';
                 ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
                 const beamLength = 150;
                 const beamSpread = 60;
                 ctx.beginPath();
                 ctx.moveTo(CONFIG.carLength/2, headlightTopY_L + headlightHeight/2);
                 ctx.lineTo(CONFIG.carLength/2 + beamLength, (headlightTopY_L + headlightHeight/2) - beamSpread);
                 ctx.lineTo(CONFIG.carLength/2 + beamLength, (headlightTopY_R + headlightHeight/2) + beamSpread);
                 ctx.lineTo(CONFIG.carLength/2, headlightTopY_R + headlightHeight/2);
                 ctx.fill();
                 ctx.restore();
                 ctx.fillStyle = '#fff'; // Bright core
            }
            ctx.beginPath();
            ctx.rect(CONFIG.carLength/2 - 2, headlightTopY_L, 2, headlightHeight);
            ctx.rect(CONFIG.carLength/2 - 2, headlightTopY_R, 2, headlightHeight);
            ctx.fill();
        }

        // --- DELIVEROO TEXT ON ROOF ---
        ctx.save();
        ctx.fillStyle = '#000000'; // Black text
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Draw text along the roof (from back to front)
        ctx.fillText('DELIVEROO', 0, 0);
        ctx.restore();

        ctx.restore();
    }

    drawWheel(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        // Tire tread
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-CONFIG.wheelLength/2, 0, CONFIG.wheelLength, CONFIG.wheelWidth);
        // Rim highlight
        ctx.fillStyle = '#555';
        ctx.fillRect(-2, 2, 4, 6);
        ctx.restore();
    }
}
