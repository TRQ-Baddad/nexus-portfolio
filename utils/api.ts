import { Wallet, Token, NFT, Transaction, DeFiPosition, Blockchain, WhaleWallet, WhaleSegment, Alert, PortfolioValue, TransactionType } from '../types';
import { BLOCKCHAIN_METADATA } from '../constants';

// --- CONSTANTS & CONFIG ---

const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;

const MORALIS_CHAIN_MAP: Record<string, string> = {
    ethereum: 'eth',
    polygon: 'polygon',
    arbitrum: 'arbitrum',
    base: 'base',
    bsc: 'bsc',
};

const COINGECKO_ID_MAP: Record<string, string> = {
    'ETH': 'ethereum', 'WETH': 'weth', 'SOL': 'solana', 'BTC': 'bitcoin', 'MATIC': 'matic-network',
    'USDC': 'usd-coin', 'ARB': 'arbitrum', 'PEPE': 'pepe', 'BONK': 'bonk', 'WIF': 'dogwifhat',
    'BNB': 'binancecoin', 'USDT': 'tether', 'LINK': 'chainlink', 'UNI': 'uniswap',
    'AAVE': 'aave', 'DAI': 'dai', 'SHIB': 'shiba-inu', 'LDO': 'lido-dao',
    'MKR': 'maker', 'CRV': 'curve-dao-token', 'stETH': 'staked-ether',
};

const NATIVE_TOKEN_IDS: Record<string, string> = {
    ethereum: 'ethereum', solana: 'solana', bitcoin: 'bitcoin', polygon: 'matic-network',
    bsc: 'binancecoin', arbitrum: 'arbitrum', base: 'ethereum',
};

const NATIVE_TOKEN_METADATA: Record<string, { symbol: string, name: string, decimals: number }> = {
    ethereum: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    polygon: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    bsc: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    arbitrum: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    base: { symbol: 'ETH', name: 'Ether', decimals: 18 },
};

// --- HELPER FUNCTIONS ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const resolveIpfsUrl = (url?: string | null): string => {
    if (!url || typeof url !== 'string') {
        // A simple, dependency-free SVG placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzIzMjMyMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjEwIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }
    if (url.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${url.split('ipfs://')[1]}`;
    }
    return url;
};

export async function fetchTokenPrices(tokenIds: string[]): Promise<Record<string, { usd: number; usd_24h_change?: number }>> {
    if (tokenIds.length === 0) return {};
    const uniqueIds = [...new Set(tokenIds)].join(',');
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=usd&include_24hr_change=true`);
        if (!response.ok) throw new Error('Failed to fetch prices from CoinGecko');
        return await response.json();
    } catch (error) {
        console.error('Error fetching token prices:', error);
        return {};
    }
}

// --- NORMALIZERS ---

function normalizeDeFiPosition(pos: any, chain: Blockchain): DeFiPosition | null {
    if (!pos.protocol_id || pos.asset_type !== 'protocol') return null;

    const positionTypeMap: Record<string, DeFiPosition['type']> = {
        lending: 'Lending',
        staking: 'Staking',
        liquidity_pool: 'Liquidity Pool',
        yield_farming: 'Farming',
    };

    return {
        id: `${pos.protocol_id}-${pos.label}-${chain}`,
        platform: pos.protocol_name,
        type: positionTypeMap[pos.category] || 'Staking',
        label: pos.label,
        valueUsd: parseFloat(pos.value_usd),
        tokens: (pos.tokens || []).map((t: any) => ({
            symbol: t.symbol,
            amount: parseFloat(t.amount_formatted),
            valueUsd: parseFloat(t.value_usd),
            logoUrl: resolveIpfsUrl(t.logo_url),
        })),
        apy: parseFloat(pos.apy) || undefined,
        rewardsEarned: (pos.rewards || []).reduce((acc: number, r: any) => acc + parseFloat(r.value_usd), 0),
        durationDays: 0, // Not available from this API
        chain,
        platformLogoUrl: resolveIpfsUrl(pos.protocol_logo_url),
        url: pos.protocol_url,
    };
}

