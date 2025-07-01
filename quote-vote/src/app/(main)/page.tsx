'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QuoteCard } from '@/components/quotes/quote-card';
import { Quote } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown, User, LogIn, LogOut, Vote, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { LoadingSkeleton } from '@/components/LoadingSkeleton'; // Import the new component

// Mock data - ในโปรเจกต์จริง ข้อมูลนี้จะมาจาก API
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

type SortOption = 'date_desc' | 'date_asc';

const sortOptions: Record<SortOption, string> = {
  date_desc: 'Newest',
  date_asc: 'Oldest',
};

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [quoteToVote, setQuoteToVote] = useState<Quote | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const slideshowQuotes = useMemo(
    () => [mockQuotes[9], mockQuotes[11], mockQuotes[12]], // Pick a few impactful quotes
    []
  );

  const featuredQuotes = useMemo(() => {
    // Shuffle the array and take the first 5 for the slideshow
    return [...mockQuotes].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, []);

  const handleVoteConfirm = () => {
    if (!quoteToVote || votedIds.has(quoteToVote.id) || isVoting) {
      setQuoteToVote(null);
      return;
    }

    setIsVoting(true);

    const votedQuoteId = quoteToVote.id;
    setQuotes((currentQuotes) =>
      currentQuotes.map((q) =>
        q.id === votedQuoteId ? { ...q, upvotes: q.upvotes + 1 } : q
      )
    );
    setVotedIds((prevIds) => new Set(prevIds).add(votedQuoteId));
    setQuoteToVote(null);

    setTimeout(() => {
      router.push('/summary');
      setIsVoting(false);
    }, 1000); // 1 second delay
  };

  const { sortedQuotes } = useMemo(() => {
    // 1. Filter by search term
    const filtered = quotes.filter(
      (quote) =>
        quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort for the main display list
    const sorted = [...filtered];
    switch (sortOption) {
      case 'date_asc':
        sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'date_desc':
      default:
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return { sortedQuotes: sorted };
  }, [searchTerm, sortOption, quotes]);

  // Simulate loading (replace with your actual data fetching)
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500); // Adjust the duration as needed
  }, []);

  // Show welcome modal on first load with a 30-second countdown
  useEffect(() => {
    if (!isWelcomeModalOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsWelcomeModalOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount or if modal is closed manually
  }, [isWelcomeModalOpen]);

  // Slideshow logic for the welcome modal
  useEffect(() => {
    if (!isWelcomeModalOpen) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slideshowQuotes.length);
        setIsFading(false);
      }, 500); // Match transition duration
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isWelcomeModalOpen, slideshowQuotes.length]);

  return (
    <main className="min-h-screen bg-[#FEF0D0] py-8">
      <div className="container mx-auto">
      <Dialog open={isWelcomeModalOpen} onOpenChange={setIsWelcomeModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2">
              <img src="https://res.cloudinary.com/dmhuvzk6p/image/upload/v1751365681/QuoteVote_rbxsga.png" alt="QuoteVote Logo" className="h-12 w-12" />
              <DialogTitle className="text-center text-3xl font-bold">
                Welcome to QuoteVote!
              </DialogTitle>
            </div>
            <DialogDescription className="text-center pt-2 text-base">
              Discover, share, and vote for your favorite quotes. Let the best
              words win!
            </DialogDescription>
          </DialogHeader>

          {/* Slideshow Section */}
          <div className="py-4">
            <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
              Here's a glimpse of what you'll find...
            </h3>
            <div
              className={`transition-opacity duration-500 ease-in-out ${
                isFading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {slideshowQuotes.length > 0 && (
                <div className="bg-muted/50 p-6 rounded-lg border">
                  <blockquote className="text-center text-lg italic">
                    "{slideshowQuotes[currentSlide].text}"
                  </blockquote>
                  <div className="flex items-center justify-center mt-4">
                    <img
                      src={slideshowQuotes[currentSlide].userImage}
                      alt={slideshowQuotes[currentSlide].author}
                      className="h-8 w-8 rounded-full mr-3"
                    />
                    <p className="font-semibold text-foreground">
                      {slideshowQuotes[currentSlide].author}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Closing in {countdown}s...
            </p>
            <Button
              onClick={() => setIsWelcomeModalOpen(false)}
              className="w-fit"
              size="lg"
            >
              Get Started Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log In</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input id="password" type="password" className="col-span-3" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 pt-2">
            <div>
              <Button type="submit" className="w-full" onClick={() => setIsLoginModalOpen(false)}>
                Log In
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-primary"
              >
                Sign up
              </Button>
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!quoteToVote} onOpenChange={(isOpen) => !isOpen && setQuoteToVote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              You can only vote for each quote once. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteToVote(null)} disabled={isVoting}>
              Cancel
            </Button>
            <Button onClick={handleVoteConfirm} disabled={isVoting}>
              {isVoting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isVoting ? 'Voting...' : 'Confirm Vote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative mb-8">
        {/* Add Logo Here */}
        <div className="absolute top-4 left-4">
          <Link href="/" passHref>
              <img src="https://res.cloudinary.com/dmhuvzk6p/image/upload/v1751365681/QuoteVote_rbxsga.png" alt="QuoteVote Logo" className="h-8 w-auto" />
          </Link>
        </div>


        <div className="absolute top-0 right-0">
          <div className="flex items-center gap-2">
            <Link href="/summary" passHref>
              <Button variant="ghost" size="icon" aria-label="Vote summary">
                <Vote className="h-10 w-10" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User menu">
                  <User className="h-10 w-10" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Welcome, User</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsLoginModalOpen(true)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Log In</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold text-center">QuoteVote</h1>
          <div className="flex w-full max-w-lg flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between sm:w-[150px]"
                >
                  {sortOptions[sortOption]}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(sortOptions) as SortOption[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onSelect={() => setSortOption(key)}
                  >
                    {sortOptions[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Featured Quotes Slideshow */}
      {!isLoading && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-6">
            Featured Quotes
          </h2>
          <Carousel
            plugins={[autoplayPlugin.current]}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-4">
              {featuredQuotes.map((quote) => (
                <CarouselItem
                  key={`featured-${quote.id}`}
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <QuoteCard
                    quote={quote}
                    onUpvote={() => setQuoteToVote(quote)}
                    isVoted={votedIds.has(quote.id)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="ml-12" />
            <CarouselNext className="mr-12" />
          </Carousel>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="fixed inset-0 z-50"><LoadingSkeleton /></div>
      )}

      {/* Main content: Quote list */}
      <h2 className="text-3xl font-bold text-center mb-6">
            Vote your favorite quotes!
          </h2>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedQuotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onUpvote={() => setQuoteToVote(quote)}
            isVoted={votedIds.has(quote.id)}
          />
        ))}
      </div>
      </div>
    </main>
  );
}
