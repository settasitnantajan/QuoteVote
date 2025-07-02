import axios, { AxiosError } from 'axios';
import { Quote } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// For Vercel deployment, it's crucial that the build fails if essential
// environment variables are missing. This prevents deploying a broken app.
if (!API_URL) {
  throw new Error('FATAL: NEXT_PUBLIC_API_URL is not defined. Please add it to your Vercel project environment variables.');
}

// A type for the raw data from the API before transformation.
// This improves type safety by avoiding `any`.
type RawQuote = Omit<Quote, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

// Helper function to get headers, now accepts a token from Clerk
const getHeaders = (token: string | null) => {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper function to transform raw API data into a typed Quote object.
// This is crucial for converting date strings from JSON back into Date objects.
const transformToQuote = (data: RawQuote): Quote => {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

// Centralized error handler to reduce code duplication in each API function.
const handleApiError = (error: unknown, context: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const defaultMessage = `A server error occurred ${context}.`;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;

    if (error.response?.status === 401) {
      // Consolidate authentication errors
      throw new Error(`Authentication required. Please sign in to ${context.replace(/while /g, '')}.`);
    }
    if (error.response?.status === 403) {
      throw new Error(`You are not authorized to ${context.replace(/while /g, '')}.`);
    }

    throw new Error(errorMessage);
  }
  // For non-Axios or unexpected errors
  throw new Error(`An unexpected error occurred ${context}.`);
};

// API function to fetch quotes with filtering and sorting
export const getQuotes = async (
  searchTerm: string,
  sortOption: string,
  token: string | null = null
): Promise<Quote[]> => {
  try {
    const response = await axios.get<RawQuote[]>(`${API_URL}/quotes`, {
      params: {
        search: searchTerm,
        sort: sortOption,
      },
      headers: getHeaders(token),
    });
    return response.data.map(transformToQuote);
  } catch (error) {
    return handleApiError(error, 'while fetching quotes');
  }
};

// API function to create a new quote
export const createQuote = async (
  quoteData: { text: string; tags?: string[] },
  token: string
): Promise<Quote> => {
  try {
    const response = await axios.post<RawQuote>(`${API_URL}/quotes`, quoteData, {
      headers: getHeaders(token),
    });
    return transformToQuote(response.data);
  } catch (error) {
    return handleApiError(error, 'while creating the quote');
  }
};

// API function to fetch the current user's quotes
export const getMyQuotes = async (token: string): Promise<Quote[]> => {
  try {
    // The backend should have a dedicated endpoint for fetching user-specific quotes
    const response = await axios.get<RawQuote[]>(`${API_URL}/quotes/me`, {
      headers: getHeaders(token),
    });
    return response.data.map(transformToQuote);
  } catch (error) {
    return handleApiError(error, 'while fetching your quotes');
  }
};


// API function for voting
export const voteForQuote = async (
  quoteId: string,
  token: string
): Promise<Quote> => {
  try {
    // ส่ง { value: 1 } เป็น body ของ request เพื่อระบุว่าเป็นการ upvote
    // ซึ่งน่าจะตรงกับที่ backend schema ต้องการ
    const response = await axios.post<RawQuote>(`${API_URL}/quotes/${quoteId}/vote`, { value: 1 }, {
      headers: getHeaders(token),
    });
    return transformToQuote(response.data);
  } catch (error) {
    return handleApiError(error, 'during the vote');
  }
};

// API function for un-voting (removing a vote)
export const unvoteForQuote = async (
  quoteId: string,
  token: string
): Promise<Quote> => {
  try {
    // Use DELETE method which is RESTful for removing a resource (the vote)
    const response = await axios.delete<RawQuote>(`${API_URL}/quotes/${quoteId}/vote`, {
      headers: getHeaders(token),
    });
    return transformToQuote(response.data);
  } catch (error) {
    return handleApiError(error, 'while removing the vote');
  }
};

// API function to delete a user's own quote
export const deleteQuote = async (
  quoteId: string,
  token: string
): Promise<{ message: string }> => {
  try {
    const response = await axios.delete<{ message: string }>(`${API_URL}/quotes/${quoteId}`, {
      headers: getHeaders(token),
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'while deleting the quote');
  }
};
