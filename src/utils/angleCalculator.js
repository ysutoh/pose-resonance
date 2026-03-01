/**
 * Calculates the angle between two points (in degrees).
 * Assuming point1 is the left side (e.g., left shoulder) and point2 is the right side.
 * A perfectly horizontal line returns 0.
 * Positive values indicate the right side is lower than the left.
 */
export const calculateAngle = (leftPoint, rightPoint) => {
    if (!leftPoint || !rightPoint) return null;

    const dx = rightPoint.x - leftPoint.x;
    const dy = rightPoint.y - leftPoint.y;

    // atan2 returns angle in radians from -PI to PI
    const angleRad = Math.atan2(dy, dx);

    // Convert to degrees
    return angleRad * (180 / Math.PI);
};

/**
 * Validates if the point has enough confidence score to be used.
 * MoveNet/BlazePose returns a score between 0 and 1.
 */
export const isReliable = (point, minConfidence = 0.3) => {
    return point && point.score && point.score >= minConfidence;
};
