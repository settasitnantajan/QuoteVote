'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SignedIn, SignedOut, useAuth, useUser, SignOutButton } from '@clerk/nextjs';
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
import { ChevronDown, LogOut, Loader2, User, List, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Textarea } from '@/components/ui/textarea';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getQuotes, voteForQuote, unvoteForQuote, createQuote, deleteQuote } from '@/lib/api'; // Import API functions
import { useDebounce } from '@/hooks/useDebounce';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type SortOption = 'date_desc' | 'date_asc';

const sortOptions: Record<SortOption, string> = {
  date_desc: 'Newest',
  date_asc: 'Oldest',
};

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [togglingVoteId, setTogglingVoteId] = useState<string | null>(null);
  const [quoteToConfirm, setQuoteToConfirm] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const prevIsSignedIn = useRef(isSignedIn);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const featuredQuotes = useMemo(
    () => [...quotes].sort((a, b) => b.votes - a.votes).slice(0, 5),
    [quotes]
  );

  // Derived state to check if the logged-in user has voted for any quote.
  const hasUserVoted = useMemo(() => {
    if (!isSignedIn) {
      return false;
    }
    return quotes.some(q => q.isVoted);
  }, [quotes, isSignedIn]);

  // The welcome modal can show a few of the featured quotes
  const slideshowQuotes = featuredQuotes.slice(0, 3);

  // This function contains the core logic for casting a vote.
  // It's called either directly or after a confirmation.
  const executeVote = async (quote: Quote) => {
    if (togglingVoteId) return;
    setTogglingVoteId(quote.id);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available.");

      await voteForQuote(quote.id, token);
      toast.success('Vote successful! Redirecting to summary...');
      // Redirect to the summary page after a short delay to allow the user to see the toast
      setTimeout(() => router.push('/summary'), 1500);
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to vote.');
      setTogglingVoteId(null);
    }
  };

  const handleVoteToggle = async (quote: Quote) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    // Prevent multiple clicks while a vote is in progress
    if (togglingVoteId) return;
    
    if (quote.isVoted) {
      // --- UN-VOTE LOGIC ---
      // User is un-voting the currently voted quote. Do it instantly.
      setTogglingVoteId(quote.id);
      // Optimistic update for instant feedback
      setQuotes(currentQuotes =>
        currentQuotes.map(q =>
          q.id === quote.id ? { ...q, votes: q.votes - 1, isVoted: false } : q
        )
      );
      try {
        const token = await getToken();
        if (!token) {
          toast.error('Authentication token not available.');
          throw new Error('Token not found');
        }
        const updatedQuote = await unvoteForQuote(quote.id, token);
        // Re-sync with server state to ensure data consistency
        setQuotes(currentQuotes =>
          currentQuotes.map(q => (q.id === updatedQuote.id ? updatedQuote : q))
        );
        toast.info('Vote removed.');
      } catch (error) {
        console.error('Unvote failed:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to remove vote.');
        // Revert on failure by refetching all quotes
        fetchQuotes();
      } finally {
        setTogglingVoteId(null);
      }
    } else {
      // --- VOTE LOGIC ---
      // Check if the user already has a vote on another quote.
      const hasExistingVote = quotes.some(q => q.isVoted);
      if (hasExistingVote) {
        setQuoteToConfirm(quote); // Open confirmation dialog
      } else {
        await executeVote(quote); // It's their first vote, proceed directly
      }
    }
  };

  const handleConfirmVoteChange = async () => {
    if (quoteToConfirm) {
      await executeVote(quoteToConfirm);
    }
    setQuoteToConfirm(null); // Close dialog
  };

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication is required to delete a quote.');

      await deleteQuote(quoteToDelete.id, token);

      toast.success('Your quote has been deleted.');
      // Remove the quote from the local state to update the UI instantly
      setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quoteToDelete.id));
      setQuoteToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete quote.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!newQuoteText.trim()) {
      toast.error('Quote cannot be empty.');
      return;
    }
    setIsCreating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication is required to create a quote.');

      await createQuote({ text: newQuoteText }, token);

      toast.success('Your quote has been successfully added!');
      setIsCreateModalOpen(false);
      setNewQuoteText('');
      fetchQuotes(); // Refresh the list to show the new quote
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create quote.');
    } finally {
      setIsCreating(false);
    }
  };

  // Fetch quotes from the backend
  const fetchQuotes = useCallback(async () => {
    console.log(`[API] Fetching quotes... Search: "${debouncedSearchTerm}", Sort: "${sortOption}"`);
    setIsLoading(true);
    try {
      const token = isSignedIn ? await getToken() : null;
      const fetchedQuotes = await getQuotes(debouncedSearchTerm, sortOption, token);
      // Convert createdAt string from API to Date object
      const quotesWithDateObjects = fetchedQuotes.map((q) => ({
        ...q,
        createdAt: typeof q.createdAt === 'string' ? new Date(q.createdAt) : q.createdAt,
        updatedAt: q.updatedAt && typeof q.updatedAt === 'string' ? new Date(q.updatedAt) : q.updatedAt,
      }));
      console.log('[API] Successfully fetched', quotesWithDateObjects.length, 'quotes.');
      setQuotes(quotesWithDateObjects);
    } catch (error) {
      console.error('[API] Failed to fetch quotes:', error);
      // Handle error state in UI
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, sortOption, isSignedIn, getToken]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    console.log('[HomePage] Component mounted.');
  }, []);

  useEffect(() => {
    if (isSignedIn && user) {
      console.log(`[Auth] User signed in: ${user.fullName} (ID: ${user.id})`);
    } else if (prevIsSignedIn.current && !isSignedIn) {
      console.log('[Auth] User signed out.');
    }
    // Update the ref to the current state for the next render
    prevIsSignedIn.current = isSignedIn;
  }, [isSignedIn, user]);

  // This effect runs once on mount to check if it's the user's first visit.
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedQuoteVote');
    if (!hasVisited) {
      setIsWelcomeModalOpen(true);
      localStorage.setItem('hasVisitedQuoteVote', 'true');
    }
  }, []); // Empty dependency array ensures it runs only once on the client.

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
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-green-900 text-gray-200 py-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
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
              Here&apos;s a glimpse of what you&apos;ll find...
            </h3>
            <div
              className={`transition-opacity duration-500 ease-in-out ${
                isFading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {slideshowQuotes.length > 0 && (
                <div className="bg-black p-6 rounded-lg">
                  <blockquote className="text-center text-lg italic text-gray-100">&quot;{slideshowQuotes[currentSlide].text}&quot;</blockquote>
                  <div className="flex items-center justify-center mt-4">
                    <img
                      src={slideshowQuotes[currentSlide].avatarUrl}
                      alt={slideshowQuotes[currentSlide].author}
                      className="h-8 w-8 rounded-full mr-3 border-2 border-gray-500"
                    />
                    <p className="font-semibold text-gray-300">
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
            {/* The "Get Started" button was here. It can be re-added if needed. */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for changing a vote */}
      <Dialog open={!!quoteToConfirm} onOpenChange={(isOpen) => !isOpen && setQuoteToConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote Change</DialogTitle>
            <DialogDescription>
              You can only have one active vote. Voting for this quote will remove your previous vote. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteToConfirm(null)} disabled={!!togglingVoteId}>
              Cancel
            </Button>
            <Button onClick={handleConfirmVoteChange} disabled={!!togglingVoteId}>
              {togglingVoteId === quoteToConfirm?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {togglingVoteId === quoteToConfirm?.id ? 'Changing...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for deleting a quote */}
      <Dialog open={!!quoteToDelete} onOpenChange={(isOpen) => !isOpen && setQuoteToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this quote.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for creating a new quote */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Your Quote</DialogTitle>
            <DialogDescription>
              Share some wisdom with the world. Your quote will be published under your name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quote-text">Quote</Label>
              <Textarea
                id="quote-text"
                value={newQuoteText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewQuoteText(e.target.value)}
                placeholder="The journey of a thousand miles begins with a single step."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>Cancel</Button>
            <Button onClick={handleCreateQuote} disabled={isCreating || !newQuoteText.trim()}>
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header Section: Refactored for better responsiveness */}
      <header className="mb-8">
        {/* Top navigation bar */}
        <nav className="flex items-center justify-between p-2 sm:p-4">
          <Link href="/" passHref>
            <img src="https://res.cloudinary.com/dmhuvzk6p/image/upload/v1751365681/QuoteVote_rbxsga.png" alt="QuoteVote Logo" className="h-8 w-auto cursor-pointer" />
          </Link>
          <div className="flex items-center gap-2">
            {hasUserVoted && (
              <Link href="/summary" passHref>
                <Button
                  variant="ghost"
                  aria-label="Vote summary"
                  className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent font-semibold hover:bg-red-500/5"
                >
                  Vote Summary
                </Button>
              </Link>
            )}
            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <SignedIn>
                    <img
                      src={user?.imageUrl}
                      alt={user?.fullName || 'User avatar'}
                      className="h-8 w-8 rounded-full"
                    />
                  </SignedIn>
                  <SignedOut>
                    <User className="h-6 w-6" />
                  </SignedOut>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <SignedIn>
                  <DropdownMenuLabel>
                    Welcome, {user?.username || user?.fullName}!
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user && (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.fullName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.primaryEmailAddress?.emailAddress}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/my-quotes">
                      <List className="mr-2 h-4 w-4" />
                      <span>My Quotes</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton>
                    <DropdownMenuItem className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </SignOutButton>
                </SignedIn>
                <SignedOut>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/sign-up">Sign Up</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/sign-in">Log In</Link></DropdownMenuItem>
                </SignedOut>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Main hero content */}
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
          <SignedIn>
            <h2 className="text-xl font-semibold sm:text-2xl bg-gradient-to-r from-cyan-400 to-lime-400 bg-clip-text text-transparent">
              Welcome, {user?.fullName}!
            </h2>
          </SignedIn>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <h1 className="text-4xl font-bold sm:text-5xl bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
              QuoteVote
            </h1>
            <SignedIn>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="destructive" className="transition-transform hover:scale-105">
                <Plus className="mr-2 h-4 w-4" /> Add Quote
              </Button>
            </SignedIn>
          </div>
          <div className="mt-4 flex w-full max-w-lg flex-col gap-2 px-4 sm:flex-row sm:px-0">
            <Input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
      </header>

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
              {featuredQuotes.map((quote, index) => (
                <CarouselItem
                  key={`featured-${quote.id || index}`}
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <QuoteCard
                    quote={quote}
                    onUpvote={handleVoteToggle}
                    onDelete={setQuoteToDelete}
                    isVoted={!!quote.isVoted}
                    isToggling={togglingVoteId === quote.id}
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
      {isLoading ? (
        <LoadingSkeleton />
      ) : quotes.length > 0 ? (
        <>
          {/* Main content: Quote list */}
          <h2 className="text-3xl font-bold text-center mb-6">
            Vote your favorite quotes!
          </h2>
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quotes.map((quote, index) => (
              <QuoteCard
                key={quote.id || `quote-${index}`}
                quote={quote}
                onUpvote={handleVoteToggle}
                onDelete={setQuoteToDelete}
                isVoted={!!quote.isVoted}
                isToggling={togglingVoteId === quote.id}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 mt-8">No quotes found. Try a different search!</p>
      )}
      </div>
    </main>
  );
}