function normalizeEvmTx(tx: any, wallet: Wallet, isNative: boolean): Partial<Transaction> | null {
    const walletAddress = wallet.address.toLowerCase();
    const from = tx.from_address.toLowerCase();
    const to = tx.to_address.toLowerCase();

    if ((from !== walletAddress && to !== walletAddress) || from === to) return null;

    const nativeMeta = NATIVE_TOKEN_METADATA[wallet.blockchain];
    
    const decimals = isNative ? nativeMeta?.decimals ?? 18 : parseInt(tx.token_decimals, 10);
    if (isNaN(decimals)) return null;

    const amount = parseInt(tx.value, 10) / (10 ** decimals);
    if (amount === 0) return null;

    const type: TransactionType = from === walletAddress ? 'send' : 'receive';
    const tokenSymbol = isNative ? nativeMeta?.symbol ?? 'ETH' : tx.token_symbol;
    
    return {
        id: `${tx.transaction_hash}-${isNative ? 'native' : tx.log_index}`,
        hash: tx.transaction_hash,
        type,
        date: tx.block_timestamp,
        tokenSymbol,
        amount,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        chain: wallet.blockchain,
        valueUsd: tx.value_usd ? parseFloat(tx.value_usd) : undefined,
    };
}

function normalizeHeliusTx(tx: any, wallet: Wallet, tokenMetaMap: Map<string, { symbol: string, decimals: number }>): Partial<Transaction>[] {
    const walletAddress = wallet.address;
    const results: Partial<Transaction>[] = [];

    const transfers = [...(tx.nativeTransfers || []), ...(tx.tokenTransfers || [])];

    for (const transfer of transfers) {
        if (transfer.fromUserAccount && transfer.toUserAccount) {
            const from = transfer.fromUserAccount;
            const to = transfer.toUserAccount;
            if (from !== walletAddress && to !== walletAddress || from === to) continue;
            
            const isNative = !transfer.mint;
            const meta = isNative ? { symbol: 'SOL', decimals: 9 } : tokenMetaMap.get(transfer.mint);
            if (!meta) continue;

            results.push({
                id: `${tx.signature}-${transfer.mint || 'native'}`,
                hash: tx.signature,
                type: from === walletAddress ? 'send' : 'receive',
                date: new Date(tx.timestamp * 1000).toISOString(),
                tokenSymbol: meta.symbol,
                amount: isNative ? transfer.amount / (10 ** meta.decimals) : transfer.tokenAmount,
                fromAddress: from,
                toAddress: to,
                chain: 'solana'
            });
        }
    }
    return results;
}

function normalizeBitcoinTx(tx: any, wallet: Wallet): Partial<Transaction> | null {
    const walletAddress = wallet.address;
    
    const valueIn = tx.vin.reduce((sum: number, vin: any) => {
        return sum + (vin.prevout.scriptpubkey_address === walletAddress ? vin.prevout.value : 0);
    }, 0);

    const valueOut = tx.vout.reduce((sum: number, vout: any) => {
        return sum + (vout.scriptpubkey_address === walletAddress ? vout.value : 0);
    }, 0);

    const netValue = valueOut - valueIn; // in satoshis
    if (netValue === 0) return null; // self-transfer with exact change

    const type: TransactionType = netValue > 0 ? 'receive' : 'send';

    let amount = 0;
    let fromAddress = 'Multiple Inputs';
    let toAddress = 'Multiple Outputs';

    if (type === 'receive') {
        amount = netValue / 1e8;
        fromAddress = tx.vin[0]?.prevout.scriptpubkey_address || 'Newly Minted';
        toAddress = walletAddress;
    } else { // send
        const amountSentToOthers = tx.vout.reduce((sum: number, vout: any) => {
            return sum + (vout.scriptpubkey_address !== walletAddress ? vout.value : 0);
        }, 0);
        amount = amountSentToOthers / 1e8;
        fromAddress = walletAddress;
        const recipient = tx.vout.find((vout: any) => vout.scriptpubkey_address !== walletAddress);
        toAddress = recipient?.scriptpubkey_address || 'Self/Multiple';
    }

    if (amount <= 0) return null;

    return {
        id: tx.txid,
        hash: tx.txid,
        type,
        date: new Date(tx.status.block_time * 1000).toISOString(),
        tokenSymbol: 'BTC',
        amount,
        fromAddress,
        toAddress,
        chain: 'bitcoin'
    };
}

// --- CHAIN-SPECIFIC DATA FETCHERS ---

