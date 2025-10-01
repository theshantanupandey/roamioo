import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface CurrencyConfig {
  symbol: string;
  code: string;
  format: (amount: number) => string;
}

const currencyConfigs: Record<string, CurrencyConfig> = {
  INR: {
    symbol: '₹',
    code: 'INR',
    format: (amount: number) => `₹${amount.toLocaleString('en-IN')}`
  },
  USD: {
    symbol: '$',
    code: 'USD',
    format: (amount: number) => `$${amount.toLocaleString('en-US')}`
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    format: (amount: number) => `€${amount.toLocaleString('en-EU')}`
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    format: (amount: number) => `£${amount.toLocaleString('en-GB')}`
  },
  JPY: {
    symbol: '¥',
    code: 'JPY',
    format: (amount: number) => `¥${amount.toLocaleString('ja-JP')}`
  },
  CAD: {
    symbol: 'C$',
    code: 'CAD',
    format: (amount: number) => `C$${amount.toLocaleString('en-CA')}`
  },
  AUD: {
    symbol: 'A$',
    code: 'AUD',
    format: (amount: number) => `A$${amount.toLocaleString('en-AU')}`
  }
};

export const useCurrency = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<string>('INR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrency = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_settings')
          .select('currency')
          .eq('user_id', user.id)
          .single();

        if (data?.currency) {
          setCurrency(data.currency);
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [user]);

  const formatPrice = (amount: number, currencyOverride?: string) => {
    const currencyCode = currencyOverride || currency;
    const config = currencyConfigs[currencyCode] || currencyConfigs.INR;
    return config.format(amount);
  };

  const getCurrencySymbol = (currencyOverride?: string) => {
    const currencyCode = currencyOverride || currency;
    const config = currencyConfigs[currencyCode] || currencyConfigs.INR;
    return config.symbol;
  };

  return {
    currency,
    setCurrency,
    formatPrice,
    getCurrencySymbol,
    loading
  };
};