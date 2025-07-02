'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Quote } from '@/lib/types';
import { getMyQuotes, deleteQuote } from '@/lib/api';
import { QuoteCard } from '@/components/quotes/quote-card';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MyQuotesPage() {
  const { getToken, isSignedIn } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyQuotes = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available.');
      }
      const myQuotes = await getMyQuotes(token);
      setQuotes(myQuotes);
    } catch (error) {
      console.error('Failed to fetch my quotes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load your quotes.');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchMyQuotes();
  }, [fetchMyQuotes]);

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication is required.');

      await deleteQuote(quoteToDelete.id, token);

      toast.success('Your quote has been deleted.');
      setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quoteToDelete.id));
      setQuoteToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete quote.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (quotes.length === 0) {
      return (
        <div className="text-center border-2 border-dashed border-muted-foreground/50 rounded-lg p-12">
          <p className="text-muted-foreground">You haven&apos;t created any quotes yet.</p>
          <Link href="/" passHref>
            <Button variant="link" className="mt-4">
              Go add a quote!
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quotes.map(quote => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onUpvote={() => toast.info("You cannot vote for your own quote.")}
            onDelete={setQuoteToDelete}
            isVoted={false} // User cannot have voted for their own quote
            isToggling={false}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#FEF0D0] py-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
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

      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">My Quotes</h1>
        {isSignedIn ? renderContent() : <p className="text-muted-foreground">Please sign in to see your quotes.</p>}
        <Link href="/" passHref>
          <Button variant="link" className="mt-8">
            &larr; Back to Home
          </Button>
        </Link>
      </div>
    </main>
  );
}
