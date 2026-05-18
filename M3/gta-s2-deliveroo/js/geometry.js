function getCorners(x, y, w, h, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const hw = w / 2;
    const hh = h / 2;
    return [
        { x: x + (hh * cos - hw * sin), y: y + (hh * sin + hw * cos) },
        { x: x + (hh * cos + hw * sin), y: y + (hh * sin - hw * cos) },
        { x: x + (-hh * cos + hw * sin), y: y + (-hh * sin - hw * cos) },
        { x: x + (-hh * cos - hw * sin), y: y + (-hh * sin + hw * cos) }
    ];
}

function projectPolygon(axis, corners) {
    let min = Infinity;
    let max = -Infinity;
    for (let p of corners) {
        const proj = (p.x * axis.x + p.y * axis.y);
        if (proj < min) min = proj;
        if (proj > max) max = proj;
    }
    return { min, max };
}

function overlap(a, b) {
    return !(a.min > b.max || b.min > a.max);
}

function checkRectCollision(rectA, rectB) {
    const cornersA = getCorners(rectA.x, rectA.y, rectA.w, rectA.l, rectA.angle);
    const cornersB = getCorners(rectB.x, rectB.y, rectB.w, rectB.l, rectB.angle);
    const axes = [
        { x: Math.cos(rectA.angle), y: Math.sin(rectA.angle) },
        { x: -Math.sin(rectA.angle), y: Math.cos(rectA.angle) },
        { x: Math.cos(rectB.angle), y: Math.sin(rectB.angle) },
        { x: -Math.sin(rectB.angle), y: Math.cos(rectB.angle) }
    ];
    for (let axis of axes) {
        const pA = projectPolygon(axis, cornersA);
        const pB = projectPolygon(axis, cornersB);
        if (!overlap(pA, pB)) return false;
    }
    return true;
}

function checkCircleRectCollision(circle, rect) {
    const cos = Math.cos(-rect.angle);
    const sin = Math.sin(-rect.angle);
    const dx = circle.x - rect.x;
    const dy = circle.y - rect.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    const closestX = Math.max(-rect.l/2, Math.min(localX, rect.l/2));
    const closestY = Math.max(-rect.w/2, Math.min(localY, rect.w/2));
    const distanceX = localX - closestX;
    const distanceY = localY - closestY;
    return (distanceX * distanceX) + (distanceY * distanceY) < (circle.r * circle.r);
}

function isPointInRotatedRect(point, rect) {
    const cos = Math.cos(-rect.angle);
    const sin = Math.sin(-rect.angle);
    const dx = point.x - rect.x;
    const dy = point.y - rect.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    return Math.abs(localX) < rect.l / 2 && Math.abs(localY) < rect.w / 2;
}
