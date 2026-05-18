// Static Curb / Sidewalk class
class Curb {
    constructor(x, y, w, l, angle = 0) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.l = l;
        this.angle = angle;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-this.l/2, -this.w/2, this.l, this.w);
        // Bevel look
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.l/2, -this.w/2, this.l, this.w);
        ctx.restore();
    }
}

class Pillar {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 12;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.arc(3, 3, this.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath(); ctx.arc(0, 0, this.r/2, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

class RoundaboutIsland {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }
    draw(ctx) {
        // Drawn by drawRoundaboutEnvironment
    }
}

class ParkingZone {
    constructor(props) {
        this.x = props.x;
        this.y = props.y;
        this.w = props.w;
        this.l = props.l;
        this.angle = props.angle * (Math.PI / 180);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(-this.l/2, -this.w/2, this.l, this.w);

        ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
        ctx.fillRect(-this.l/2, -this.w/2, this.l, this.w);

        ctx.restore();
    }
}
