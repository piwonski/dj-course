class Game {
    constructor() {
        this.shakeTimer = 0;
        this.levels = [];
        this.currentLevelIdx = 0;
        this.state = 'TITLE_SCREEN';
        this.bonkPos = {x:0, y:0};
        this.player = new PlayerCar(0,0,0);
        this.currentParkingZones = [];
        this.isMusicOn = true;

        // Title screen animation
        this.titleTime = 0;
        this.titlePressVisible = true;
        this.titleBlinkTimer = 0;
        this.titleButtonHover = false;

        this.updateUI();
    }

    updateUI() {
        const btn = document.getElementById('toggle-music-btn');
        btn.innerText = `Dźwięk: ${this.isMusicOn ? 'WŁ' : 'WYŁ'}`;
    }

    populateLevelButtons() {
        const container = document.getElementById('levels-container');
        container.innerHTML = ''; // Clear old buttons
        this.levels.forEach((level, index) => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.innerText = `${index + 1}. ${level.name}`;
            btn.onclick = () => this.loadLevel(index);
            container.appendChild(btn);
        });
    }

    toggleBackgroundMusic() {
        const music = document.getElementById('background-music');
        const btn = document.getElementById('toggle-music-btn');
        this.isMusicOn = !this.isMusicOn;
        if (this.isMusicOn) {
            music.play();
            btn.innerText = 'Dźwięk: WŁ';
        } else {
            music.pause();
            btn.innerText = 'Dźwięk: WYŁ';
        }
    }

    defineLevels() {
        return [
            {
                name: "Pusty Parking",
                type: 'lot',
                start: { x: 100, y: 360, angle: 0 },
                obstacles: [ new Pillar(255, 430), new Pillar(395, 430), new Pillar(465, 430), new Pillar(605, 430) ],
                cars: [],
                parkingZones: [ new ParkingZone({x: 395, y: 260, w: 70, l: 120, angle: 90}) ],
                curbs: [
                    new Curb(canvas.width/2, 20, 40, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height-20, 40, canvas.width, 0),
                    // new Curb(20, canvas.height/2, canvas.height, 40, 90 * Math.PI/180),
                    // new Curb(canvas.width-20, canvas.height/2, canvas.height, 40, 90 * Math.PI/180)
                ]
            },
            {
                name: "Parking",
                type: 'lot',
                start: { x: 100, y: 360, angle: 0 },
                obstacles: [ new Pillar(255, 430), new Pillar(395, 430), new Pillar(465, 430), new Pillar(605, 430) ],
                cars: [
                    new ObstacleCar({x: 255, y: 260, angle: 90, type: 'suv', color: '#8e44ad'}),
                    new ObstacleCar({x: 395, y: 260, angle: 90, type: 'sedan', color: '#c0392b'}),
                    new ObstacleCar({x: 465, y: 260, angle: 90, type: 'compact', color: '#27ae60'}),
                    new ObstacleCar({x: 605, y: 260, angle: 90, type: 'suv', color: '#f39c12'}),
                    new ObstacleCar({x: 325, y: 460, angle: 90, type: 'compact', color: '#16a085'}),
                    new ObstacleCar({x: 535, y: 460, angle: 90, type: 'sedan', color: '#2980b9'})
                ],
                parkingZones: [
                    new ParkingZone({x: 325, y: 260, w: 70, l: 120, angle: 90}),
                    new ParkingZone({x: 535, y: 260, w: 70, l: 120, angle: 90})
                ],
                curbs: [
                    new Curb(canvas.width/2, 20, 40, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height-20, 40, canvas.width, 0),
                    // new Curb(20, canvas.height/2, canvas.height, 40, 90 * Math.PI/180),
                    // new Curb(canvas.width-20, canvas.height/2, canvas.height, 40, 90 * Math.PI/180)
                ]
            },
            {
                name: "Parking",
                type: 'lot',
                start: { x: 100, y: 360, angle: 0 },
                obstacles: [],
                cars: [
                    new ObstacleCar({x: 255, y: 267, angle: 86, type: 'suv', color: '#298049'}),
                    new ObstacleCar({x: 395, y: 262, angle: 94, type: 'suv', color: '#34495e'}),
                ],
                parkingZones: [
                    new ParkingZone({x: 325, y: 260, w: 70, l: 120, angle: 90})
                ],
                curbs: [
                    new Curb(canvas.width/2, 20, 40, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height-20, 40, canvas.width, 0),
                ]
            },
            {
                name: "Parking",
                type: 'lot',
                start: { x: 100, y: 360, angle: 0 },
                obstacles: [],
                cars: [
                    new ObstacleCar({x: 265, y: 267, angle: 81, type: 'suv', color: '#8e44ad'}),
                    new ObstacleCar({x: 384, y: 262, angle: 76, type: 'suv', color: '#c0392b'}),
                ],
                parkingZones: [
                    new ParkingZone({x: 325, y: 260, w: 70, l: 120, angle: 90})
                ],
                curbs: [
                    new Curb(canvas.width/2, 20, 40, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height-20, 40, canvas.width, 0),
                ]
            },
            {
                name: "Parking",
                type: 'lot',
                start: { x: 100, y: 360, angle: 0 },
                obstacles: [],
                cars: [
                    new ObstacleCar({x: 265, y: 267, angle: 286, type: 'suv', color: '#3288bd'}),
                    new ObstacleCar({x: 384, y: 262, angle: 296, type: 'suv', color: '#a974cf'}),
                    new ObstacleCar({x: 465, y: 260, angle: 270, type: 'compact', color: '#990212'}),
                    new ObstacleCar({x: 588, y: 269, angle: 293, type: 'suv', color: '#f39c12'}),
                    new ObstacleCar({x: 287, y: 460, angle: 79, type: 'compact', color: '#16a085'}),
                    new ObstacleCar({x: 572, y: 460, angle: 90, type: 'sedan', color: '#2980b9'})
                ],
                parkingZones: [
                    new ParkingZone({x: 325, y: 260, w: 70, l: 120, angle: 90}),
                    new ParkingZone({x: 535, y: 260, w: 70, l: 120, angle: 90}),
                    new ParkingZone({x: 325, y: 460, w: 70, l: 120, angle: 90}),
                    new ParkingZone({x: 535, y: 460, w: 70, l: 120, angle: 90}),
                ],
                curbs: [
                    new Curb(canvas.width/2, 20, 40, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height-20, 40, canvas.width, 0),
                ]
            },
            {
                name: "Ulica",
                type: 'street',
                start: { x: 100, y: canvas.height/2 + 35, angle: 0 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width, y: canvas.height/2 - 35, angle: 180, speed: -4, type: 'compact',color: '#9b59b6'}),
                    new NpcCar({x: canvas.width - 600, y: canvas.height/2 - 35, angle: 180, speed: -7, kind: 'aggressive', type: 'sedan', color: '#34495e'}),
                    new NpcCar({x: canvas.width - 300, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'suv', color: '#9b59b6'}),
                ],
                parkingZones: [ new ParkingZone({x: canvas.width - 100, y: canvas.height/2 + 35, w: 70, l: 130, angle: 0}) ],
                curbs: [
                    new Curb(canvas.width/2, canvas.height/2 - 120, 100, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height/2 + 120, 100, canvas.width, 0),
                ]
            },
            {
                name: "Ulica",
                type: 'street',
                start: { x: 100, y: canvas.height/2 + 35, angle: 0 },
                obstacles: [
                    new Pillar(605, canvas.height/2 + 35)
                ],
                cars: [
                    new NpcCar({x: canvas.width, y: canvas.height/2 - 35, angle: 180, speed: -4, type: 'compact',color: '#9b59b6'}),
                    new NpcCar({x: canvas.width - 600, y: canvas.height/2 - 35, angle: 180, speed: -7, kind: 'aggressive', type: 'sedan', color: '#34495e'}),
                    new NpcCar({x: canvas.width - 300, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'suv', color: '#9b59b6'}),
                ],
                parkingZones: [ new ParkingZone({x: canvas.width - 100, y: canvas.height/2 + 35, w: 70, l: 130, angle: 0}) ],
                curbs: [
                    new Curb(canvas.width/2, canvas.height/2 - 120, 100, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height/2 + 120, 100, canvas.width, 0),
                ]
            },
            {
                name: "Ulica",
                type: 'street',
                start: { x: 100, y: canvas.height/2 + 35, angle: 0 },
                obstacles: [
                    new Pillar(500, canvas.height/2 + 35),
                    new Pillar(500 + canvas.width/5, canvas.height/2 + 35),
                ],
                cars: [
                    new NpcCar({x: canvas.width, y: canvas.height/2 - 35, angle: 180, speed: -4, type: 'compact',color: '#9b59b6'}),
                    new NpcCar({x: canvas.width - 600, y: canvas.height/2 - 35, angle: 180, speed: -7, kind: 'aggressive', type: 'sedan', color: '#34495e'}),
                    new NpcCar({x: canvas.width - 300, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'suv', color: '#9b59b6'}),
                ],
                parkingZones: [ new ParkingZone({x: canvas.width - 100, y: canvas.height/2 + 35, w: 70, l: 130, angle: 0}) ],
                curbs: [
                    new Curb(canvas.width/2, canvas.height/2 - 120, 100, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height/2 + 120, 100, canvas.width, 0),
                ]
            },
            {
                name: "Ulica (Wyprzedzanie)",
                type: 'street',
                start: { x: 100, y: canvas.height/2 + 35, angle: 0 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width*3/4, y: canvas.height/2 - 35, angle: 180, speed: -6, color: '#9b59b6'}),
                    new NpcCar({x: canvas.width*3/4 + 300, y: canvas.height/2 - 35, angle: 180, speed: -8, kind: 'aggressive', type: 'suv', color: '#812c2c'}),
                    new NpcCar({x: canvas.width*1/4, y: canvas.height/2 - 35, angle: 180, speed: -6, type: 'compact', color: '#234923'}),
                    new NpcCar({x: 400, y: canvas.height/2 + 35, angle: 0, speed: 2, color: '#1abc9c'}),
                ],
                parkingZones: [ new ParkingZone({x: canvas.width - 100, y: canvas.height/2 + 35, w: 70, l: 100, angle: 0}) ],
                curbs: [
                    new Curb(canvas.width/2, canvas.height/2 - 120, 100, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height/2 + 120, 100, canvas.width, 0),
                ]
            },
            {
                name: "Ulica (Wyprzedzanie)",
                type: 'street',
                start: { x: 100, y: canvas.height/2 + 35, angle: 0 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width - 300, y: canvas.height/2 - 35, angle: 180, speed: -4, color: '#9b59b6'}),
                    new NpcCar({x: canvas.width - 100, y: canvas.height/2 - 35, angle: 180, speed: -5.5, kind: 'aggressive', type: 'suv', color: '#812c2c'}),
                    new NpcCar({x: canvas.width + 100, y: canvas.height/2 - 35, angle: 180, speed: -3, type: 'suv', color: '#9b59b6'}),
                    new NpcCar({x: canvas.width * 1/4, y: canvas.height/2 + 35, angle: 0, speed: 2, color: '#1abc9c'}),
                    new NpcCar({x: canvas.width * 2/4, y: canvas.height/2 + 35, angle: 0, speed: 2, color: '#225522'}),
                    new NpcCar({x: canvas.width * 3/4, y: canvas.height/2 + 35, angle: 0, speed: 2, color: '#726834'})
                ],
                parkingZones: [ new ParkingZone({x: canvas.width - 100, y: canvas.height/2 + 35, w: 70, l: 100, angle: 0}) ],
                curbs: [
                    new Curb(canvas.width/2, canvas.height/2 - 120, 100, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height/2 + 120, 100, canvas.width, 0),
                ]
            },
            {
                name: "Koperta",
                type: 'street',
                start: { x: 100, y: canvas.height/2 + 35, angle: 0 },
                obstacles: [],
                cars: [
                    new ObstacleCar({x: 600, y: canvas.height/2 + 35, angle: -3, type: 'suv', color: '#e67e22'}),
                    new ObstacleCar({x: 870, y: canvas.height/2 + 35, angle: 5, type: 'suv', color: '#8e44ad'})
                ],
                parkingZones: [ new ParkingZone({x: 735, y: canvas.height/2 + 35, w: 70, l: 130, angle: 0 }) ],
                curbs: [
                    new Curb(canvas.width/2, canvas.height/2 - 120, 100, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height/2 + 120, 100, canvas.width, 0),
                ]
            },
            {
                name: "Koperta na stresie",
                type: 'street',
                start: { x: 100, y: canvas.height/2 + 35, angle: 0 },
                obstacles: [],
                cars: [
                    new ObstacleCar({x: 600, y: canvas.height/2 + 35, angle: -3, type: 'suv', color: '#e67e22'}),
                    new ObstacleCar({x: 870, y: canvas.height/2 + 35, angle: 5, type: 'suv', color: '#8e44ad'}),
                    new NpcCar({x: canvas.width, y: canvas.height/2 - 35, angle: 180, speed: -3, type: 'suv', color: '#9b59b6'}),
                    new NpcCar({x: canvas.width * 3/4, y: canvas.height/2 - 35, angle: 180, speed: -3, type: 'suv', color: '#333333'}),
                    new NpcCar({x: canvas.width * 1/4, y: canvas.height/2 - 35, angle: 180, speed: -3, type: 'compact', color: '#ee8135'}),
                    new NpcCar({x: canvas.width * 2/4, y: canvas.height/2 - 35, angle: 180, speed: -3, type: 'compact', color: '#6e0c21'}),
                ],
                parkingZones: [ new ParkingZone({x: 735, y: canvas.height/2 + 35, w: 70, l: 130, angle: 0 }) ],
                curbs: [
                    new Curb(canvas.width/2, canvas.height/2 - 120, 100, canvas.width, 0),
                    new Curb(canvas.width/2, canvas.height/2 + 120, 100, canvas.width, 0),
                ]
            },
            {
                name: "Skrzyżowanie",
                type: 'street_crossing',
                start: { x: canvas.width/2 - 35, y: 100 + 35, angle: 90 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width - 0, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'sedan', color: '#990212'}),
                    new NpcCar({x: canvas.width - 250, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'compact', color: '#ee8135'}),
                    new NpcCar({x: canvas.width - 500, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'compact', color: '#6e0c21'}),
                    new NpcCar({x: canvas.width - 750, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'suv', color: '#9a8135'}),
                    new NpcCar({x: canvas.width - 1000, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'suv', color: '#e74c3c'}),
                    new NpcCar({x: canvas.width - 1250, y: canvas.height/2 - 35, angle: 180, speed: -5, type: 'compact', color: '#71797e'}),

                ],
                parkingZones: [
                    new ParkingZone({x: canvas.width/2 - 35, y: canvas.height - 100, w: 70, l: 130, angle: 90})
                ],
                curbs: [
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                ]
            },
            {
                name: "Skrzyżowanie",
                type: 'street_crossing',
                start: { x: canvas.width/2 - 35, y: 100 + 35, angle: 90 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width - 0, y: canvas.height/2 - 35, angle: 180, speed: -15, type: 'sedan', color: '#990212'}),
                    new NpcCar({x: canvas.width / 2, y: canvas.height/2 - 35, angle: 180, speed: -15, type: 'suv', color: '#cf8a36'}),
                ],
                parkingZones: [
                    new ParkingZone({x: canvas.width/2 - 35, y: canvas.height - 100, w: 70, l: 130, angle: 90})
                ],
                curbs: [
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                ]
            },
            {
                name: "Skrzyżowanie",
                type: 'street_crossing',
                start: { x: canvas.width/2 - 35, y: 100 + 35, angle: 90 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width - 0, y: canvas.height/2 - 35, angle: 180, speed: -15, type: 'sedan', color: '#990212'}),
                    new NpcCar({x: canvas.width / 2, y: canvas.height/2 - 35, angle: 180, speed: -15, type: 'suv', color: '#cf8a36'}),
                ],
                parkingZones: [
                    new ParkingZone({x: canvas.width/2 - 400, y: canvas.height/2 - 35, w: 130, l: 70, angle: 90})
                ],
                curbs: [
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                ]
            },
            {
                name: "Skrzyżowanie",
                type: 'street_crossing',
                start: { x: canvas.width/2 - 35, y: 100 + 35, angle: 90 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width - 0, y: canvas.height/2 - 35, angle: 180, speed: -15, type: 'sedan', color: '#990212'}),
                    new NpcCar({x: canvas.width / 2, y: canvas.height/2 - 35, angle: 180, speed: -15, type: 'suv', color: '#cf8a36'}),
                    new NpcCar({x: canvas.width / 2, y: canvas.height/2 + 35, angle: 0, speed: +15, type: 'compact', color: '#297122'}),
                    new NpcCar({x: 0, y: canvas.height/2 + 35, angle: 0, speed: +15, type: 'suv', color: '#912a4c'}),
                ],
                parkingZones: [
                    new ParkingZone({x: canvas.width/2 - 400, y: canvas.height/2 - 35, w: 130, l: 70, angle: 90})
                ],
                curbs: [
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                ]
            },
            {
                name: "Skrzyżowanie",
                type: 'street_crossing',
                start: { x: canvas.width/2 - 35, y: 100 + 35, angle: 90 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width - 0, y: canvas.height/2 - 35, angle: 180, speed: -20, type: 'sedan', kind: 'aggressive', color: '#990212'}),
                    new NpcCar({x: canvas.width / 2, y: canvas.height/2 - 35, angle: 180, speed: -20, type: 'suv', kind: 'aggressive', color: '#cf8a36'}),
                ],
                parkingZones: [
                    new ParkingZone({x: canvas.width/2 - 135, y: canvas.height/2 - 35, w: 130, l: 70, angle: 90})
                ],
                curbs: [
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                ]
            },
            {
                name: "Skrzyżowanie",
                type: 'street_crossing',
                start: { x: canvas.width/2 - 35, y: 100 + 35, angle: 90 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width / 4 * 0, y: canvas.height/2 - 35, angle: 180, speed: -20, type: 'suv', color: '#849292'}),
                    new NpcCar({x: canvas.width / 4 * 1, y: canvas.height/2 - 35, angle: 180, speed: -20, type: 'suv', color: '#b4b8ba'}),
                    new NpcCar({x: canvas.width / 4 * 2, y: canvas.height/2 - 35, angle: 180, speed: -20, type: 'suv', color: '#ef67ef'}),
                    new NpcCar({x: canvas.width / 4 * 3, y: canvas.height/2 - 35, angle: 180, speed: -20, type: 'suv', color: '#8960a8'}),
                ],
                parkingZones: [
                    new ParkingZone({x: canvas.width/2 - 35, y: canvas.height - 100, w: 70, l: 130, angle: 90})
                ],
                curbs: [
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                ]
            },
            {
                name: "Skrzyżowanie",
                type: 'street_crossing',
                start: { x: canvas.width/2 - 35, y: 100 + 35, angle: 90 },
                obstacles: [],
                cars: [
                    new NpcCar({x: canvas.width / 5 * 0, y: canvas.height/2 - 35, angle: 180, speed: -30, type: 'suv', color: '#849292'}),
                    new NpcCar({x: canvas.width / 5 * 1, y: canvas.height/2 - 35, angle: 180, speed: -30, type: 'suv', color: '#b4b8ba'}),
                    new NpcCar({x: canvas.width / 5 * 2, y: canvas.height/2 - 35, angle: 180, speed: -30, type: 'suv', color: '#ef67ef'}),
                    new NpcCar({x: canvas.width / 5 * 3, y: canvas.height/2 - 35, angle: 180, speed: -30, type: 'suv', color: '#8960a8'}),
                    new NpcCar({x: canvas.width / 5 * 4, y: canvas.height/2 - 35, angle: 180, speed: -30, type: 'suv', color: '#333333'}),
                ],
                parkingZones: [
                    new ParkingZone({x: canvas.width/2 - 35, y: canvas.height - 100, w: 70, l: 130, angle: 90})
                ],
                curbs: [
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 - 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb((canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 - 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                    new Curb(canvas.width/2 + 120 + (canvas.width/2 - 120)/2, canvas.height/2 + 120, 100, canvas.width/2 - 20, 0),
                    new Curb(canvas.width/2 + 120, canvas.height/2 + 120 + (canvas.height/2 - 120)/2, 100, canvas.height/2 - 120, 90 * Math.PI/180),
                ]
            },
            {
                name: "Ekspresówka",
                type: 'highway',
                start: { x: 275, y: canvas.height/2 - 120, angle: 0 },
                obstacles: [],
                cars: [
                    // Górne pasy (→→→) - jadą w prawo
                    // Pas 1 (górny)
                    new NpcCar({x: 0, y: canvas.height/2 - 205, angle: 0, speed: 10, type: 'sedan', color: '#e74c3c'}),
                    new NpcCar({x: 450, y: canvas.height/2 - 210, angle: 0, speed: 14, kind: 'aggressive', type: 'compact', color: '#3498db'}),
                    new NpcCar({x: 750, y: canvas.height/2 - 200, angle: 0, speed: 11, kind: 'aggressive', type: 'suv', color: '#9b59b6'}),
                    new NpcCar({x: 1050, y: canvas.height/2 - 205, angle: 0, speed: 13, kind: 'aggressive', type: 'sedan', color: '#f39c12'}),
                    new NpcCar({x: 1350, y: canvas.height/2 - 213, angle: 0, speed: 15, kind: 'aggressive', type: 'compact', color: '#1abc9c'}),

                    // Pas 2 (środkowy górny)
                    new NpcCar({x: 0, y: canvas.height/2 - 125, angle: 0, speed: 10, kind: 'aggressive', type: 'suv', color: '#34495e'}),
                    new NpcCar({x: 400, y: canvas.height/2 - 120, angle: 0, speed: 12, kind: 'aggressive', type: 'sedan', color: '#e67e22'}),
                    new NpcCar({x: 700, y: canvas.height/2 - 130, angle: 0, speed: 11, type: 'compact', color: '#16a085'}),
                    new NpcCar({x: 950, y: canvas.height/2 - 127, angle: 0, speed: 13, kind: 'aggressive', type: 'suv', color: '#c0392b'}),
                    new NpcCar({x: 1250, y: canvas.height/2 - 121, angle: 0, speed: 14, kind: 'aggressive', type: 'sedan', color: '#8e44ad'}),
                    new NpcCar({x: 1550, y: canvas.height/2 - 130, angle: 0, speed: 10, type: 'compact', color: '#2c3e50'}),

                    // Dolne pasy (←←←) - jadą w lewo
                    // Pas 3 (środkowy dolny)
                    new NpcCar({x: canvas.width - 150, y: canvas.height/2 + 125, angle: 180, speed: -11, kind: 'aggressive', type: 'sedan', color: '#95a5a6'}),
                    new NpcCar({x: canvas.width - 450, y: canvas.height/2 + 125, angle: 180, speed: -13, kind: 'aggressive', type: 'compact', color: '#d35400'}),
                    new NpcCar({x: canvas.width - 750, y: canvas.height/2 + 125, angle: 180, speed: -12, kind: 'aggressive', type: 'suv', color: '#27ae60'}),
                    new NpcCar({x: canvas.width - 1050, y: canvas.height/2 + 125, angle: 180, speed: -14, kind: 'aggressive', type: 'sedan', color: '#2980b9'}),
                    new NpcCar({x: canvas.width - 1350, y: canvas.height/2 + 125, angle: 180, speed: -10, type: 'compact', color: '#8e44ad'}),

                    // Pas 4 (dolny)
                    new NpcCar({x: canvas.width - 250, y: canvas.height/2 + 205, angle: 180, speed: -15, kind: 'aggressive', type: 'suv', color: '#e74c3c'}),
                    new NpcCar({x: canvas.width - 500, y: canvas.height/2 + 205, angle: 180, speed: -12, kind: 'aggressive', type: 'sedan', color: '#f39c12'}),
                    new NpcCar({x: canvas.width - 800, y: canvas.height/2 + 205, angle: 180, speed: -13, type: 'compact', color: '#1abc9c'}),
                    new NpcCar({x: canvas.width - 1100, y: canvas.height/2 + 205, angle: 180, speed: -11, kind: 'aggressive', type: 'suv', color: '#34495e'}),
                    new NpcCar({x: canvas.width - 1400, y: canvas.height/2 + 205, angle: 180, speed: -14, kind: 'aggressive', type: 'sedan', color: '#c0392b'}),
                    new NpcCar({x: canvas.width - 1650, y: canvas.height/2 + 205, angle: 180, speed: -16, type: 'compact', color: '#16a085'}),
                ],
                parkingZones: [
                    // Parking na poboczu (górna strona)
                    new ParkingZone({x: 200, y: canvas.height/2 + 123, w: 84, l: 120, angle: 0})
                ],
                curbs: [
                    // Górna krawędź
                    new Curb(canvas.width/2, canvas.height/2 - 320, 80, canvas.width, 0),
                    // Dolna krawędź
                    new Curb(canvas.width/2, canvas.height/2 + 320, 80, canvas.width, 0),
                ]
            },

        ];
    }

    startGame() {
        this.state = 'RUNNING';
        this.loadLevel(this.currentLevelIdx);
    }

    loadLevel(idx) {
        this.levels = this.defineLevels(); // Always get fresh level data
        this.populateLevelButtons();

        if (idx >= this.levels.length) {
            alert('Gratulacje! Ukończyłeś wszystkie poziomy!');
            idx = 0;
        }
        this.currentLevelIdx = idx;
        const ld = this.levels[idx];

        // Zatrzymaj wszystkie klaksony przed załadowaniem nowego poziomu
        if (this.currentCars) {
            this.currentCars.forEach(car => {
                if (car.hornSound && !car.hornSound.paused) {
                    car.hornSound.pause();
                    car.hornSound.currentTime = 0;
                }
            });
        }

        this.player.reset(ld.start.x, ld.start.y, ld.start.angle);
        this.currentCars = ld.cars || [];
        this.currentObstacles = ld.obstacles || [];
        this.currentCurbs = ld.curbs || [];
        this.currentParkingZones = ld.parkingZones || [];

        this.state = 'RUNNING';
        this.shakeTimer = 0;

        document.getElementById('toggle-steering-mode').innerText = `Asystent Kierownicy: ${this.player.steeringMode === 'DRIVING' ? 'WŁ' : 'WYŁ'}`;
        document.getElementById('toggle-winter-mode').innerText = `Poślizgi Zimowe: ${this.player.winterMode ? 'WŁ' : 'WYŁ'}`;

        const levelButtons = document.querySelectorAll('#levels-container .level-btn');
        levelButtons.forEach((btn, i) => btn.classList.toggle('active', i === idx));

        const music = document.getElementById('background-music');
        if (music && this.isMusicOn) {
            music.currentTime = 0;
            const promise = music.play();
            if (promise !== undefined) {
                promise.catch(error => {
                    console.log("Music autoplay was prevented. Click the screen to play.");
                    document.body.addEventListener('click', () => {
                        if (this.isMusicOn) music.play();
                    }, { once: true });
                });
            }
        }
    }

    update(deltaTime) {
        // Title screen - handled by mouse events
        if (this.state === 'TITLE_SCREEN') {
            return;
        }

        if (this.state === 'GAMEOVER' || this.state === 'LEVEL_COMPLETE') return;

        if (this.shakeTimer > 0) this.shakeTimer -= deltaTime * 60; // Convert to frame-based (60 FPS equivalent)

        this.player.update(input, deltaTime);

        this.currentCars.forEach(car => {
            if (typeof car.update === 'function') {
                car.update(this, deltaTime);
            }
        });

        const cars = this.currentCars;
        for (let i = 0; i < cars.length; i++) {
            for (let j = i + 1; j < cars.length; j++) {
                const carA = cars[i];
                const carB = cars[j];

                if (checkRectCollision(carA, carB)) {
                    if (typeof carA.stop === 'function') carA.stop();
                    if (typeof carB.stop === 'function') carB.stop();
                }
            }
        }

        // Update UI
        const kmh = Math.abs(this.player.speed * CONFIG.kmhFactor).toFixed(0);
        document.getElementById('ui-speed').innerText = `${kmh} km/h`;
        document.getElementById('ui-steer').innerText = `${(this.player.steeringAngle * 180 / Math.PI).toFixed(0)}°`;
        document.getElementById('ui-engine').innerText = this.player.engineOn ? 'ON' : 'OFF';
        document.getElementById('ui-lights').innerText = this.player.engineOn ? 'ON' : 'OFF';

        // Wskaźnik poślizgu
        const driftIndicator = document.getElementById('ui-drift');
        if (this.player.isDrifting) {
            const driftDegrees = Math.abs(this.player.driftAngle * 180 / Math.PI).toFixed(0);
            driftIndicator.innerText = `TAK (${driftDegrees}°)`;
            driftIndicator.style.color = '#e74c3c';
        } else {
            driftIndicator.innerText = 'NIE';
            driftIndicator.style.color = '#3498db';
        }

        // Wskaźnik boost (hamulec ręczny)
        const boostIndicator = document.getElementById('ui-boost');
        const boostPercent = Math.round(this.player.handbrakeBoost * 100);
        boostIndicator.innerText = `${boostPercent}%`;
        if (boostPercent > 75) {
            boostIndicator.style.color = '#e74c3c'; // Czerwony - gotowy!
        } else if (boostPercent > 30) {
            boostIndicator.style.color = '#f39c12'; // Pomarańczowy - buduje się
        } else {
            boostIndicator.style.color = '#95a5a6'; // Szary - brak
        }

        this.checkCollisions();
        if (this.state === 'RUNNING') this.checkParking();
    }

    checkCollisions() {
        // 1. Static Pillars
        for (let p of this.currentObstacles) {
            if (checkCircleRectCollision(p, this.player)) {
                this.triggerGameOver();
                return;
            }
        }

        // 2. Cars
        for (let c of this.currentCars) {
            if (checkRectCollision(this.player, c)) {
                this.triggerGameOver();
                return;
            }
        }

        // 3. Curbs (Special Physics)
        for (let c of this.currentCurbs) {
            if (checkRectCollision(this.player, c)) {
                if (Math.abs(this.player.speed) > CONFIG.curbSafeSpeed) {
                    // High speed -> Crash
                    this.triggerGameOver();
                } else {
                    // Low speed -> Bonk & Stop
                    this.player.speed = -this.player.speed * 0.5; // Bounce back
                    this.shakeTimer = 10; // Shake screen
                    playCurbSound();
                }
                return;
            }
        }
    }

    checkParking() {
        // Car must be moving very slowly to be considered parked.
        if (Math.abs(this.player.speed) > 0.1) return;

        for (let zone of this.currentParkingZones) {
            // 1. Check if all 4 corners of the car are inside the parking zone
            const carCorners = getCorners(this.player.x, this.player.y, this.player.w, this.player.l, this.player.angle);
            let allCornersIn = true;
            for (const corner of carCorners) {
                if (!isPointInRotatedRect(corner, zone)) {
                    allCornersIn = false;
                    break;
                }
            }

            if (allCornersIn) {
                this.triggerLevelComplete();
                return;
            }
        }
    }

    triggerGameOver() {
        if (this.state === 'GAMEOVER') return;
        this.state = 'GAMEOVER';
        this.bonkPos = { x: this.player.x, y: this.player.y };
        playBonkSound();

        const music = document.getElementById('background-music');
        if (music) music.pause();

        setTimeout(() => {
            this.loadLevel(this.currentLevelIdx);
        }, 2000);
    }

    triggerLevelComplete() {
        if (this.state !== 'RUNNING') return;
        this.state = 'LEVEL_COMPLETE';
        playLevelCompleteSound();

        // Initialize level complete animation
        this.levelCompleteTime = 0;
        this.levelCompleteButtonHover = false;

        const music = document.getElementById('background-music');
        if (music) music.pause();
    }

    draw() {
        ctx.save();

        // Screen Shake Effect
        if (this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * 10;
            const dy = (Math.random() - 0.5) * 10;
            ctx.translate(dx, dy);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Title Screen
        if (this.state === 'TITLE_SCREEN') {
            this.drawTitleScreen();
            ctx.restore();
            return;
        }

        // Level Complete Screen
        if (this.state === 'LEVEL_COMPLETE') {
            this.drawLevelCompleteScreen();
            ctx.restore();
            return;
        }

        // Environment
        if (this.levels[this.currentLevelIdx].type === 'lot') {
            this.drawLotEnvironment();
        } else if (this.levels[this.currentLevelIdx].type === 'street_crossing') {
            this.drawStreetCrossingEnvironment();
        } else if (this.levels[this.currentLevelIdx].type === 'highway') {
            this.drawHighwayEnvironment();
        }
        else {
            this.drawStreetEnvironment();
        }

        // Parking Zones
        this.currentParkingZones.forEach(z => z.draw(ctx));

        // Curbs
        this.currentCurbs.forEach(c => c.draw(ctx));

        // Entities
        this.currentObstacles.forEach(o => o.draw(ctx));
        this.currentCars.forEach(c => c.draw(ctx));

        // Rysuj ślady opon przed samochodem gracza
        this.player.drawSkidMarks(ctx);
        this.player.draw(ctx);

        // Bonk
        if (this.state === 'GAMEOVER') {
            this.drawBonk();
        }

        ctx.restore();
    }


    // V1 Style Drawing
    drawLotEnvironment() {
        const spotWidth = 70;
        const spotDepth = 120;
        const startX = 220;
        const startY = 200; // Top row

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;

        // Top Row
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + spotWidth * 6, startY);
        for(let i=0; i<=6; i++) {
            ctx.moveTo(startX + i * spotWidth, startY);
            ctx.lineTo(startX + i * spotWidth, startY + spotDepth);
        }
        ctx.stroke();

        // Bottom Row
        const startY2 = 400;
        ctx.beginPath();
        ctx.moveTo(startX, startY2 + spotDepth);
        ctx.lineTo(startX + spotWidth * 6, startY2 + spotDepth);
        for(let i=0; i<=6; i++) {
            ctx.moveTo(startX + i * spotWidth, startY2);
            ctx.lineTo(startX + i * spotWidth, startY2 + spotDepth);
        }
        ctx.stroke();

        // "PARKING" Text
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PARKING", canvas.width/2, 130);
        ctx.restore();
    }

    drawStreetEnvironment() {
        const roadY = canvas.height/2;
        // Asphalt
        ctx.fillStyle = '#444';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Full asphalt base

        // Center Line
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(0, roadY);
        ctx.lineTo(canvas.width, roadY);
        ctx.stroke();
        ctx.setLineDash([]);

    }

    drawStreetCrossingEnvironment() {
        const roadY = canvas.height / 2;
        const roadX = canvas.width / 2;
        const intersectionHalfSize = 120;

        // Asphalt
        ctx.fillStyle = '#444';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center Lines
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, roadY);
        ctx.lineTo(roadX - intersectionHalfSize, roadY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(roadX + intersectionHalfSize, roadY);
        ctx.lineTo(canvas.width, roadY);
        ctx.stroke();

        // Vertical
        ctx.beginPath();
        ctx.moveTo(roadX, 0);
        ctx.lineTo(roadX, roadY - intersectionHalfSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(roadX, roadY + intersectionHalfSize);
        ctx.lineTo(roadX, canvas.height);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    drawHighwayEnvironment() {
        const laneHeight = 85; // Wysokość jednego pasa
        const grassHeight = 160; // Wysokość pasa zieleni
        const topLanesY = canvas.height / 2 - grassHeight / 2 - laneHeight * 2;

        // Asphalt - full background
        ctx.fillStyle = '#444';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // === GÓRNE 2 PASY (→→→) ===
        const lane1Y = topLanesY + laneHeight * 0.5;
        const lane2Y = topLanesY + laneHeight * 1.5;

        // Linia oddzielająca pasy (przerywana biała)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([30, 20]);
        ctx.beginPath();
        ctx.moveTo(0, topLanesY + laneHeight);
        ctx.lineTo(canvas.width, topLanesY + laneHeight);
        ctx.stroke();

        // === PAS ZIELENI (środek) ===
        const grassY = topLanesY + laneHeight * 2;

        // Rysuj trawę (użyj tekstury lub kolor zielony)
        ctx.fillStyle = '#4a7c3a'; // Ciemnozielony base
        ctx.fillRect(0, grassY, canvas.width, grassHeight);

        // Dodaj teksturę trawy (jeśli załadowana)
        const grassImg = new Image();
        grassImg.src = 'grass-textures.jpg';
        if (grassImg.complete) {
            const pattern = ctx.createPattern(grassImg, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, grassY, canvas.width, grassHeight);
            }
        }

        // === DOLNE 2 PASY (←←←) ===
        const bottomLanesY = grassY + grassHeight;
        const lane3Y = bottomLanesY + laneHeight * 0.5;
        const lane4Y = bottomLanesY + laneHeight * 1.5;

        // Linia oddzielająca pasy (przerywana biała)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([30, 20]);
        ctx.beginPath();
        ctx.moveTo(0, bottomLanesY + laneHeight);
        ctx.lineTo(canvas.width, bottomLanesY + laneHeight);
        ctx.stroke();

        // === LINIE KRAWĘDZIOWE (ciągłe białe) ===
        ctx.setLineDash([]);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;

        // Górna krawędź autostrady
        ctx.beginPath();
        ctx.moveTo(0, topLanesY);
        ctx.lineTo(canvas.width, topLanesY);
        ctx.stroke();

        // Dolna krawędź autostrady
        ctx.beginPath();
        ctx.moveTo(0, bottomLanesY + laneHeight * 2);
        ctx.lineTo(canvas.width, bottomLanesY + laneHeight * 2);
        ctx.stroke();

        // Krawędzie pasa zieleni
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, grassY);
        ctx.lineTo(canvas.width, grassY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, grassY + grassHeight);
        ctx.lineTo(canvas.width, grassY + grassHeight);
        ctx.stroke();

        ctx.setLineDash([]);

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("S2 (OBWODNICA WARSZAFKI)", canvas.width/2, 50);
        ctx.restore();
    }

    drawTitleScreen() {
        // 90s Style Title Screen
        this.titleTime += 0.016; // ~60fps

        // Animated gradient background (cyan-magenta-blue)
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const offset1 = Math.sin(this.titleTime * 0.5) * 0.5 + 0.5;
        const offset2 = Math.cos(this.titleTime * 0.3) * 0.5 + 0.5;
        grad.addColorStop(0, `rgb(${Math.floor(offset1 * 100)}, ${Math.floor(offset2 * 150 + 100)}, 200)`);
        grad.addColorStop(0.5, `rgb(${Math.floor(offset2 * 150)}, 50, ${Math.floor(offset1 * 200 + 55)})`);
        grad.addColorStop(1, `rgb(100, ${Math.floor(offset1 * 100)}, ${Math.floor(offset2 * 150 + 100)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid effect (very 90s!)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Animated stars/particles
        for (let i = 0; i < 30; i++) {
            const x = ((i * 137.5 + this.titleTime * 50) % canvas.width);
            const y = (i * 47.3) % canvas.height;
            const size = Math.sin(this.titleTime + i) * 2 + 3;
            ctx.fillStyle = `rgba(255, 255, 0, ${Math.sin(this.titleTime * 2 + i) * 0.3 + 0.7})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main title with shadow/3D effect
        const centerY = canvas.height / 2 - 80;

        // Shadow layers (90s 3D effect)
        for (let i = 8; i > 0; i--) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1})`;
            ctx.font = 'bold 48px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GTA: S2 Deliveroo', canvas.width / 2 + i, centerY + i);
        }

        // Main title with gradient
        const titleGrad = ctx.createLinearGradient(0, centerY - 30, 0, centerY + 30);
        titleGrad.addColorStop(0, '#ffff00');
        titleGrad.addColorStop(0.5, '#ff00ff');
        titleGrad.addColorStop(1, '#00ffff');
        ctx.fillStyle = titleGrad;
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.fillText('GTA: S2 Deliveroo', canvas.width / 2, centerY);

        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('GTA: S2 Deliveroo', canvas.width / 2, centerY);

        // Subtitle
        ctx.font = 'bold 48px Arial, sans-serif';
        const subtitleY = centerY + 50;

        // Subtitle shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText('(obwodnica Warszafki)', canvas.width / 2 + 2, subtitleY + 2);

        // Subtitle with cyan color
        ctx.fillStyle = '#00ffff';
        ctx.fillText('(obwodnica Warszafki)', canvas.width / 2, subtitleY);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('(obwodnica Warszafki)', canvas.width / 2, subtitleY);

        // "PLAY THE GAME" Button (90s style)
        const buttonWidth = 280;
        const buttonHeight = 60;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height - 150;

        // Store button bounds for click detection
        this.titleButtonBounds = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        // Animated button (pulsing effect)
        const pulse = Math.sin(this.titleTime * 3) * 0.1 + 1;

        // Button shadow (3D effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(buttonX + 5, buttonY + 5, buttonWidth, buttonHeight);

        // Button background with gradient
        const btnGrad = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
        if (this.titleButtonHover) {
            btnGrad.addColorStop(0, '#ffff00');
            btnGrad.addColorStop(1, '#ff00ff');
        } else {
            btnGrad.addColorStop(0, '#ff00ff');
            btnGrad.addColorStop(1, '#00ffff');
        }
        ctx.fillStyle = btnGrad;
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Button border
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Inner border for more 90s look
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX + 4, buttonY + 4, buttonWidth - 8, buttonHeight - 8);

        // Button text
        ctx.save();
        ctx.translate(canvas.width / 2, buttonY + buttonHeight / 2);
        ctx.scale(pulse, pulse);

        // Text shadow
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PLAY THE GAME', 2, 2);

        // Text
        ctx.fillStyle = this.titleButtonHover ? '#000' : '#fff';
        ctx.fillText('PLAY THE GAME', 0, 0);

        ctx.restore();

        // Copyright/credits
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('© 1993 WARSZAFKA STUDIOS', canvas.width / 2, canvas.height - 30);
    }

    drawLevelCompleteScreen() {
        // 90s Style Level Complete Screen
        this.levelCompleteTime += 0.016;

        // Animated gradient background (different colors - celebration!)
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const offset1 = Math.sin(this.levelCompleteTime * 0.7) * 0.5 + 0.5;
        const offset2 = Math.cos(this.levelCompleteTime * 0.5) * 0.5 + 0.5;
        grad.addColorStop(0, `rgb(${Math.floor(offset1 * 200 + 55)}, ${Math.floor(offset2 * 100)}, ${Math.floor(offset1 * 100 + 100)})`);
        grad.addColorStop(0.5, `rgb(${Math.floor(offset2 * 100 + 150)}, ${Math.floor(offset1 * 200)}, 100)`);
        grad.addColorStop(1, `rgb(100, ${Math.floor(offset2 * 100 + 150)}, ${Math.floor(offset1 * 200 + 55)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Celebratory stars everywhere!
        for (let i = 0; i < 50; i++) {
            const x = ((i * 137.5 + this.levelCompleteTime * 80) % canvas.width);
            const y = ((i * 83.7 + this.levelCompleteTime * 60) % canvas.height);
            const size = Math.sin(this.levelCompleteTime * 3 + i) * 2 + 3;
            const colors = ['#ffff00', '#ff00ff', '#00ffff', '#ff0000', '#00ff00'];
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            // Star shape for some
            if (i % 3 === 0) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(this.levelCompleteTime + i);
                ctx.fillStyle = '#ffffff';
                for (let j = 0; j < 5; j++) {
                    ctx.rotate(Math.PI * 2 / 5);
                    ctx.lineTo(0, -size * 2);
                    ctx.rotate(Math.PI / 5);
                    ctx.lineTo(0, -size);
                }
                ctx.fill();
                ctx.restore();
            }
        }

        // "GRATULACJE!" title with bouncing effect
        const centerY = canvas.height / 2 - 100;
        const bounce = Math.sin(this.levelCompleteTime * 4) * 10;

        // Shadow layers
        for (let i = 8; i > 0; i--) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1})`;
            ctx.font = 'bold 56px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GRATULACJE!', canvas.width / 2 + i, centerY + bounce + i);
        }

        // Main title with rainbow gradient
        const titleGrad = ctx.createLinearGradient(0, centerY - 30, 0, centerY + 30);
        titleGrad.addColorStop(0, '#ff0000');
        titleGrad.addColorStop(0.33, '#ffff00');
        titleGrad.addColorStop(0.66, '#00ff00');
        titleGrad.addColorStop(1, '#00ffff');
        ctx.fillStyle = titleGrad;
        ctx.font = 'bold 56px Arial, sans-serif';
        ctx.fillText('GRATULACJE!', canvas.width / 2, centerY + bounce);

        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('GRATULACJE!', canvas.width / 2, centerY + bounce);

        // "Poziom ukończony!" subtitle
        ctx.font = 'bold 32px Arial, sans-serif';
        const subtitleY = centerY + 70;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText('Poziom ukończony!', canvas.width / 2 + 2, subtitleY + 2);

        // Subtitle with pulsing color
        const pulseColor = Math.sin(this.levelCompleteTime * 5) * 127 + 128;
        ctx.fillStyle = `rgb(${pulseColor}, 255, ${255 - pulseColor})`;
        ctx.fillText('Poziom ukończony!', canvas.width / 2, subtitleY);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('Poziom ukończony!', canvas.width / 2, subtitleY);

        // "NASTĘPNY POZIOM" Button (90s style)
        const buttonWidth = 320;
        const buttonHeight = 70;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height - 150;

        // Store button bounds for click detection
        this.levelCompleteButtonBounds = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        // Animated button (pulsing effect)
        const pulse = Math.sin(this.levelCompleteTime * 3) * 0.1 + 1;

        // Button shadow (3D effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(buttonX + 6, buttonY + 6, buttonWidth, buttonHeight);

        // Button background with gradient
        const btnGrad = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
        if (this.levelCompleteButtonHover) {
            btnGrad.addColorStop(0, '#00ff00');
            btnGrad.addColorStop(1, '#ffff00');
        } else {
            btnGrad.addColorStop(0, '#ffff00');
            btnGrad.addColorStop(1, '#ff00ff');
        }
        ctx.fillStyle = btnGrad;
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Button border
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 5;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Inner border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX + 5, buttonY + 5, buttonWidth - 10, buttonHeight - 10);

        // Button text
        ctx.save();
        ctx.translate(canvas.width / 2, buttonY + buttonHeight / 2);
        ctx.scale(pulse, pulse);

        // Text shadow
        ctx.fillStyle = '#000';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NASTĘPNY POZIOM', 2, 2);

        // Text
        ctx.fillStyle = this.levelCompleteButtonHover ? '#000' : '#fff';
        ctx.fillText('NASTĘPNY POZIOM', 0, 0);

        ctx.restore();
    }

    drawBonk() {
        ctx.save();
        ctx.translate(this.bonkPos.x, this.bonkPos.y);

        // Comic Flash (Star)
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i=0; i<16; i++) {
            const angle = (Math.PI*2/16) * i;
            const r = (i%2===0) ? 70 : 45;
            ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Text "BONK!"
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.font = "bold 28px Verdana";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeText("BONK!", 0, 0);
        ctx.fillText("BONK!", 0, 0);

        ctx.restore();
    }
}
