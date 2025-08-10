import { FuelGauge } from "@/src/lib/features/leads/components/fuel-gauge"

export function InterestLabel({ leadQuality }: { leadQuality: number | null }) {
    if (!leadQuality) return null

    let color, bgColor, label

    if (leadQuality <= 10) {
        color = '#dc2626'
        bgColor = 'bg-red-100'
        label = 'Never'
    } else if (leadQuality <= 20) {
        color = '#ea580c'
        bgColor = 'bg-orange-100'
        label = 'Minimal'
    } else if (leadQuality <= 40) {
        color = '#d97706'
        bgColor = 'bg-amber-100'
        label = 'Moderate'
    } else if (leadQuality <= 60) {
        color = '#ca8a04'
        bgColor = 'bg-yellow-100'
        label = 'Genuine'
    } else if (leadQuality <= 80) {
        color = '#65a30d'
        bgColor = 'bg-lime-100'
        label = 'Strong'
    } else {
        color = '#16a34a'
        bgColor = 'bg-green-100'
        label = 'Ready'
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <FuelGauge percentage={leadQuality} color={color} />
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold" style={{ color }}>{leadQuality}%</span>
                <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${bgColor}`}
                    style={{ color }}
                >
                    {label}
                </span>
            </div>
        </div>
    )
}