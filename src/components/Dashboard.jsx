import React from 'react';

// New stricter thresholds based on relative baseline
const WARNING_THRESHOLD_ANGLE = 5; // degrees
const WARNING_THRESHOLD_OFFSET = 5; // offset ratio percentage

const MetricCard = ({ label, value, baselineValue, unit, isOffset = false }) => {
    const deviation = baselineValue !== null ? value - baselineValue : 0;
    const absDeviation = Math.abs(deviation);

    const threshold = isOffset ? WARNING_THRESHOLD_OFFSET : WARNING_THRESHOLD_ANGLE;
    const isWarning = baselineValue !== null && absDeviation > threshold;

    // Determine the primary display value depending on whether baseline is set
    const mainValueExp = baselineValue !== null ? (deviation > 0 ? '+' : '') + deviation.toFixed(1) : Math.abs(value).toFixed(1);
    const mainValueColor = isWarning ? 'text-danger' : (baselineValue !== null ? 'text-white' : 'text-white/80');

    return (
        <div className={`glass-panel p-2 sm:p-3 rounded-lg flex flex-col items-center justify-center transition-all duration-300 w-20 sm:w-28 border ${isWarning ? 'border-danger/80 bg-danger/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 bg-black/20'}`}>
            <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5 font-semibold text-center leading-tight whitespace-nowrap overflow-hidden w-full ${isWarning ? 'text-danger-light' : 'text-white/80'}`}>
                {label}
            </span>

            <span className={`text-lg sm:text-2xl font-bold font-mono tracking-tighter ${mainValueColor}`}>
                {mainValueExp}{unit}
            </span>

            {baselineValue !== null ? (
                <div className="w-full flex justify-between items-center mt-1 text-[9px] sm:text-[10px] opacity-80 border-t border-white/10 pt-1">
                    <span className="text-white/60">Raw: {Math.abs(value).toFixed(1)}°</span>
                    <span className={deviation > 0 ? 'text-primary font-bold' : 'text-accent font-bold'}>
                        {deviation > 0 ? 'R' : deviation < 0 ? 'L' : '-'}
                    </span>
                </div>
            ) : (
                <span className="text-[9px] sm:text-[10px] mt-1 opacity-50 text-white/60 pt-1 border-t border-white/10 w-full text-center">No Base</span>
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
        <div className="absolute inset-0 z-20 pointer-events-none p-4 sm:p-6 flex flex-col justify-between overflow-hidden">

            {/* Top HUD - Metrics Split Left/Right */}
            <div className="flex justify-between items-start w-full pointer-events-none">
                {/* Left Side Metrics */}
                <div className="flex flex-col items-start gap-2 pointer-events-auto">
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
                </div>

                {/* Right Side Metrics */}
                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                    <MetricCard
                        label="Neck Offset"
                        value={metrics.neckOffset}
                        baselineValue={baseline?.neckOffset || null}
                        unit="%"
                        isOffset={true}
                    />
                    <MetricCard
                        label="Embouchure"
                        value={metrics.embouchure}
                        baselineValue={baseline?.embouchure || null}
                        unit="°"
                    />
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 pointer-events-auto px-2 pb-2">
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                    <button
                        onClick={startCalibration}
                        disabled={isCalibrating || prepCountdown > 0}
                        className="glass-panel px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50 min-w-[100px] sm:min-w-[140px] relative overflow-hidden"
                    >
                        {isCalibrating ? 'Recording...' : prepCountdown > 0 ? `Wait ${prepCountdown}s...` : 'Set Baseline'}
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
                        className={`glass-panel px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold transition-colors active:scale-95 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-1 sm:gap-2 ${isSessionActive ? 'border-danger/50 text-danger bg-danger/10 shadow-danger/20' : 'hover:bg-white/10'}`}
                    >
                        {isSessionActive && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-danger animate-pulse" />}
                        {isSessionActive ? 'End Session' : 'Start Session'}
                    </button>

                    {!isSessionActive && sessionData.length > 0 && (
                        <button
                            onClick={onShowChart}
                            className="glass-panel px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold text-accent border-accent/50 hover:bg-accent/10 transition-colors active:scale-95 min-w-[100px] sm:min-w-[140px]"
                        >
                            View Report
                        </button>
                    )}
                </div>
                <div className="w-full text-center opacity-60 text-[8px] sm:text-xs font-medium bg-black/30 w-fit px-2 py-0.5 rounded-full backdrop-blur-sm mx-auto">
                    {baseline ? 'Tracking deviations.' : 'Set baseline to track.'}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
