"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
const colors = ["#0ea5e9", "#16a34a", "#a855f7", "#ef4444", "#f59e0b"];

export default function UpiSplit({ data }: any) {
    return (
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="label"
                        outerRadius={120}
                        fill="#8884d8"
                        label
                    >
                        {data.map((_: any, idx: number) => (
                            <Cell key={idx} fill={colors[idx % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}