import React from 'react';
import { NFT } from '../types';
import { Modal } from './shared/Modal';
import { BLOCKCHAIN_METADATA } from '../constants';
import { Button } from './shared/Button';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';

interface NftDetailModalProps {
  nft: NFT | null;
  onClose: () => void;
}

export const NftDetailModal: React.FC<NftDetailModalProps> = ({ nft, onClose }) => {
  if (!nft) return null;

  const ChainIcon = BLOCKCHAIN_METADATA[nft.chain]?.icon || (() => null);
  const floorPriceSymbol = nft.chain === 'solana' ? 'SOL' : 'ETH';

  return (
    <Modal isOpen={!!nft} onClose={onClose} title={nft.name}>
      <div className="flex flex-col sm:flex-row sm:space-x-6">
        <div className="sm:w-1/2 flex-shrink-0">
          <img 
            src={nft.imageUrl} 
            alt={nft.name} 
            className="w-full aspect-square object-cover rounded-lg"
          />
        </div>
        <div className="sm:w-1/2 mt-4 sm:mt-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{nft.name}</h3>
              <p className="text-md text-neutral-500 dark:text-neutral-300">{nft.collection}</p>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3">
               {nft.floorPrice && (
                   <div>
                      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Floor Price</p>
                      <div className="flex items-center text-lg font-semibold text-neutral-900 dark:text-white mt-1">
                          <ChainIcon className="w-5 h-5 mr-2" />
                          <span>{nft.floorPrice.toLocaleString()} {floorPriceSymbol}</span>
                      </div>
                  </div>
               )}
               <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Blockchain</p>
                   <div className="flex items-center text-lg font-semibold text-neutral-900 dark:text-white mt-1">
                      <ChainIcon className="w-5 h-5 mr-2" />
                      <span>{BLOCKCHAIN_METADATA[nft.chain].name}</span>
                  </div>
              </div>
            </div>
          </div>
          <a
            href={nft.marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-4"
          >
            <Button className="w-full">
              View on Marketplace
              <ArrowUpRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};
