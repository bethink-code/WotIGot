import { useState, useCallback } from 'react';
import { publicApi } from '@/lib/api';

export interface GeocodeResult {
  formattedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface UseGeocodeAddressReturn {
  status: 'idle' | 'loading' | 'success' | 'error';
  result: GeocodeResult | null;
  error: string | null;
  geocode: (address: string) => Promise<void>;
  reset: () => void;
}

export function useGeocodeAddress(): UseGeocodeAddressReturn {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (address: string) => {
    if (!address.trim()) {
      setError('Please enter an address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      const { data } = await publicApi.post('/geocode', { address });
      
      if (!data.coordinates || !data.formattedAddress) {
        throw new Error('Address not found. Please check and try again.');
      }

      setResult({
        formattedAddress: data.formattedAddress,
        coordinates: data.coordinates,
      });
      setStatus('success');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to verify address';
      setError(message);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    geocode,
    reset,
  };
}

export function useMockGeocodeAddress(): UseGeocodeAddressReturn {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (address: string) => {
    if (!address.trim()) {
      setError('Please enter an address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const lowerAddress = address.toLowerCase();
    if (lowerAddress.includes('invalid') || lowerAddress.includes('xxx')) {
      setError('Address not found. Please check and try again.');
      setStatus('error');
      return;
    }

    setResult({
      formattedAddress: `${address}, South Africa`,
      coordinates: {
        lat: -33.9249 + (Math.random() * 0.1 - 0.05),
        lng: 18.4241 + (Math.random() * 0.1 - 0.05),
      },
    });
    setStatus('success');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    geocode,
    reset,
  };
}
