"use client";

export default function Heatmap({ data }: any) {
    const max = Math.max(...data.map((x: any) => x.count), 1);

    return (
        <div className="grid grid-cols-12 gap-1">
            {[...Array(24)].map((_, hour) => {
                const row = data.find((d: any) => d.hour === hour);
                const count = row?.count || 0;
                const intensity = Math.round((count / max) * 255);
                return (
                    <div
                        key={hour}
                        title={`Hour ${hour}: ${count} txns`}
                        className="h-10 rounded"
                        style={{ backgroundColor: `rgb(0, 122, 255, ${intensity / 255})` }}
                    />
                );
            })}
        </div>
    );
}