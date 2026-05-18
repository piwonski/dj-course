const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBonkSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

function playCurbSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

// Dźwięk piszczących opon podczas poślizgu
let driftOscillator = null;
let driftGain = null;

function startDriftSound(intensity = 1.0) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Jeśli już gra, nie twórz nowego
    if (driftOscillator) return;

    driftOscillator = audioCtx.createOscillator();
    driftGain = audioCtx.createGain();

    driftOscillator.type = 'sawtooth';
    driftOscillator.frequency.setValueAtTime(180 + intensity * 100, audioCtx.currentTime);

    driftGain.gain.setValueAtTime(0, audioCtx.currentTime);
    driftGain.gain.linearRampToValueAtTime(0.15 * intensity, audioCtx.currentTime + 0.05);

    driftOscillator.connect(driftGain);
    driftGain.connect(audioCtx.destination);
    driftOscillator.start();
}

function updateDriftSound(intensity = 1.0) {
    if (!driftOscillator || !driftGain) return;

    const now = audioCtx.currentTime;
    driftOscillator.frequency.setValueAtTime(180 + intensity * 100, now);
    driftGain.gain.setValueAtTime(0.15 * intensity, now);
}

function stopDriftSound() {
    if (!driftOscillator || !driftGain) return;

    const now = audioCtx.currentTime;
    driftGain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    setTimeout(() => {
        if (driftOscillator) {
            driftOscillator.stop();
            driftOscillator = null;
            driftGain = null;
        }
    }, 150);
}

// Dźwięk silnika na wysokich obrotach (revving)
let engineRevOscillator = null;
let engineRevGain = null;

function startEngineRevSound(revLevel = 0.5) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Jeśli już gra, nie twórz nowego
    if (engineRevOscillator) return;

    engineRevOscillator = audioCtx.createOscillator();
    engineRevGain = audioCtx.createGain();

    engineRevOscillator.type = 'sawtooth';
    engineRevOscillator.frequency.setValueAtTime(80 + revLevel * 120, audioCtx.currentTime);

    engineRevGain.gain.setValueAtTime(0, audioCtx.currentTime);
    engineRevGain.gain.linearRampToValueAtTime(0.12 * revLevel, audioCtx.currentTime + 0.05);

    engineRevOscillator.connect(engineRevGain);
    engineRevGain.connect(audioCtx.destination);
    engineRevOscillator.start();
}

function updateEngineRevSound(revLevel = 0.5) {
    if (!engineRevOscillator || !engineRevGain) return;

    const now = audioCtx.currentTime;
    engineRevOscillator.frequency.setValueAtTime(80 + revLevel * 120, now);
    engineRevGain.gain.setValueAtTime(0.12 * revLevel, now);
}

function stopEngineRevSound() {
    if (!engineRevOscillator || !engineRevGain) return;

    const now = audioCtx.currentTime;
    engineRevGain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    setTimeout(() => {
        if (engineRevOscillator) {
            engineRevOscillator.stop();
            engineRevOscillator = null;
            engineRevGain = null;
        }
    }, 200);
}


function playLevelCompleteSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.connect(audioCtx.destination);

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        osc.connect(gain);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.1);
    });
}
