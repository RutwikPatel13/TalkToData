'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { QueryResult_t } from '@/types';

type ChartType_t = 'bar' | 'line' | 'pie';

interface ChartViewProps {
  results: QueryResult_t;
  chartType: ChartType_t;
  xAxisColumn: string;
  yAxisColumn: string;
}

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

export function ChartView({ results, chartType, xAxisColumn, yAxisColumn }: ChartViewProps) {
  // Prepare chart data - transform rows for charting
  const chartData = React.useMemo(() => {
    if (!results?.rows?.length) return [];

    return results.rows.map((row) => ({
      name: String(row[xAxisColumn] ?? ''),
      value: Number(row[yAxisColumn]) || 0,
      [yAxisColumn]: Number(row[yAxisColumn]) || 0,
    }));
  }, [results, xAxisColumn, yAxisColumn]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-500">
        No data available for visualization
      </div>
    );
  }

  // Limit data for pie charts to avoid clutter
  const pieData = chartData.length > 10 ? chartData.slice(0, 10) : chartData;

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [Number(value ?? 0).toLocaleString(), yAxisColumn]}
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg, #fff)',
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#737373', fontSize: 12 }}
            tickLine={{ stroke: '#e5e5e5' }}
          />
          <YAxis
            tick={{ fill: '#737373', fontSize: 12 }}
            tickLine={{ stroke: '#e5e5e5' }}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <Tooltip
            formatter={(value) => [Number(value ?? 0).toLocaleString(), yAxisColumn]}
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg, #fff)',
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={yAxisColumn}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS[0], r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Default: Bar chart
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#737373', fontSize: 12 }}
          tickLine={{ stroke: '#e5e5e5' }}
        />
        <YAxis
          tick={{ fill: '#737373', fontSize: 12 }}
          tickLine={{ stroke: '#e5e5e5' }}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip
          formatter={(value) => [Number(value ?? 0).toLocaleString(), yAxisColumn]}
          contentStyle={{
            backgroundColor: 'var(--chart-tooltip-bg, #fff)',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
          }}
        />
        <Legend />
        <Bar dataKey={yAxisColumn} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export type { ChartType_t };

