"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const COLORS = {
  critical: "#dc2626", // red-600
  high: "#ea580c",     // orange-600
  medium: "#eab308",   // yellow-500
  low: "#16a34a",      // green-600
  primary: "#005159",  // deep teal (matches --primary)
  brand: "#3DDC97",    // Hapana mint green (matches --brand)
  info: "#2563eb",     // blue-600
  violet: "#9333ea",   // purple-600
  muted: "#94a3b8",
  good: "#16a34a",
  warn: "#eab308",
  bad: "#dc2626",
};

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid hsl(189 30% 91%)",
  borderRadius: 10,
  fontSize: 12,
  color: "hsl(189 100% 7%)",
  boxShadow: "0 8px 24px -8px rgb(0 60 75 / 0.12)",
  padding: "8px 12px",
};

interface SeverityDatum { name: string; value: number; color?: string }

export function SeverityBar({ data }: { data: SeverityDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(189 30% 96%)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || COLORS.primary} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DonutDatum { name: string; value: number; color: string }

export function DonutChart({ data, centerLabel, centerValue }: { data: DonutDatum[]; centerLabel?: string; centerValue?: string }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          {centerValue && <div className="text-3xl font-bold text-text">{centerValue}</div>}
          {centerLabel && <div className="text-[10px] uppercase tracking-wider text-text-dim mt-1 font-medium">{centerLabel}</div>}
        </div>
      )}
    </div>
  );
}

interface TrendDatum { name: string; [key: string]: string | number }

export function TrendArea({
  data,
  series,
}: {
  data: TrendDatum[];
  series: { key: string; color: string; label: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            fill={`url(#grad-${s.key})`}
            strokeWidth={2.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface RadarDatum { subject: string; value: number; max: number }

export function PostureRadar({ data }: { data: RadarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius={92}>
        <PolarGrid stroke="hsl(189 30% 91%)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(189 20% 40%)", fontSize: 10, fontWeight: 500 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(189 15% 55%)", fontSize: 10 }} />
        <Radar name="Posture" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.25} strokeWidth={2} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBar({ data }: { data: { name: string; value: number; color?: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 40, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(189 30% 96%)" }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || COLORS.primary} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { COLORS };
