'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote } from '@/lib/types';

interface VoteResultChartProps {
  quotes: Quote[];
  colors: string[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="font-bold">{data.author || data.name}</p>
        <p className="text-sm text-muted-foreground">{`${data.value} votes`}</p>
      </div>
    );
  }

  return null;
};

export function VoteResultChart({ quotes, colors }: VoteResultChartProps) {
  const sortedQuotes = [...quotes].sort((a, b) => b.upvotes - a.upvotes);
  const top10Quotes = sortedQuotes.slice(0, 10);
  const otherQuotes = sortedQuotes.slice(10);

  const chartData = top10Quotes.map((quote) => ({
    name: `${quote.author}: "${quote.text.substring(0, 30)}..."`,
    value: quote.upvotes,
    author: quote.author,
  }));

  // Group the rest of the quotes into an "Others" category for a cleaner chart
  if (otherQuotes.length > 0) {
    const otherVotes = otherQuotes.reduce(
      (sum, quote) => sum + quote.upvotes,
      0
    );
    chartData.push({
      name: 'Others',
      value: otherVotes,
      author: 'Various',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 800 }}>
          <ResponsiveContainer>
            <PieChart margin={{ bottom: 90 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={180}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="left"
                formatter={(value, entry, index) => {
                  // Don't rank the "Others" category
                  if (value === 'Others') {
                    return <span style={{ color: '#333' }}>{value}</span>;
                  }
                  return (
                    <span><span style={{ fontWeight: 'bold' }}>#{index + 1}</span> {value}</span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}