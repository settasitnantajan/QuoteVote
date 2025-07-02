import axios, { AxiosError } from 'axios';
import { Quote } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error('FATAL: NEXT_PUBLIC_API_URL is not defined. Please create a .env.local file in the root of your project and add the variable.');
  // You can throw an error here to stop the application from running without the required environment variable.
}

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
const transformToQuote = (data: any): Quote => {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

// API function to fetch quotes with filtering and sorting
export const getQuotes = async (
  searchTerm: string,
  sortOption: string,
  token: string | null = null
): Promise<Quote[]> => {
  try {
    const response = await axios.get<any[]>(`${API_URL}/quotes`, {
      params: {
        search: searchTerm,
        sort: sortOption,
      },
      headers: getHeaders(token),
    });
    return response.data.map(transformToQuote);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Handle unauthorized errors specifically, maybe some quotes require login to see
        throw new Error('Authentication required to view quotes. Please sign in.');
      }
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'A server error occurred while fetching quotes.';
      throw new Error(errorMessage);
    }
    // For non-Axios errors
    throw new Error('An unexpected error occurred while fetching quotes.');
  }
};

// API function to create a new quote
export const createQuote = async (
  quoteData: { text: string; tags?: string[] },
  token: string
): Promise<Quote> => {
  try {
    const response = await axios.post<any>(`${API_URL}/quotes`, quoteData, {
      headers: getHeaders(token),
    });
    return transformToQuote(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        'A server error occurred while creating the quote.';
      throw new Error(errorMessage);
    }
    throw new Error('An unexpected error occurred while creating your quote.');
  }
};

// API function to fetch the current user's quotes
export const getMyQuotes = async (token: string): Promise<Quote[]> => {
  try {
    // The backend should have a dedicated endpoint for fetching user-specific quotes
    const response = await axios.get<any[]>(`${API_URL}/quotes/me`, {
      headers: getHeaders(token),
    });
    return response.data.map(transformToQuote);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please sign in to view your quotes.');
      }
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || 'A server error occurred while fetching your quotes.';
      throw new Error(errorMessage);
    }
    throw new Error('An unexpected error occurred while fetching your quotes.');
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
    const response = await axios.post<any>(`${API_URL}/quotes/${quoteId}/vote`, { value: 1 }, {
      headers: getHeaders(token),
    });
    return transformToQuote(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Specifically handle unauthorized errors for a clearer user message
        throw new Error('Authentication failed. Please sign in and try again.');
      }
      const axiosError = error as AxiosError<{ message?: string }>;
      // The backend should return a meaningful error, e.g., 403 if already voted
      const errorMessage = axiosError.response?.data?.message || 'A server error occurred during the vote.';
      throw new Error(errorMessage);
    }
    // For non-Axios errors
    throw new Error('An unexpected error occurred while voting.');
  }
};

// API function for un-voting (removing a vote)
export const unvoteForQuote = async (
  quoteId: string,
  token: string
): Promise<Quote> => {
  try {
    // Use DELETE method which is RESTful for removing a resource (the vote)
    const response = await axios.delete<any>(`${API_URL}/quotes/${quoteId}/vote`, {
      headers: getHeaders(token),
    });
    return transformToQuote(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in and try again.');
      }
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'A server error occurred while removing the vote.';
      throw new Error(errorMessage);
    }
    throw new Error('An unexpected error occurred while removing your vote.');
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
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in and try again.');
      }
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to delete this quote.');
      }
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'A server error occurred while deleting the quote.';
      throw new Error(errorMessage);
    }
    throw new Error('An unexpected error occurred while deleting your quote.');
  }
};
