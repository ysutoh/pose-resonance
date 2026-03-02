import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

const SessionChart = ({ data, audioUrl, onClose, onSetBaseline }) => {
    const [playbackTime, setPlaybackTime] = useState(0);
    const audioRef = useRef(null);

    // Baseline Selection State
    const [refAreaLeft, setRefAreaLeft] = useState('');
    const [refAreaRight, setRefAreaRight] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setPlaybackTime(audioRef.current.currentTime);
        }
    };

    // Chart Interaction Handlers
    const handleMouseDown = (e) => {
        if (e && e.activeLabel !== undefined) {
            setIsDragging(true);
            setRefAreaLeft(e.activeLabel);
            setRefAreaRight(e.activeLabel);
            setSelectedRange(null); // Clear previous selection
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && e && e.activeLabel !== undefined) {
            setRefAreaRight(e.activeLabel);
        }
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (refAreaLeft === refAreaRight || refAreaLeft === '' || refAreaRight === '') {
            // Clicked without dragging, or invalid
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        // Ensure left is actually smaller than right
        let [left, right] = [refAreaLeft, refAreaRight];
        if (left > right) {
            [left, right] = [right, left];
        }

        setSelectedRange({ start: left, end: right });
        // Keep the visual selection by NOT clearing refAreaLeft/Right
        setRefAreaLeft(left);
        setRefAreaRight(right);
    };

    const handleSetBaseline = () => {
        if (!selectedRange || !onSetBaseline) return;

        // Filter data points in range
        const rangeData = data.filter(d => d.time >= selectedRange.start && d.time <= selectedRange.end);

        if (rangeData.length === 0) return;

        // Calculate averages of the RAW values
        const sumRaw = rangeData.reduce((acc, curr) => ({
            shoulder: acc.shoulder + (curr.shoulderRaw || 0),
            head: acc.head + (curr.headRaw || 0),
            neckOffset: acc.neckOffset + (curr.neckOffsetRaw || 0),
            embouchure: acc.embouchure + (curr.embouchureRaw || 0)
        }), { shoulder: 0, head: 0, neckOffset: 0, embouchure: 0 });

        const count = rangeData.length;
        const newBaseline = {
            shoulder: sumRaw.shoulder / count,
            head: sumRaw.head / count,
            neckOffset: sumRaw.neckOffset / count,
            embouchure: sumRaw.embouchure / count
        };

        onSetBaseline(newBaseline);

        // Clear selection to signify action was taken
        setRefAreaLeft('');
        setRefAreaRight('');
        setSelectedRange(null);
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 sm:bg-black/80 backdrop-blur-sm">
            <div className="bg-surface rounded-none sm:rounded-2xl border-0 sm:border border-white/10 w-full h-full sm:h-auto sm:max-h-screen max-w-4xl flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-2 sm:p-4 border-b border-white/10 flex justify-between items-center bg-surface/50 shrink-0">
                    <h2 className="text-base sm:text-xl font-bold text-white">Session Posture</h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white px-3 py-1 text-sm sm:text-base rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>

                {/* Chart Area - Flex-1 to take up remaining space above controls */}
                <div className="p-1 sm:p-6 w-full flex-1 min-h-[150px] relative">
                    <div className="absolute inset-0 p-1 sm:p-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onTouchStart={(e) => {
                                    if (e && e.changedTouches && e.changedTouches.length > 0) {
                                        handleMouseDown(e);
                                    }
                                }}
                                onTouchMove={(e) => {
                                    if (e && e.changedTouches && e.changedTouches.length > 0) {
                                        handleMouseMove(e);
                                    }
                                }}
                                onTouchEnd={handleMouseUp}
                                style={{ userSelect: 'none', touchAction: 'none' }} // Prevent scrolling while drawing on chart
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                <XAxis
                                    type="number"
                                    dataKey="time"
                                    domain={['dataMin', 'dataMax']}
                                    stroke="#ffffff60"
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    stroke="#ffffff60"
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '4px 8px' }}
                                    itemStyle={{ color: '#fff', padding: 0 }}
                                />
                                <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px' }} />

                                {/* Safe Zone / Threshold Indicators */}
                                <ReferenceArea y1={-5} y2={5} fill="#10b981" fillOpacity={0.05} strokeOpacity={0} />
                                <ReferenceLine y={5} stroke="#ef4444" strokeOpacity={0.5} strokeDasharray="3 3" />
                                <ReferenceLine y={-5} stroke="#ef4444" strokeOpacity={0.5} strokeDasharray="3 3" />

                                <Line type="monotone" name="Shoulder (°)" dataKey="shoulderDelta" stroke="#3b82f6" activeDot={{ r: 8 }} dot={false} strokeWidth={2} />
                                <Line type="monotone" name="Head (°)" dataKey="headDelta" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                                <Line type="monotone" name="Neck (%)" dataKey="neckOffsetDelta" stroke="#f59e0b" dot={false} strokeWidth={2} />
                                <Line type="monotone" name="Embouchure (°)" dataKey="embouchureDelta" stroke="#ef4444" dot={false} strokeWidth={2} />

                                {audioUrl && data.length > 0 && playbackTime > 0 && playbackTime <= data[data.length - 1].time && (
                                    <ReferenceLine x={playbackTime} stroke="#10b981" strokeDasharray="3 3" />
                                )}

                                {/* Range Selection Highlight */}
                                {refAreaLeft && refAreaRight && (
                                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#8b5cf6" fillOpacity={0.3} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Baseline Setup Control Panel */}
                <div className="p-2 sm:p-4 bg-surface/50 border-t border-white/10 flex flex-col gap-2 shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 w-full">
                        <div className="flex-1 w-full text-center sm:text-left">
                            <p className="text-[10px] sm:text-sm text-white/80 leading-tight">
                                {selectedRange ? (
                                    <>Selected: <span className="font-bold text-primary">{selectedRange.start}s - {selectedRange.end}s</span></>
                                ) : (
                                    <>Drag horizontally to select a section with good posture.</>
                                )}
                            </p>
                        </div>
                        {selectedRange && onSetBaseline && (
                            <div className="flex gap-2 w-full sm:w-auto justify-center">
                                <button
                                    onClick={() => { setRefAreaLeft(''); setRefAreaRight(''); setSelectedRange(null); }}
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold text-white/60 hover:bg-white/10 transition-colors flex-1 sm:flex-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSetBaseline}
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] flex-1 sm:flex-none whitespace-nowrap"
                                >
                                    Set Baseline
                                </button>
                            </div>
                        )}
                    </div>

                    {audioUrl && (
                        <div className="w-full max-w-lg mx-auto border-t border-white/10 pt-2 mt-1">
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                controls
                                className="w-full h-8 sm:h-10"
                                onTimeUpdate={handleTimeUpdate}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionChart;
