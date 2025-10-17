import { useState, useEffect } from 'react';
import { WhaleSegment, Token, NFT, Transaction, PortfolioValue } from '../types';
import { fetchSegmentPortfolio } from '../utils/api';

export const useWhaleSegmentPortfolio = (segment: WhaleSegment | null) => {
  const [aggregatedTokens, setAggregatedTokens] = useState<Token[]>([]);
  const [aggregatedNfts, setAggregatedNfts] = useState<NFT[]>([]);
  const [aggregatedTransactions, setAggregatedTransactions] = useState<Transaction[]>([]);
  const [aggregatedPortfolioValue, setAggregatedPortfolioValue] = useState<PortfolioValue>({ total: 0, change24h: 0, change24hPercent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!segment) return;
    
    setLoading(true);

    fetchSegmentPortfolio(segment).then(data => {
        setAggregatedTokens(data.aggregatedTokens);
        setAggregatedNfts(data.aggregatedNfts);
        setAggregatedTransactions(data.aggregatedTransactions);
        setAggregatedPortfolioValue(data.aggregatedPortfolioValue);
        setLoading(false);
    });

  }, [segment]);

  return { aggregatedTokens, aggregatedNfts, aggregatedTransactions, aggregatedPortfolioValue, loading };
};