import React, { useRef, useCallback, useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { DownloadIcon } from './icons/DownloadIcon';
import { ClipboardCopyIcon } from './icons/ClipboardCopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { PortfolioSnapshot } from './PortfolioSnapshot';
import { ComparisonSnapshot } from './ComparisonSnapshot';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';

export const ShareModal: React.FC = () => {
  const {
      isShareModalOpen,
      setIsShareModalOpen,
      portfolioValue,
      tokens,
      shareContext: context,
      displayedUser: user
  } = useAppContext();

  const snapshotRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  
  const shareableLink = `${window.location.origin}${window.location.pathname}?view=share`;

  // When the modal opens, save all the necessary data to localStorage
  // so the new tab (/share) can access it instantly.
  useEffect(() => {
    if (isShareModalOpen) {
      const snapshotPayload = {
        portfolioValue,
        tokens,
        context,
        user
      };
      localStorage.setItem('nexus-snapshot-data', JSON.stringify(snapshotPayload));
    }
  }, [isShareModalOpen, portfolioValue, tokens, context, user]);

  const handleDownload = useCallback((format: 'png' | 'jpeg') => {
    if (snapshotRef.current === null) {
        return;
    }
    setIsDownloading(true);
    const downloader = format === 'png' ? htmlToImage.toPng : htmlToImage.toJpeg;
    
    downloader(snapshotRef.current, { quality: 0.95, backgroundColor: '#111827' })
        .then(function (dataUrl) {
            const link = document.createElement('a');
            link.download = `nexus-portfolio-snapshot.${format}`;
            link.href = dataUrl;
            link.click();
            setIsDownloading(false);
        })
        .catch(function (error) {
            console.error('oops, something went wrong!', error);
            alert('Could not generate image. This may be due to browser limitations or external image sources.');
            setIsDownloading(false);
        });
  }, []);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const renderSnapshot = () => {
    if (context.mode === 'comparison' && context.whale && context.userPortfolio && context.whaleTokens && user) {
        return <ComparisonSnapshot user={user} whale={context.whale} userPortfolio={context.userPortfolio} whaleTokens={context.whaleTokens} />;
    }
    return <PortfolioSnapshot portfolioValue={portfolioValue} tokens={tokens} />;
  }
  
  const onClose = () => setIsShareModalOpen(false);

  return (
    <Modal isOpen={isShareModalOpen} onClose={onClose} title="Share Your Portfolio">
      <div className="space-y-6">
        <div ref={snapshotRef}>
          {renderSnapshot()}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="secondary" onClick={() => handleDownload('png')} disabled={isDownloading}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download PNG'}
            </Button>
            <Button variant="secondary" onClick={() => handleDownload('jpeg')} disabled={isDownloading}>
                 <DownloadIcon className="w-4 h-4 mr-2" />
                 {isDownloading ? 'Downloading...' : 'Download JPG'}
            </Button>
        </div>

        <div>
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Local Preview Link</label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">This link works only in your current browser. For sharing with others, download an image.</p>
            <div className="mt-1 flex rounded-md shadow-sm">
                 <input
                    type="text"
                    readOnly
                    value={shareableLink}
                    className="flex-1 block w-full rounded-none rounded-l-md bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 sm:text-sm text-neutral-500"
                />
                 <button
                    onClick={handleCopyLink}
                    className="relative inline-flex items-center space-x-2 px-4 py-2 border border-l-0 border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:outline-none"
                >
                    {isLinkCopied ? <CheckIcon className="w-5 h-5 text-success" /> : <ClipboardCopyIcon className="w-5 h-5" />}
                    <span>{isLinkCopied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
             <a href={shareableLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-brand-blue hover:underline mt-2">
                Preview Link
                <ExternalLinkIcon className="w-3.5 h-3.5 ml-1" />
            </a>
        </div>

        <div className="pt-2 flex justify-end">
            <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};