async function fetchEvmAssets(wallets: Wallet[], apiKey: string): Promise<{ tokens: Partial<Token>[], nfts: NFT[], transactions: Partial<Transaction>[], defiPositions: DeFiPosition[] }> {
    const headers = { 'accept': 'application/json', 'X-API-Key': apiKey };
    
    const assetPromises = wallets.map(async (wallet) => {
        const chain = MORALIS_CHAIN_MAP[wallet.blockchain];
        if (!chain) return { tokens: [], nfts: [], transactions: [], defiPositions: [] };
        
        const walletTokens: Partial<Token>[] = [];
        const walletNfts: NFT[] = [];
        const walletTransactions: Partial<Transaction>[] = [];
        const walletDefiPositions: DeFiPosition[] = [];

        try {
            // Fetch native and ERC20 balances
            try {
                const [balanceRes, erc20BalancesRes] = await Promise.all([
                    fetch(`https://deep-index.moralis.io/api/v2.2/${wallet.address}/balance?chain=${chain}`, { headers }),
                    fetch(`https://deep-index.moralis.io/api/v2.2/${wallet.address}/erc20?chain=${chain}`, { headers }),
                ]);
                if (balanceRes.ok) {
                    const data = await balanceRes.json();
                    const nativeMeta = NATIVE_TOKEN_METADATA[wallet.blockchain];
                    if (nativeMeta) {
                        walletTokens.push({
                            id: `${wallet.id}-native`, symbol: nativeMeta.symbol, name: nativeMeta.name,
                            amount: parseInt(data.balance, 10) / (10 ** nativeMeta.decimals),
                            chain: wallet.blockchain, logoUrl: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${wallet.blockchain}/info/logo.png`,
                        });
                    }
                }
                if (erc20BalancesRes.ok) {
                    const erc20Data = await erc20BalancesRes.json();
                    walletTokens.push(...(erc20Data || []).filter((t: any) => !t.possible_spam).map((t: any) => ({
                        id: `${wallet.id}-${t.symbol}`, symbol: t.symbol, name: t.name,
                        amount: parseInt(t.balance, 10) / (10 ** t.decimals),
                        chain: wallet.blockchain, logoUrl: resolveIpfsUrl(t.logo)
                    })));
                }
            } catch (e) { console.error(`Failed to fetch balances for ${wallet.address}:`, e); }

            // Fetch NFTs
            try {
                const nftsRes = await fetch(`https://deep-index.moralis.io/api/v2.2/${wallet.address}/nft?chain=${chain}&limit=50`, { headers });
                if (nftsRes.ok) {
                    const nftsData = await nftsRes.json();
                    for (const nft of nftsData.result || []) {
                        if (nft.normalized_metadata && nft.normalized_metadata.image) {
                            walletNfts.push({
                               id: `${wallet.id}-${nft.token_address}-${nft.token_id}`,
                               name: nft.normalized_metadata.name || nft.name || `#${nft.token_id}`, collection: nft.name || 'Unknown Collection',
                               imageUrl: resolveIpfsUrl(nft.normalized_metadata.image), floorPrice: null, chain: wallet.blockchain,
                               marketplaceUrl: `https://opensea.io/assets/${chain}/${nft.token_address}/${nft.token_id}`
                            });
                        }
                    }
                }
            } catch (e) { console.error(`Failed to fetch NFTs for ${wallet.address}:`, e); }

            // Fetch Transactions
            try {
                const [erc20TxsRes, nativeTxsRes] = await Promise.all([
                    fetch(`https://deep-index.moralis.io/api/v2.2/${wallet.address}/erc20/transfers?chain=${chain}&limit=50`, { headers }),
                    fetch(`https://deep-index.moralis.io/api/v2.2/${wallet.address}/native/transfers?chain=${chain}&limit=50`, { headers }),
                ]);
                if (erc20TxsRes.ok) {
                    const { result } = await erc20TxsRes.json();
                    for(const tx of result) {
                        const normalized = normalizeEvmTx(tx, wallet, false);
                        if (normalized) walletTransactions.push(normalized);
                    }
                }
                if (nativeTxsRes.ok) {
                    const { result } = await nativeTxsRes.json();
                    for(const tx of result) {
                        const normalized = normalizeEvmTx(tx, wallet, true);
                        if (normalized) walletTransactions.push(normalized);
                    }
                }
            } catch (e) { console.error(`Failed to fetch transactions for ${wallet.address}:`, e); }

            // Fetch DeFi Positions
            try {
                const defiPositionsRes = await fetch(`https://deep-index.moralis.io/api/v2.2/${wallet.address}/defi?chain=${chain}`, { headers });
                if (defiPositionsRes.ok) {
                    const defiData = await defiPositionsRes.json();
                    walletDefiPositions.push(...(defiData.protocol_positions || []).map((p: any) => normalizeDeFiPosition(p, wallet.blockchain)).filter(Boolean) as DeFiPosition[]);
                }
            } catch (e) { console.error(`Failed to fetch DeFi positions for ${wallet.address}:`, e); }
            
            return { tokens: walletTokens, nfts: walletNfts, transactions: walletTransactions, defiPositions: walletDefiPositions };

        } catch (error) {
            console.error(`A critical error occurred fetching assets for EVM wallet ${wallet.address}:`, error);
            return { tokens: [], nfts: [], transactions: [], defiPositions: [] };
        }
    });

    const results = await Promise.all(assetPromises);

    return {
        tokens: results.flatMap(r => r.tokens),
        nfts: results.flatMap(r => r.nfts),
        transactions: results.flatMap(r => r.transactions),
        defiPositions: results.flatMap(r => r.defiPositions),
    };
}

async function fetchSolanaAssets(wallets: Wallet[], apiKey: string): Promise<{ tokens: Partial<Token>[], nfts: NFT[], transactions: Partial<Transaction>[], defiPositions: DeFiPosition[] }> {
    const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

    const assetPromises = wallets.map(async (wallet) => {
        const walletTokens: Partial<Token>[] = [];
        const walletNfts: NFT[] = [];
        const walletTransactions: Partial<Transaction>[] = [];
        const tokenMetaMap = new Map<string, { symbol: string, decimals: number }>();
        
        try {
            const [assetsRes, txsRes] = await Promise.all([
                fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'nexus-assets', method: 'getAssetsByOwner', params: { ownerAddress: wallet.address, page: 1, limit: 1000 }}) }),
                fetch(`https://api.helius.xyz/v0/addresses/${wallet.address}/transactions?api-key=${apiKey}&limit=50`)
            ]);
            
            if (assetsRes.ok) {
                const { result } = await assetsRes.json();
                if (result) {
                    const nativeAmount = (result.nativeBalance?.lamports || 0) / 1e9;
                    walletTokens.push({ id: `${wallet.id}-native`, symbol: 'SOL', name: 'Solana', amount: nativeAmount, chain: 'solana', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png' });
                    
                    for (const item of (result.items || [])) {
                        if ((item.interface === 'FungibleToken' || item.interface === 'FungibleAsset') && item.content?.metadata?.symbol) {
                            walletTokens.push({
                                id: `${wallet.id}-${item.content.metadata.symbol}`, symbol: item.content.metadata.symbol, name: item.content.metadata.name,
                                amount: item.token_info.balance / Math.pow(10, item.token_info.decimals),
                                chain: 'solana', logoUrl: resolveIpfsUrl(item.content.links?.image)
                            });
                            tokenMetaMap.set(item.id, { symbol: item.content.metadata.symbol, decimals: item.token_info.decimals });
                        } else if (item.grouping?.group_key === 'collection' && item.content?.metadata) {
                             walletNfts.push({
                                id: item.id, name: item.content.metadata.name, collection: item.grouping.group_value,
                                imageUrl: resolveIpfsUrl(item.content.links?.image), floorPrice: null, chain: 'solana',
                                marketplaceUrl: `https://magiceden.io/item-details/${item.id}`
                            });
                        }
                    }
                }
            }

            if (txsRes.ok) {
                const txsData = await txsRes.json();
                for (const tx of txsData) {
                    walletTransactions.push(...normalizeHeliusTx(tx, wallet, tokenMetaMap));
                }
            }
            
            return { tokens: walletTokens, nfts: walletNfts, transactions: walletTransactions };
        } catch (error) {
            console.error(`Failed to fetch assets for Solana wallet ${wallet.address}:`, error);
            return { tokens: [], nfts: [], transactions: [] };
        }
    });

    const results = await Promise.all(assetPromises);

    return {
        tokens: results.flatMap(r => r.tokens),
        nfts: results.flatMap(r => r.nfts),
        transactions: results.flatMap(r => r.transactions),
        defiPositions: [], // No DeFi from this fetcher
    };
}

async function fetchBitcoinAssets(wallets: Wallet[]): Promise<{ tokens: Partial<Token>[], nfts: NFT[], transactions: Partial<Transaction>[], defiPositions: DeFiPosition[] }> {
    const assetPromises = wallets.map(async (wallet) => {
        const walletTokens: Partial<Token>[] = [];
        const walletTransactions: Partial<Transaction>[] = [];
        try {
            const [balanceRes, txsRes] = await Promise.all([
                fetch(`https://blockstream.info/api/address/${wallet.address}`),
                fetch(`https://blockstream.info/api/address/${wallet.address}/txs`)
            ]);

            if (balanceRes.ok) {
                const balanceData = await balanceRes.json();
                const balance = balanceData.chain_stats.funded_txo_sum - balanceData.chain_stats.spent_txo_sum;
                walletTokens.push({
                    id: `${wallet.id}-native`,
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    amount: balance / 1e8,
                    chain: 'bitcoin',
                    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png'
                });
            } else {
                 console.error(`Blockstream API (address) for ${wallet.address} responded with status ${balanceRes.status}`);
            }

            if (txsRes.ok) {
                const txsData = await txsRes.json();
                for (const tx of txsData.slice(0, 50)) { // Limit txs to avoid performance issues
                    const normalized = normalizeBitcoinTx(tx, wallet);
                    if (normalized) walletTransactions.push(normalized);
                }
            } else {
                 console.error(`Blockstream API (txs) for ${wallet.address} responded with status ${txsRes.status}`);
            }
            return { tokens: walletTokens, transactions: walletTransactions };
        } catch (error) {
            console.error(`Failed to fetch assets for Bitcoin wallet ${wallet.address}:`, error);
            return { tokens: [], transactions: [] };
        }
    });

    const results = await Promise.all(assetPromises);
    
    return {
        tokens: results.flatMap(r => r.tokens),
        transactions: results.flatMap(r => r.transactions),
        nfts: [],
        defiPositions: [],
    };
}


// --- MAIN ORCHESTRATION FUNCTION ---

export async function fetchPortfolioAssets(wallets: Wallet[]): Promise<{ tokens: Token[], nfts: NFT[], transactions: Transaction[], defiPositions: DeFiPosition[] }> {
    if (wallets.length === 0) return { tokens: [], nfts: [], transactions: [], defiPositions: [] };

    const assetPromises = [
        wallets.some(w => MORALIS_CHAIN_MAP[w.blockchain] && MORALIS_API_KEY) 
            ? fetchEvmAssets(wallets.filter(w => MORALIS_CHAIN_MAP[w.blockchain]), MORALIS_API_KEY!)
            : Promise.resolve({ tokens: [], nfts: [], transactions: [], defiPositions: [] }),
        wallets.some(w => w.blockchain === 'solana' && HELIUS_API_KEY)
            ? fetchSolanaAssets(wallets.filter(w => w.blockchain === 'solana'), HELIUS_API_KEY!)
            : Promise.resolve({ tokens: [], nfts: [], transactions: [], defiPositions: [] }),
        wallets.some(w => w.blockchain === 'bitcoin')
            ? fetchBitcoinAssets(wallets.filter(w => w.blockchain === 'bitcoin'))
            : Promise.resolve({ tokens: [], nfts: [], transactions: [], defiPositions: [] }),
    ];
    
    const results = await Promise.all(assetPromises.map(p => p.catch(e => {
        console.error("A data fetching service failed:", e);
        // Return a default empty shape on failure to not break Promise.all
        return { tokens: [], nfts: [], transactions: [], defiPositions: [] };
    })));

    const allPartialTokens = results.flatMap(r => r.tokens || []);
    const allNfts = results.flatMap(r => r.nfts || []);
    const allPartialTransactions = results.flatMap(r => r.transactions || []);
    const allDeFiPositions = results.flatMap(r => r.defiPositions || []);

    const tokenMap = new Map<string, Partial<Token>>();
    allPartialTokens.forEach(token => {
        if (!token.symbol || !token.chain) return;
        const key = `${token.symbol.toLowerCase()}-${token.chain}`;
        if (tokenMap.has(key)) {
            const existing = tokenMap.get(key)!;
            existing.amount = (existing.amount || 0) + (token.amount || 0);
        } else {
            tokenMap.set(key, { ...token, id: key });
        }
    });
    
    const allSymbols = new Set([...Array.from(tokenMap.values()).map(t => t.symbol!), ...allPartialTransactions.map(t => t.tokenSymbol!)]);
    const coingeckoIds = Array.from(allSymbols).map(s => COINGECKO_ID_MAP[s] || s.toLowerCase()).filter(Boolean);
    const prices = await fetchTokenPrices(coingeckoIds);
    
    const finalTokens: Token[] = [];
    for (const token of tokenMap.values()) {
        const priceId = COINGECKO_ID_MAP[token.symbol!] || NATIVE_TOKEN_IDS[token.chain!] || token.symbol!.toLowerCase();
        const priceData = prices[priceId];
        const price = priceData?.usd || 0;
        const change24h = priceData?.usd_24h_change || 0;
        finalTokens.push({ ...token, id: token.id!, price, value: (token.amount || 0) * price, change24h: change24h } as Token);
    }
    
    const finalTransactions: Transaction[] = [];
    for (const tx of allPartialTransactions) {
        if ((tx.valueUsd === undefined || tx.valueUsd === null) && tx.tokenSymbol && tx.chain) {
            const priceId = COINGECKO_ID_MAP[tx.tokenSymbol] || NATIVE_TOKEN_IDS[tx.chain] || tx.tokenSymbol.toLowerCase();
            const price = prices[priceId]?.usd || 0;
            tx.valueUsd = (tx.amount || 0) * price;
        }
        finalTransactions.push(tx as Transaction);
    }

    finalTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { tokens: finalTokens, nfts: allNfts, transactions: finalTransactions.slice(0, 100), defiPositions: allDeFiPositions };
}


// --- Mock Implementations for unused features ---
export async function fetchWhalePortfolio(whale: WhaleWallet): Promise<{ whaleTokens: Token[], whaleNfts: NFT[], whaleTransactions: Transaction[] }> {
    await sleep(700);
    const { tokens, nfts, transactions } = await fetchPortfolioAssets([whale as unknown as Wallet]);
    return { whaleTokens: tokens, whaleNfts: nfts, whaleTransactions: transactions };
}

export async function fetchSegmentPortfolio(segment: WhaleSegment): Promise<{
    aggregatedTokens: Token[], aggregatedNfts: NFT[], aggregatedTransactions: Transaction[], aggregatedPortfolioValue: PortfolioValue
}> {
    if (!segment || segment.addresses.length === 0) {
        return { aggregatedTokens: [], aggregatedNfts: [], aggregatedTransactions: [], aggregatedPortfolioValue: { total: 0, change24h: 0, change24hPercent: 0 }};
    }

    const pseudoWallets: Wallet[] = segment.addresses.map((addrInfo, i) => ({
        id: `segment-wallet-${i}`,
        address: addrInfo.address,
        blockchain: addrInfo.blockchain,
        user_id: 'segment-user',
        created_at: new Date().toISOString(),
    }));

    const allAssets = await fetchPortfolioAssets(pseudoWallets);
    
    const totalValue = allAssets.tokens.reduce((acc, t) => acc + t.value, 0) + allAssets.defiPositions.reduce((acc, p) => acc + p.valueUsd, 0);
    const totalChange24h = allAssets.tokens.reduce((acc, t) => acc + (t.value / (1 + t.change24h/100) * (t.change24h/100)), 0);
    const yesterdayValue = totalValue - totalChange24h;
    const totalChange24hPercent = yesterdayValue > 0 ? (totalChange24h / yesterdayValue) * 100 : 0;

    return { 
        aggregatedTokens: allAssets.tokens, 
        aggregatedNfts: allAssets.nfts, 
        aggregatedTransactions: allAssets.transactions, 
        aggregatedPortfolioValue: {
            total: totalValue,
            change24h: totalChange24h,
            change24hPercent: totalChange24hPercent
        }
    };
}

export async function fetchAlerts(): Promise<Alert[]> { return []; }