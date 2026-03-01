import { useState, useEffect, useRef, useCallback } from 'react';

const SNAPSHOT_INTERVAL_MS = 1000;
const CALIBRATION_DURATION_MS = 5000; // Increased to 5s for better average

export const usePostureSession = (currentMetrics) => {
    const [baseline, setBaseline] = useState(() => {
        const saved = localStorage.getItem('posture_baseline');
        return saved ? JSON.parse(saved) : null;
    });

    const [isCalibrating, setIsCalibrating] = useState(false);
    const [prepCountdown, setPrepCountdown] = useState(0);
    const [calibrationProgress, setCalibrationProgress] = useState(0);

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionData, setSessionData] = useState([]);

    const calibrationBuffer = useRef([]);
    const sessionIntervalRef = useRef(null);

    const finishCalibrationRef = useRef();

    const finishCalibration = useCallback(() => {
        if (calibrationBuffer.current.length === 0) {
            setIsCalibrating(false);
            return;
        }

        const avgShoulder = calibrationBuffer.current.reduce((acc, curr) => acc + curr.shoulder, 0) / calibrationBuffer.current.length;
        const avgHead = calibrationBuffer.current.reduce((acc, curr) => acc + curr.head, 0) / calibrationBuffer.current.length;
        const avgNeckOffset = calibrationBuffer.current.reduce((acc, curr) => acc + curr.neckOffset, 0) / calibrationBuffer.current.length;
        const avgEmbouchure = calibrationBuffer.current.reduce((acc, curr) => acc + curr.embouchure, 0) / calibrationBuffer.current.length;

        const newBaseline = {
            shoulder: avgShoulder,
            head: avgHead,
            neckOffset: avgNeckOffset,
            embouchure: avgEmbouchure
        };

        setBaseline(newBaseline);
        localStorage.setItem('posture_baseline', JSON.stringify(newBaseline));
        setIsCalibrating(false);
        setCalibrationProgress(100);

        // Auto-hide progress after 1s
        setTimeout(() => setCalibrationProgress(0), 1000);
    }, []);

    useEffect(() => {
        finishCalibrationRef.current = finishCalibration;
    }, [finishCalibration]);

    // 1. Personal Calibration Logic
    const startCalibration = useCallback(() => {
        if (isCalibrating || prepCountdown > 0) return;

        setPrepCountdown(5); // 5 seconds preparation

        let currentPrep = 5;
        const prepInterval = setInterval(() => {
            currentPrep -= 1;
            setPrepCountdown(currentPrep);

            if (currentPrep <= 0) {
                clearInterval(prepInterval);

                // Start actual recording
                setIsCalibrating(true);
                setCalibrationProgress(0);
                calibrationBuffer.current = [];

                const startTime = Date.now();
                const calInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(100, (elapsed / CALIBRATION_DURATION_MS) * 100);
                    setCalibrationProgress(progress);

                    if (elapsed >= CALIBRATION_DURATION_MS) {
                        clearInterval(calInterval);
                        if (finishCalibrationRef.current) finishCalibrationRef.current();
                    }
                }, 100);
            }
        }, 1000);
    }, [isCalibrating, prepCountdown]);

    // Accumulate frames during calibration
    useEffect(() => {
        if (isCalibrating && currentMetrics) {
            calibrationBuffer.current.push(currentMetrics);
        }
    }, [isCalibrating, currentMetrics]);

    // 2. Session Time-Series Tracking Logic
    const toggleSession = useCallback(() => {
        if (isSessionActive) {
            // End Session
            setIsSessionActive(false);
            clearInterval(sessionIntervalRef.current);
        } else {
            // Start Session
            setSessionData([]);
            setIsSessionActive(true);

            sessionIntervalRef.current = setInterval(() => {
                setSessionData(prev => {
                    // This needs to capture the absolute latest metrics. We'll rely on a ref to get fresh metrics inside setInterval if needed, 
                    // or we can pass a function to state setter. Actually, using a ref for latest metrics is safer here.
                    return prev;
                });
            }, SNAPSHOT_INTERVAL_MS);
        }
    }, [isSessionActive]);

    // To properly capture metrics in the interval, we use a ref to hold latest metrics
    const latestMetricsRef = useRef(currentMetrics);
    const baselineRef = useRef(baseline);

    useEffect(() => {
        latestMetricsRef.current = currentMetrics;
    }, [currentMetrics]);

    useEffect(() => {
        baselineRef.current = baseline;
    }, [baseline]);

    useEffect(() => {
        if (isSessionActive) {
            const startTime = Date.now();

            sessionIntervalRef.current = setInterval(() => {
                const current = latestMetricsRef.current;
                const base = baselineRef.current || { shoulder: 0, head: 0, neckOffset: 0, embouchure: 0 };

                if (current) {
                    const snapshot = {
                        time: Math.floor((Date.now() - startTime) / 1000), // Seconds from start
                        shoulderDelta: current.shoulder - base.shoulder,
                        headDelta: current.head - base.head,
                        neckOffsetDelta: current.neckOffset - base.neckOffset,
                        embouchureDelta: current.embouchure - base.embouchure
                    };
                    setSessionData(prev => [...prev, snapshot]);
                }
            }, SNAPSHOT_INTERVAL_MS);
        } else {
            clearInterval(sessionIntervalRef.current);
        }

        return () => clearInterval(sessionIntervalRef.current);
    }, [isSessionActive]);


    return {
        baseline,
        isCalibrating,
        prepCountdown,
        calibrationProgress,
        startCalibration,
        isSessionActive,
        sessionData,
        toggleSession
    };
};
