const CONFIG = {
    // Car dimensions (approx 1px = 2cm scale)
    carWidth: 44,
    carLength: 90,
    wheelBase: 60,
    wheelWidth: 10,
    wheelLength: 20,

    // Physics - adjusted for "High Speed" potential
    // We map internal speed 1.0 to approx 15 km/h
    kmhFactor: 8,
    maxSpeed: 18.0, // ~216 km/h theoretical max
    maxReverseSpeed: -5.0, // ~60 km/h

    // Car mode: 'normal' (city car) or 'sport' (performance car)
    carMode: 'normal', // Default: normal city car
    accelerationNormal: 0.05, // ~10 seconds to 100 km/h (city car)
    accelerationSport: 0.15,   // ~1.4 seconds to 100 km/h (sport car)
    get acceleration() {
        return this.carMode === 'sport' ? this.accelerationSport : this.accelerationNormal;
    },

    friction: 0.06,
    brakingForce: 0.5,

    // Steering
    maxSteerAngle: 0.65, // ~37 degrees
    steerSpeed: 0.03, // Slower steering change for weight feeling
    steerRestoringDriving: 0.02, // Auto-center speed for Driving Mode

    // Handbrake Start (Launch Control)
    handbrakeBoostRate: 0.018, // Jak szybko buduje się boost (obroty silnika)
    handbrakeBoostMax: 1.0, // Maksymalny poziom boost
    handbrakeBoostMultiplier: 6.0, // Mnożnik przyspieszenia przy starcie - MEGA BOOST!
    handbrakeBoostDecay: 0.05, // Jak szybko spada boost gdy nie używany

    // Drift Physics (New!)
    tireGrip: 0.85, // Przyczepność opon (0.0 = brak, 1.0 = perfekcyjna) - ZMNIEJSZONE dla łatwiejszego poślizgu
    tireGripBraking: 0.65, // Zmniejszona przyczepność podczas hamowania - BARDZIEJ zmniejszone
    driftThreshold: 2.0, // Minimalna prędkość dla poślizgu - OBNIŻONE
    driftFriction: 0.98, // Tarcie podczas poślizgu (wyższe = wolniejsze hamowanie)
    angularDamping: 0.94, // Tłumienie rotacji podczas poślizgu - więcej rotacji
    lateralForceMultiplier: 2.0, // Mnożnik siły bocznej (symuluje v² zamiast v) - ZWIĘKSZONE!

    // Interaction
    curbSafeSpeed: 1.5 // ~18 km/h. Below this, curbs bounce. Above, crash.
};
