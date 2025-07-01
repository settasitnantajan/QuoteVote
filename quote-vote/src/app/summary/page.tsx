'use client';

import { useState, useEffect } from 'react';
import { VoteResultChart } from '@/components/quotes/vote-result-chart';
import { Quote } from '@/lib/types';
import { TopQuotesList } from '@/components/quotes/top-quotes-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

// This mock data would ideally be fetched from a central place or an API
const mockQuotes: Quote[] = [
  {
    id: '1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    upvotes: 152,
    userImage: 'https://i.pravatar.cc/40?u=steve-jobs',
    createdAt: new Date('2023-10-26T00:00:00Z'),
  },
  {
    id: '2',
    text: 'Life is what happens when you\'re busy making other plans.',
    author: 'John Lennon',
    upvotes: 240,
    userImage: 'https://i.pravatar.cc/40?u=john-lennon',
    createdAt: new Date('2023-10-25T00:00:00Z'),
  },
  {
    id: '3',
    text: 'Strive not to be a success, but rather to be of value.',
    author: 'Albert Einstein',
    upvotes: 310,
    userImage: 'https://i.pravatar.cc/40?u=albert-einstein',
    createdAt: new Date('2023-10-24T00:00:00Z'),
  },
  {
    id: '4',
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
    upvotes: 450,
    userImage: 'https://i.pravatar.cc/40?u=walt-disney',
    createdAt: new Date('2023-11-01T00:00:00Z'),
  },
  {
    id: '5',
    text: 'Your time is limited, so don\'t waste it living someone else\'s life.',
    author: 'Steve Jobs',
    upvotes: 280,
    userImage: 'https://i.pravatar.cc/40?u=steve-jobs',
    createdAt: new Date('2023-11-05T00:00:00Z'),
  },
  {
    id: '6',
    text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
    author: 'Benjamin Franklin',
    upvotes: 199,
    userImage: 'https://i.pravatar.cc/40?u=benjamin-franklin',
    createdAt: new Date('2023-11-10T00:00:00Z'),
  },
  {
    id: '7',
    text: 'It is during our darkest moments that we must focus to see the light.',
    author: 'Aristotle',
    upvotes: 520,
    userImage: 'https://i.pravatar.cc/40?u=aristotle',
    createdAt: new Date('2023-11-12T00:00:00Z'),
  },
  {
    id: '8',
    text: 'Whoever is happy will make others happy too.',
    author: 'Anne Frank',
    upvotes: 333,
    userImage: 'https://i.pravatar.cc/40?u=anne-frank',
    createdAt: new Date('2023-11-15T00:00:00Z'),
  },
  {
    id: '9',
    text: 'You will face many defeats in life, but never let yourself be defeated.',
    author: 'Maya Angelou',
    upvotes: 610,
    userImage: 'https://i.pravatar.cc/40?u=maya-angelou',
    createdAt: new Date('2023-11-18T00:00:00Z'),
  },
  {
    id: '10',
    text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
    author: 'Nelson Mandela',
    upvotes: 750,
    userImage: 'https://i.pravatar.cc/40?u=nelson-mandela',
    createdAt: new Date('2023-11-20T00:00:00Z'),
  },
  {
    id: '11',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    upvotes: 480,
    userImage: 'https://i.pravatar.cc/40?u=eleanor-roosevelt',
    createdAt: new Date('2023-11-22T00:00:00Z'),
  },
  {
    id: '12',
    text: 'You must be the change you wish to see in the world.',
    author: 'Mahatma Gandhi',
    upvotes: 820,
    userImage: 'https://i.pravatar.cc/40?u=mahatma-gandhi',
    createdAt: new Date('2023-11-25T00:00:00Z'),
  },
  {
    id: '13',
    text: 'In the end, it\'s not the years in your life that count. It\'s the life in your years.',
    author: 'Abraham Lincoln',
    upvotes: 555,
    userImage: 'https://i.pravatar.cc/40?u=abraham-lincoln',
    createdAt: new Date('2023-11-28T00:00:00Z'),
  },
];

// Generate a list of colors to be shared by the chart and the list
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF',
  '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8',
  '#FF6633', '#6699FF', '#33CC33',
];

export default function SummaryPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500); // Adjust the duration as needed
  }, []);

  const totalVotes = mockQuotes.reduce((sum, quote) => sum + quote.upvotes, 0);

  return (
    <main className="min-h-screen bg-[#FEF0D0] py-8">
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
          <h1 className="text-4xl font-bold text-center">Vote Summary</h1>
        </div>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full lg:w-1/2">
            <VoteResultChart quotes={mockQuotes} colors={COLORS} />
          </div>
          <div className="w-full lg:w-1/2">
            <TopQuotesList quotes={mockQuotes} colors={COLORS} totalVotes={totalVotes} />
          </div>
        </div>
      </div>
    </main>
  );
}
