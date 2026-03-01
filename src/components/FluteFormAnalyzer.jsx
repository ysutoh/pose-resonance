import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { calculateAngle, calculateNeckOffset, isReliable } from '../utils/angleCalculator';
import { usePostureSession } from '../hooks/usePostureSession';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import Dashboard from './Dashboard';
import SessionChart from './SessionChart';

const FluteFormAnalyzer = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const requestRef = useRef();

    const [modelLoaded, setModelLoaded] = useState(false);
    const [metrics, setMetrics] = useState({ shoulder: 0, head: 0, neckOffset: 0, embouchure: 0 });
    const [detector, setDetector] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [showChart, setShowChart] = useState(false);

    // Hook handles calibration state, session recording, and baseline tracking automatically
    const sessionState = usePostureSession(metrics);
    const audioState = useAudioRecorder();

    // Sync audio recording with session recording
    useEffect(() => {
        if (sessionState.isSessionActive && !audioState.isRecording) {
            audioState.startRecording();
        } else if (!sessionState.isSessionActive && audioState.isRecording) {
            audioState.stopRecording();
        }
    }, [sessionState.isSessionActive, audioState]);

    useEffect(() => {
        let active = true;

        const setupCamera = async () => {
            try {
                // Specifically request a landscape aspect ratio (e.g., 16:9)
                // This is crucial for flute playing to capture the full arm span.
                // We use advanced constraints to strongly prefer width > height.
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { min: 640, ideal: 1280 },
                        aspectRatio: { ideal: 1.7777777778 } // 16:9
                    },
                    audio: false,
                });
                if (videoRef.current && active) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                    };
                }
            } catch (err) {
                if (active) setErrorMsg('Failed to access camera: ' + err.message);
            }
        };

        const loadModel = async () => {
            try {
                await tf.ready();
                const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                const newDetector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
                if (active) {
                    setDetector(newDetector);
                    setModelLoaded(true);
                }
            } catch (err) {
                if (active) setErrorMsg('Failed to load posture model: ' + err.message);
            }
        };

        setupCamera();
        loadModel();

        return () => {
            active = false;
            cancelAnimationFrame(requestRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, []);

    const drawKeypointsAndBones = (keypoints, ctx) => {
        const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

        // Check if we are warning currently (visual feedback on the skeleton)
        const base = sessionState.baseline;
        let isWarning = false;
        if (base) {
            isWarning =
                Math.abs(metrics.shoulder - base.shoulder) > 5 ||
                Math.abs(metrics.head - base.head) > 5 ||
                Math.abs(metrics.neckOffset - base.neckOffset) > 5 ||
                Math.abs(metrics.embouchure - base.embouchure) > 5;
        } else {
            isWarning = Math.abs(metrics.shoulder) > 15 || Math.abs(metrics.head) > 15 || Math.abs(metrics.embouchure) > 15;
        }

        ctx.strokeStyle = isWarning ? '#ef4444' : '#3b82f6'; // Red vs Blue
        ctx.lineWidth = 2;

        adjacentKeyPoints.forEach(([i, j]) => {
            const kp1 = keypoints[i];
            const kp2 = keypoints[j];
            if (isReliable(kp1) && isReliable(kp2)) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });

        keypoints.forEach((keypoint, index) => {
            if (isReliable(keypoint)) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
                // Highlight nose specifically for offset visualization
                ctx.fillStyle = index === 0 ? '#10b981' : '#ffffff';
                ctx.fill();
            }
        });
    };

    const detectPose = async () => {
        if (!detector || !videoRef.current || videoRef.current.readyState < 2) {
            requestRef.current = requestAnimationFrame(detectPose);
            return;
        }

        const { videoWidth, videoHeight } = videoRef.current;

        if (canvasRef.current.width !== videoWidth) {
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
        }

        try {
            const poses = await detector.estimatePoses(videoRef.current);
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, videoWidth, videoHeight);

            if (poses && poses.length > 0) {
                const keypoints = poses[0].keypoints;
                drawKeypointsAndBones(keypoints, ctx);

                const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
                const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
                const leftEar = keypoints.find(k => k.name === 'left_ear');
                const rightEar = keypoints.find(k => k.name === 'right_ear');
                const leftEye = keypoints.find(k => k.name === 'left_eye');
                const rightEye = keypoints.find(k => k.name === 'right_eye');
                const leftWrist = keypoints.find(k => k.name === 'left_wrist');
                const rightWrist = keypoints.find(k => k.name === 'right_wrist');
                const nose = keypoints.find(k => k.name === 'nose');

                let newShoulderAngle = metrics.shoulder;
                let newHeadAngle = metrics.head;
                let newNeckOffset = metrics.neckOffset;
                let newEmbouchure = metrics.embouchure;

                if (isReliable(leftShoulder) && isReliable(rightShoulder)) {
                    newShoulderAngle = calculateAngle(rightShoulder, leftShoulder);
                }

                if (isReliable(leftEar) && isReliable(rightEar)) {
                    newHeadAngle = calculateAngle(rightEar, leftEar);
                }

                if (isReliable(leftShoulder) && isReliable(rightShoulder) && isReliable(nose)) {
                    // Pass right, left because of mirror mirroring? The video is horizontally flipped in CSS.
                    // For calculation, just calculate raw coordinate offsets.
                    newNeckOffset = calculateNeckOffset(leftShoulder, rightShoulder, nose);
                    // Invert horizontal axis because of mirror if needed
                    newNeckOffset = -newNeckOffset;
                }

                // Face Angle: Try eyes first, fallback to ears
                let faceAngle = null;
                if (isReliable(leftEye) && isReliable(rightEye)) {
                    faceAngle = calculateAngle(rightEye, leftEye);
                } else if (isReliable(leftEar) && isReliable(rightEar)) {
                    faceAngle = calculateAngle(rightEar, leftEar);
                }

                // Flute Proxy Angle: wrists
                let fluteProxyAngle = null;
                if (isReliable(leftWrist) && isReliable(rightWrist)) {
                    fluteProxyAngle = calculateAngle(rightWrist, leftWrist);
                }

                // Embouchure Alignment
                if (faceAngle !== null && fluteProxyAngle !== null) {
                    newEmbouchure = faceAngle - fluteProxyAngle;
                }

                setMetrics({
                    shoulder: isNaN(newShoulderAngle) ? 0 : newShoulderAngle,
                    head: isNaN(newHeadAngle) ? 0 : newHeadAngle,
                    neckOffset: isNaN(newNeckOffset) || newNeckOffset === null ? 0 : newNeckOffset,
                    embouchure: isNaN(newEmbouchure) ? 0 : newEmbouchure
                });
            }
        } catch (e) {
            console.error(e);
        }

        requestRef.current = requestAnimationFrame(detectPose);
    };

    useEffect(() => {
        if (modelLoaded) {
            requestRef.current = requestAnimationFrame(detectPose);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [modelLoaded, detector]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative">
            <div className="relative w-full max-w-6xl aspect-[4/3] sm:aspect-video max-h-[100dvh] overflow-hidden flex items-center justify-center bg-surface m-auto shadow-2xl">
                {(errorMsg || audioState.errorMsg) ? (
                    <div className="text-danger p-4 text-center z-10 glass-panel">{errorMsg || audioState.errorMsg}</div>
                ) : !modelLoaded ? (
                    <div className="flex flex-col items-center z-10 text-white animate-pulse-slow glass-panel p-8 rounded-2xl">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-semibold tracking-wider">Loading AI Model</p>
                    </div>
                ) : null}

                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`absolute inset-0 w-full h-full object-contain transform -scale-x-100 ${!modelLoaded ? 'opacity-0' : 'opacity-100'}`}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute w-full h-full object-contain transform -scale-x-100 z-10 pointer-events-none"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                />

                {modelLoaded && (
                    <Dashboard
                        metrics={metrics}
                        sessionState={sessionState}
                        onShowChart={() => setShowChart(true)}
                    />
                )}
            </div>

            {showChart && (
                <SessionChart
                    data={sessionState.sessionData}
                    audioUrl={audioState.audioUrl}
                    onClose={() => setShowChart(false)}
                />
            )}
        </div>
    );
};

export default FluteFormAnalyzer;
