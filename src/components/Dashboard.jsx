import React from 'react';

// New stricter thresholds based on relative baseline
const WARNING_THRESHOLD_ANGLE = 5; // degrees
const WARNING_THRESHOLD_OFFSET = 5; // offset ratio percentage

const MetricCard = ({ label, value, baselineValue, unit, isOffset = false }) => {
    const deviation = baselineValue !== null ? value - baselineValue : 0;
    const absDeviation = Math.abs(deviation);

    const threshold = isOffset ? WARNING_THRESHOLD_OFFSET : WARNING_THRESHOLD_ANGLE;
    const isWarning = baselineValue !== null && absDeviation > threshold;

    return (
        <div className={`glass-panel p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center transition-colors duration-300 w-28 sm:w-36 ${isWarning ? 'shadow-danger/50 border-danger/50 text-danger' : 'text-white'}`}>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider opacity-80 mb-1 font-semibold">{label}</span>
            <span className="text-2xl sm:text-3xl font-bold font-mono">
                {Math.abs(value).toFixed(1)}{unit}
            </span>
            {baselineValue !== null ? (
                <div className="w-full flex justify-between items-center mt-2 text-[10px] sm:text-xs opacity-80 border-t border-white/10 pt-2">
                    <span>Δ {absDeviation.toFixed(1)}{unit}</span>
                    <span className={deviation > 0 ? 'text-primary' : 'text-accent'}>
                        {deviation > 0 ? (isOffset ? 'Right' : 'R-Tilt') : deviation < 0 ? (isOffset ? 'Left' : 'L-Tilt') : 'Flat'}
                    </span>
                </div>
            ) : (
                <span className="text-[10px] sm:text-xs mt-2 opacity-50">No Baseline</span>
            )}
        </div>
    );
};

const Dashboard = ({
    metrics,
    sessionState,
    onShowChart
}) => {
    const {
        baseline,
        startCalibration,
        isCalibrating,
        prepCountdown,
        calibrationProgress,
        isSessionActive,
        toggleSession,
        sessionData
    } = sessionState;

    return (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6">

            {/* Top HUD - Metrics */}
            <div className="flex justify-between items-start w-full">
                <div className="flex gap-2 sm:gap-4 pointer-events-auto">
                    <MetricCard
                        label="Shoulders"
                        value={metrics.shoulder}
                        baselineValue={baseline?.shoulder || null}
                        unit="°"
                    />
                    <MetricCard
                        label="Head Base"
                        value={metrics.head}
                        baselineValue={baseline?.head || null}
                        unit="°"
                    />
                    <MetricCard
                        label="Neck Offset"
                        value={metrics.neckOffset}
                        baselineValue={baseline?.neckOffset || null}
                        unit="%"
                        isOffset={true}
                    />
                    <MetricCard
                        label="Embouchure Align"
                        value={metrics.embouchure}
                        baselineValue={baseline?.embouchure || null}
                        unit="°"
                    />
                </div>

                {/* Top Right Controls */}
                <div className="flex flex-col gap-3 pointer-events-auto items-end">
                    <button
                        onClick={startCalibration}
                        disabled={isCalibrating || prepCountdown > 0}
                        className="glass-panel px-4 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50 min-w-[140px] relative overflow-hidden"
                    >
                        {isCalibrating ? 'Recording...' : prepCountdown > 0 ? `Ready in ${prepCountdown}s...` : 'Set Baseline'}
                        {isCalibrating && (
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-100 ease-linear"
                                style={{ width: `${calibrationProgress}%` }}
                            />
                        )}
                        {prepCountdown > 0 && (
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-accent transition-all duration-1000 ease-linear"
                                style={{ width: `${(prepCountdown / 5) * 100}%` }}
                            />
                        )}
                    </button>

                    <button
                        onClick={toggleSession}
                        className={`glass-panel px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:scale-95 min-w-[140px] flex items-center justify-center gap-2 ${isSessionActive ? 'text-danger border-danger/30 hover:bg-danger/10' : 'text-white hover:bg-white/10'}`}
                    >
                        {isSessionActive && <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />}
                        {isSessionActive ? 'End Session' : 'Start Session'}
                    </button>

                    {!isSessionActive && sessionData.length > 0 && (
                        <button
                            onClick={onShowChart}
                            className="glass-panel px-4 py-2 rounded-lg text-sm font-semibold text-accent border-accent/30 hover:bg-accent/10 transition-colors active:scale-95 min-w-[140px]"
                        >
                            View Report
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom context/tips */}
            <div className="w-full text-center opacity-50 text-xs sm:text-sm font-medium pb-4">
                {baseline ? 'Tracking relative to baseline.' : 'Set a baseline to track deviations during play.'}
            </div>
        </div>
    );
};

export default Dashboard;
