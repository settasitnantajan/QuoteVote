'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Quote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Heart,
  Share2,
  Twitter,
  Loader2,
  Facebook,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

interface QuoteCardProps {
  quote: Quote;
  onUpvote: (quote: Quote) => void;
  onDelete: (quote: Quote) => void;
  isVoted: boolean;
  isToggling?: boolean;
}

export function QuoteCard({ quote, onUpvote, onDelete, isVoted, isToggling = false }: QuoteCardProps) {
  const [copiedItem, setCopiedItem] = useState<'link' | 'text' | null>(null);
  const [formattedDate, setFormattedDate] = useState('');
  const { user } = useUser();
  
  // Determine if the current user is the author of the quote.
  const isAuthor = user && quote.createdBy === user.id;

  // Use the most up-to-date info from Clerk for the author's own quotes, otherwise use the data from the quote object.
  const displayAuthor = isAuthor ? user.fullName || quote.author : quote.author;
  const displayAvatarUrl = isAuthor ? user.imageUrl : quote.avatarUrl;

  // Format the date only on the client-side to avoid hydration mismatch.
  useEffect(() => {
    // This ensures the date is formatted using the user's browser locale.
    setFormattedDate(quote.createdAt.toLocaleDateString());
  }, [quote.createdAt]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  const handleShare = (
    platform: 'twitter' | 'facebook' | 'copy-link' | 'copy-text'
  ) => {
    const text = `"${quote.text}" - ${quote.author}`;
    const encodedText = encodeURIComponent(text);

    // Construct a URL that can be scrolled to.
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl}#${quote.id}`;
    const encodedUrl = encodeURIComponent(url);

    const copyToClipboard = (value: string, type: 'link' | 'text') => {
      navigator.clipboard.writeText(value).then(() => {
        setCopiedItem(type);
        setTimeout(() => setCopiedItem(null), 2000);
      });
    };

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'copy-link':
        copyToClipboard(url, 'link');
        break;
      case 'copy-text':
        copyToClipboard(text, 'text');
        break;
    }
  };

  return (
    // Add an id to the card so it can be linked to directly
    <Card id={quote.id}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={displayAvatarUrl} alt={displayAuthor} />
            <AvatarFallback>
              {getInitials(displayAuthor)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle>"{quote.text}"</CardTitle>
            <CardDescription>- {displayAuthor}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Render the formatted date only when it's available on the client */}
        {formattedDate && <p className="text-sm text-muted-foreground">Posted on {formattedDate}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isVoted ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => onUpvote(quote)}
            disabled={isToggling}
            className="transition-transform hover:scale-110"
            aria-pressed={isVoted}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-4 w-4 ${isVoted ? 'text-red-500 fill-red-500' : ''}`}
              />
            )}
          </Button>
          {/* <span className="font-bold text-lg">{quote.votes}</span> */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Share quote" className="transition-transform hover:scale-110">
              <Share2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAuthor && (
              <>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onSelect={() => onDelete(quote)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Quote</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={() => handleShare('twitter')}>
              <Twitter className="mr-2 h-4 w-4" />
              <span>Share on X</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleShare('facebook')}>
              <Facebook className="mr-2 h-4 w-4" />
              <span>Share on Facebook</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => handleShare('copy-link')}
              disabled={copiedItem !== null}
            >
              {copiedItem === 'link' ? (
                <><Check className="mr-2 h-4 w-4 text-green-500" /><span>Copied!</span></>
              ) : (
                <><LinkIcon className="mr-2 h-4 w-4" /><span>Copy Link</span></>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleShare('copy-text')}
              disabled={copiedItem !== null}
            >
              {copiedItem === 'text' ? (
                <><Check className="mr-2 h-4 w-4 text-green-500" /><span>Copied!</span></>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy Text (for IG)</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}