import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';

export function useCities() {
  return useQuery<string[]>({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/routes/cities`);
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
} 