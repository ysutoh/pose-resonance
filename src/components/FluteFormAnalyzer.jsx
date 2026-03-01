import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { calculateAngle, isReliable } from '../utils/angleCalculator';

const WARNING_THRESHOLD = 15; // degrees

const FluteFormAnalyzer = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const requestRef = useRef();

    const [modelLoaded, setModelLoaded] = useState(false);
    const [metrics, setMetrics] = useState({ shoulder: 0, head: 0 });
    const [detector, setDetector] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        let active = true;

        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
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
        // Basic connections for torso and head
        const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

        ctx.strokeStyle = '#3b82f6';
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

        keypoints.forEach(keypoint => {
            if (isReliable(keypoint)) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#ef4444';
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

        // Sync canvas size to video size if needed
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

                // Find relevant keypoints
                const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
                const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
                const leftEar = keypoints.find(k => k.name === 'left_ear');
                const rightEar = keypoints.find(k => k.name === 'right_ear');

                let newShoulderAngle = metrics.shoulder;
                let newHeadAngle = metrics.head;

                if (isReliable(leftShoulder) && isReliable(rightShoulder)) {
                    newShoulderAngle = calculateAngle(rightShoulder, leftShoulder); // Invert calculation due to mirroring
                }

                if (isReliable(leftEar) && isReliable(rightEar)) {
                    newHeadAngle = calculateAngle(rightEar, leftEar); // Invert calculation
                }

                setMetrics({
                    shoulder: isNaN(newShoulderAngle) ? 0 : newShoulderAngle,
                    head: isNaN(newHeadAngle) ? 0 : newHeadAngle
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

    const MetricCard = ({ label, value }) => {
        // Check if absolute angle exceeds threshold
        const isWarning = Math.abs(value) > WARNING_THRESHOLD;

        return (
            <div className={`glass-panel p-4 rounded-xl flex flex-col items-center justify-center transition-colors duration-300 w-32 ${isWarning ? 'shadow-danger/50 border-danger/50 text-danger' : 'text-white'}`}>
                <span className="text-xs uppercase tracking-wider opacity-80 mb-1">{label}</span>
                <span className="text-3xl font-bold font-mono">
                    {Math.abs(value).toFixed(1)}°
                </span>
                <span className="text-xs mt-1">
                    {value > 2 ? 'Right Tilt' : value < -2 ? 'Left Tilt' : 'Level'}
                </span>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
            {/* Video & Canvas container */}
            <div className="relative w-full h-full max-w-4xl max-h-screen overflow-hidden flex items-center justify-center bg-surface">
                {errorMsg ? (
                    <div className="text-danger p-4 text-center">{errorMsg}</div>
                ) : !modelLoaded ? (
                    <div className="flex flex-col items-center text-white animate-pulse-slow">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Loading AI Model...</p>
                    </div>
                ) : null}

                {/* Mirror the video to match natural user expectation */}
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`absolute w-full h-full object-cover transform -scale-x-100 ${!modelLoaded ? 'opacity-0' : 'opacity-100'}`}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute w-full h-full object-cover transform -scale-x-100 z-10 pointer-events-none"
                />

                {/* HUD Elements */}
                {modelLoaded && (
                    <div className="absolute top-8 left-0 right-0 z-20 flex justify-around px-4 pointer-events-none">
                        <MetricCard label="Shoulders" value={metrics.shoulder} />
                        <MetricCard label="Head Base" value={metrics.head} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FluteFormAnalyzer;
