import { useState, useEffect } from 'react';
import { WhaleWallet, Token, NFT, Transaction } from '../types';
import { fetchWhalePortfolio } from '../utils/api';


export const useWhalePortfolio = (whale: WhaleWallet | null) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!whale) return;
    
    setLoading(true);
    
    fetchWhalePortfolio(whale).then(data => {
      setTokens(data.whaleTokens);
      setNfts(data.whaleNfts);
      setTransactions(data.whaleTransactions);
      setLoading(false);
    });

  }, [whale]);

  return { tokens, nfts, transactions, loading };
};
