import React from 'react';
import { Blockchain, WhaleWallet, DeFiPosition } from './types';
import { EthereumIcon } from './components/icons/EthereumIcon';
import { SolanaIcon } from './components/icons/SolanaIcon';
import { BitcoinIcon } from './components/icons/BitcoinIcon';
import { PolygonIcon } from './components/icons/PolygonIcon';
import { BscIcon } from './components/icons/BscIcon';

export const BLOCKCHAIN_METADATA: Record<Blockchain, { 
  name: string; 
  icon: React.FC<React.SVGProps<SVGSVGElement>>; 
  color: string;
  explorer: {
    txUrl: (hash: string) => string;
    addressUrl: (address: string) => string;
  };
}> = {
  ethereum: { 
    name: 'Ethereum', 
    icon: EthereumIcon, 
    color: '#627EEA',
    explorer: {
      txUrl: (hash) => `https://etherscan.io/tx/${hash}`,
      addressUrl: (address) => `https://etherscan.io/address/${address}`,
    }
  },
  solana: { 
    name: 'Solana', 
    icon: SolanaIcon, 
    color: '#00FFA3',
    explorer: {
      txUrl: (hash) => `https://solscan.io/tx/${hash}`,
      addressUrl: (address) => `https://solscan.io/account/${address}`,
    }
  },
  bitcoin: { 
    name: 'Bitcoin', 
    icon: BitcoinIcon, 
    color: '#F7931A',
    explorer: {
      txUrl: (hash) => `https://www.blockchain.com/btc/tx/${hash}`,
      addressUrl: (address) => `https://www.blockchain.com/btc/address/${address}`,
    }
  },
  polygon: { 
    name: 'Polygon', 
    icon: PolygonIcon, 
    color: '#8247E5',
    explorer: {
      txUrl: (hash) => `https://polygonscan.com/tx/${hash}`,
      addressUrl: (address) => `https://polygonscan.com/address/${address}`,
    }
  },
  bsc: { 
    name: 'BSC', 
    icon: BscIcon, 
    color: '#F3BA2F',
    explorer: {
      txUrl: (hash) => `https://bscscan.com/tx/${hash}`,
      addressUrl: (address) => `https://bscscan.com/address/${address}`,
    }
  },
  arbitrum: { 
    name: 'Arbitrum', 
    icon: EthereumIcon, 
    color: '#28A0F0',
    explorer: {
      txUrl: (hash) => `https://arbiscan.io/tx/${hash}`,
      addressUrl: (address) => `https://arbiscan.io/address/${address}`,
    }
  },
  base: { 
    name: 'Base', 
    icon: EthereumIcon, 
    color: '#0052FF',
    explorer: {
      txUrl: (hash) => `https://basescan.org/tx/${hash}`,
      addressUrl: (address) => `https://basescan.org/address/${address}`,
    }
  },
};

export const EVM_CHAINS: Blockchain[] = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base'];

export const PRO_FEATURES = [
    'Unlimited wallets',
    'Real-time data refresh',
    'Track custom whale wallets',
    'Whale activity alerts',
    'Historical charts',
    'Transaction history',
    'Priority support'
];

export const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    analytics: "Analytics",
    nfts: "NFTs",
    defi: "DeFi",
    transactions: "Transactions",
    smartMoney: "Smart Money",
    community: "Community",
    intelligence: "Intelligence",
    more: "More",
    accountSettings: "Account Settings",
    accountSettingsDescription: "Manage your profile, security, appearance, and notification preferences.",
    general: "General",
    security: "Security",
    appearance: "Appearance",
    notifications: "Notifications",
    tokenHoldings: "Token Holdings",
    tokenHoldingsDescription: "Your fungible tokens across all wallets",
    wallets: "Wallets",
    walletsDescription: "{count} wallets connected"
  },
  es: {
    dashboard: "Panel",
    analytics: "Análisis",
    nfts: "NFTs",
    defi: "DeFi",
    transactions: "Transacciones",
    smartMoney: "Dinero Inteligente",
    community: "Comunidad",
    alerts: "Alertas",
    more: "Más",
    accountSettings: "Configuración de la Cuenta",
    accountSettingsDescription: "Administra tu perfil, seguridad, apariencia y preferencias de notificación.",
    general: "General",
    security: "Seguridad",
    appearance: "Apariencia",
    notifications: "Notificaciones",
    tokenHoldings: "Tenencias de Tokens",
    tokenHoldingsDescription: "Tus tokens fungibles en todas las billeteras",
    wallets: "Billeteras",
    walletsDescription: "{count} billeteras conectadas"
  },
  ar: {
    dashboard: "لوحة التحكم",
    analytics: "التحليلات",
    nfts: "الرموز غير القابلة للاستبدال",
    defi: "التمويل اللامركزي",
    transactions: "المعاملات",
    smartMoney: "الأموال الذكية",
    community: "المجتمع",
    alerts: "التنبيهات",
    more: "المزيد",
    accountSettings: "إعدادات الحساب",
    accountSettingsDescription: "إدارة ملفك الشخصي والأمان والمظهر وتفضيلات الإشعارات.",
    general: "عام",
    security: "الأمان",
    appearance: "المظهر",
    notifications: "الإشعارات",
    tokenHoldings: "ممتلكات الرموز",
    tokenHoldingsDescription: "الرموز المميزة القابلة للاستبدال عبر جميع المحافظ",
    wallets: "المحافظ",
    walletsDescription: "{count} محافظ متصلة"
  }
};