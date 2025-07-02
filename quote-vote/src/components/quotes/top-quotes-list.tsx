'use client';

import { Quote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

interface TopQuotesListProps {
  quotes: Quote[];
  colors: string[];
  totalVotes: number;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`;
  }
  return name.substring(0, 2);
};

export function TopQuotesList({ quotes, colors, totalVotes }: TopQuotesListProps) {
  const topQuotes = [...quotes]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10);

  if (topQuotes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Quotes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-6">
          {topQuotes.map((quote, index) => {
            const percentage = totalVotes > 0 ? (quote.votes / totalVotes) * 100 : 0;
            const barColor = colors[index % colors.length];
            return (
              <li key={quote.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={quote.avatarUrl} alt={quote.author} />
                      <AvatarFallback>{getInitials(quote.author)}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{quote.author}</p>
                  </div>
                  <p className="text-sm font-bold">{quote.votes} votes</p>
                </div>
                <blockquote className="text-sm pl-2 border-l-2 border-muted">"{quote.text}"</blockquote>
                <div className="flex items-center gap-3">
                  <div className="relative h-3 flex-grow overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}