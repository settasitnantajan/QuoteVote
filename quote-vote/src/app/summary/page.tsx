'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { VoteResultChart } from '@/components/quotes/vote-result-chart';
import { Quote } from '@/lib/types';
import { TopQuotesList } from '@/components/quotes/top-quotes-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getQuotes } from '@/lib/api';

// Generate a list of colors to be shared by the chart and the list
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF',
  '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8',
  '#FF6633', '#6699FF', '#33CC33',
];

export default function SummaryPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, getToken } = useAuth();

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = isSignedIn ? await getToken() : null;
      const fetchedQuotes = await getQuotes('', 'date_desc', token);
      const quotesWithDateObjects = fetchedQuotes.map((q) => ({
        ...q,
        createdAt: typeof q.createdAt === 'string' ? new Date(q.createdAt) : q.createdAt,
      }));
      setQuotes(quotesWithDateObjects);
    } catch (error) {
      console.error('Failed to fetch quotes for summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const totalVotes = useMemo(() => quotes.reduce((sum, quote) => sum + quote.votes, 0), [quotes]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-green-900 text-gray-200 py-8">
      {isLoading && (
        <div className="fixed inset-0 z-50"><LoadingSkeleton /></div>
      )}
      <div className="container mx-auto">
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute left-0">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
            Vote Summary
          </h1>
        </div>
        {!isLoading && quotes.length > 0 ? (
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="w-full lg:w-1/2">
              <VoteResultChart quotes={quotes} colors={COLORS} />
            </div>
            <div className="w-full lg:w-1/2">
              <TopQuotesList quotes={quotes} colors={COLORS} totalVotes={totalVotes} />
            </div>
          </div>
        ) : !isLoading ? (
          <p className="text-center text-gray-400">No quotes found to display a summary.</p>
        ) : null}
      </div>
    </main>
  );
}
