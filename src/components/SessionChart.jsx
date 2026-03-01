import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const SessionChart = ({ data, audioUrl, onClose }) => {
    const [playbackTime, setPlaybackTime] = useState(0);
    const audioRef = useRef(null);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setPlaybackTime(audioRef.current.currentTime);
        }
    };
    if (!data || data.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-4xl max-h-screen flex flex-col overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface/50">
                    <h2 className="text-xl font-bold text-white">Session Posture Tracking</h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white px-3 py-1 rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>

                <div className="p-6 flex-1 min-h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis
                                type="number"
                                dataKey="time"
                                domain={['dataMin', 'dataMax']}
                                stroke="#ffffff60"
                                label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10, fill: '#ffffff60' }}
                            />
                            <YAxis
                                stroke="#ffffff60"
                                label={{ value: 'Deviation', angle: -90, position: 'insideLeft', fill: '#ffffff60' }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line type="monotone" name="Shoulder Tilt (°)" dataKey="shoulderDelta" stroke="#3b82f6" activeDot={{ r: 8 }} />
                            <Line type="monotone" name="Head Tilt (°)" dataKey="headDelta" stroke="#8b5cf6" dot={false} />
                            <Line type="monotone" name="Neck Offset (%)" dataKey="neckOffsetDelta" stroke="#f59e0b" dot={false} />
                            <Line type="monotone" name="Embouchure Offset (°)" dataKey="embouchureDelta" stroke="#ef4444" dot={false} />
                            {audioUrl && (
                                <ReferenceLine x={playbackTime} stroke="#10b981" strokeDasharray="3 3" />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-4 bg-surface/50 border-t border-white/10 flex flex-col gap-4">
                    {audioUrl && (
                        <div className="w-full max-w-lg mx-auto">
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                controls
                                className="w-full h-10"
                                onTimeUpdate={handleTimeUpdate}
                            />
                        </div>
                    )}
                    <p className="text-sm text-white/60 text-center">
                        This chart visualizes how far you deviated from your personal baseline over the course of your session. A flat line at 0 indicates perfect alignment with your baseline.
                        {audioUrl && " Play the audio to see exactly where posture degraded."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SessionChart;
