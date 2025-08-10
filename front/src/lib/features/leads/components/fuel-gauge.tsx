export function FuelGauge({ percentage, color }: { percentage: number; color: string }) {
    const angle = 180 - (percentage / 100) * 180

    return (
        <div className="relative w-12 h-6">
            <svg width="48" height="24" viewBox="0 0 48 24" className="overflow-visible">
                {Array.from({ length: 20 }, (_, i) => {
                    const segmentAngle = 180 - (i * 9)
                    const x1 = 24 + 18 * Math.cos((segmentAngle * Math.PI) / 180)
                    const y1 = 24 - 18 * Math.sin((segmentAngle * Math.PI) / 180)
                    const x2 = 24 + 14 * Math.cos((segmentAngle * Math.PI) / 180)
                    const y2 = 24 - 14 * Math.sin((segmentAngle * Math.PI) / 180)

                    let segmentColor = '#e2e8f0'
                    if (i <= 6) segmentColor = '#f87171'
                    else if (i <= 13) segmentColor = '#fb923c'
                    else segmentColor = '#4ade80'

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={segmentColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    )
                })}

                <line
                    x1="24"
                    y1="24"
                    x2={24 + 16 * Math.cos((angle * Math.PI) / 180)}
                    y2={24 - 16 * Math.sin((angle * Math.PI) / 180)}
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                />

                <circle
                    cx="24"
                    cy="24"
                    r="2"
                    fill={color}
                />

                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="6"
                        markerHeight="4"
                        refX="6"
                        refY="2"
                        orient="auto"
                    >
                        <polygon points="0 0, 6 2, 0 4" fill={color} />
                    </marker>
                </defs>
            </svg>
        </div>
    )
}