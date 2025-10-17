import React from 'react';

export type Blockchain = 'ethereum' | 'solana' | 'bitcoin' | 'polygon' | 'bsc' | 'arbitrum' | 'base';

export type TransactionType = 'send' | 'receive' | 'swap';

export type TransactionSignificance = 'First Buy' | 'Sell Off' | 'High Volume' | 'New Position';

export interface Wallet {
  id: string; // Changed to string for UUID from Supabase
  address: string;
  nickname?: string;
  blockchain: Blockchain;
  user_id: string; // Foreign key to auth.users
  created_at: string; // ISO 8601 timestamp
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  value: number;
  change24h: number;
  chain: Blockchain;
  logoUrl: string;
}

export interface WatchlistToken {
  id: string; // coingecko_id
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  logoUrl: string;
  marketCap: number;
  totalVolume: number;
}

export interface NFT {
  id: string;
  name: string;
  collection: string;
  imageUrl: string;
  floorPrice: number | null;
  chain: Blockchain;
  marketplaceUrl: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  date: string; // ISO 8601
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  fromAddress: string;
  toAddress: string;
  chain: Blockchain;
  significance?: TransactionSignificance;
  realizedPnl?: number;
}

export interface DeFiPositionToken {
  symbol: string;
  amount: number;
  valueUsd: number;
  logoUrl: string;
}

export interface DeFiPosition {
    id: string;
    platform: string;
    type: 'Staking' | 'Liquidity Pool' | 'Lending' | 'Farming';
    label: string;
    valueUsd: number;
    tokens: DeFiPositionToken[];
    apy?: number;
    rewardsEarned: number;
    durationDays: number;
    chain: Blockchain;
    platformLogoUrl: string;
    url: string;
}

export interface PortfolioValue {
  total: number;
  change24h: number;
  change24hPercent: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  value: number;
}

export type UserPlan = 'Free' | 'Pro';

export type UserStatus = 'Active' | 'Suspended';

export type UserRole = 'Customer' | 'Administrator' | 'Content Editor' | 'Support Agent';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
  avatar_url: string;
  role: UserRole;
  bio?: string;
  status: UserStatus;
  last_sign_in_at: string | null;
  admin_dashboard_layout?: string[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    currency?: string;
    dashboardLayout?: DashboardComponentKey[];
    isPrivacyMode?: boolean;
  };
}

export interface Alert {
    id: string;
    whaleId: string;
    whaleName: string;
    transaction: Transaction;
    timestamp: string; // ISO 8601
    isRead: boolean;
}

export interface WhaleWallet {
    id: string;
    name: string;
    address: string;
    blockchain: Blockchain;
    description: string;
    totalValue: number;
    change24h: number;
    isCustom?: boolean;
    isFeatured?: boolean;
    isLoading?: boolean;
}

export type ActiveView = 'dashboard' | 'nfts' | 'defi' | 'transactions' | 'analytics' | 'smart-money' | 'community' | 'intelligence' | 'profile' | 'alerts' | 'support';

export type DashboardComponentKey = 'tokens' | 'wallets' | 'ai_insights' | 'nfts_overview' | 'defi_summary';

export interface Insight {
    type: 'warning' | 'info' | 'opportunity';
    title: string;
    description: string;
}

export interface CommunityTopic {
    topic: string;
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    summary: string;
    volume: number;
}

export interface MorningBrief {
    headline: string;
    portfolioSummary: string;
    topInsight: string;
    whaleWatch: string;
    marketPulse: string;
}

export type IntelligenceEventType = 'portfolio_movement' | 'whale_alert' | 'insight';

export interface IntelligenceEvent {
    id: string;
    type: IntelligenceEventType;
    timestamp: string; // ISO 8601
    data: Token | Alert | Insight;
}

export interface CommandAction {
    id: string;
    label: string;
    group: string;
    onSelect: () => void;
    icon?: React.ReactNode;
    keywords?: string;
}

export interface AiSuggestedWhale {
    name: string;
    address: string;
    blockchain: Blockchain;
    description: string;
}

export interface WhaleSegment {
    id: string;
    name: string;
    description: string;
    addresses: { address: string; blockchain: Blockchain }[];
}

export interface SupportTicket {
  id: string; // uuid
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
}

export interface TicketReply {
  id: string; // uuid
  created_at: string;
  ticket_id: string;
  user_id: string; // The ID of the replier (could be user or admin)
  author_name: string; // Display name of the replier
  is_admin_reply: boolean;
  message: string;
}