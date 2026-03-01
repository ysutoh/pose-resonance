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

/**
 * Calculates the neck offset as a percentage based on shoulder width.
 * A value of 0 means the nose is perfectly centered between the shoulders.
 * Positive values indicate the head is shifted right relative to the body center.
 */
export const calculateNeckOffset = (leftShoulder, rightShoulder, nose) => {
    if (!leftShoulder || !rightShoulder || !nose) return null;

    // Calculate center of the shoulders (neck base X)
    const neckBaseX = (leftShoulder.x + rightShoulder.x) / 2;

    // Calculate the horizontal shift from center
    const shiftX = nose.x - neckBaseX;

    // Normalize against shoulder width (gives a roughly size-invariant ratio)
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

    // Prevent division by zero
    if (shoulderWidth === 0) return 0;

    // Return as a percentage
    return (shiftX / shoulderWidth) * 100;
};
