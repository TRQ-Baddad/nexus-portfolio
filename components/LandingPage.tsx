import React, { useEffect, useState, useRef } from 'react';
import { Button } from './shared/Button';
import { LogoIcon } from './icons/LogoIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { LayersIcon } from './icons/LayersIcon';
import { FishIcon } from './icons/FishIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LayoutGridIcon } from './icons/LayoutGridIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { QuoteIcon } from './icons/QuoteIcon';
import { DashboardShowcaseSvg } from './svg/DashboardShowcaseSvg';
import { SmartMoneySvg } from './svg/SmartMoneySvg';
import { NftGallerySvg } from './svg/NftGallerySvg';
import { TokenTableSvg } from './svg/TokenTableSvg';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// A custom hook for scroll animations
const useScrollAnimate = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => elements.forEach(el => observer.unobserve(el));
  }, []);
};


const Header: React.FC<{ onLogin: () => void; onGetStarted: () => void; }> = ({ onLogin, onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 transition-colors duration-300 ${scrolled ? 'bg-dark-bg/80 backdrop-blur-sm border-b border-neutral-800' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <a href="#" className="flex items-center space-x-2">
          <LogoIcon className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">Nexus</span>
        </a>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button onClick={onLogin} variant="secondary" size="md" className="!bg-transparent !text-white hover:!bg-neutral-800 hidden sm:flex">
            Log In
          </Button>
          <Button onClick={onGetStarted} size="md" className="bg-brand-orange hover:bg-orange-600 focus:ring-orange-400">
            Get Started Free
          </Button>
        </div>
      </nav>
    </header>
  );
};

const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className, id }) => (
  <section id={id} className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 ${className}`}>
    {children}
  </section>
);

const SectionTitle: React.FC<{ subtitle: string; children: React.ReactNode; }> = ({ subtitle, children }) => (
    <div className="text-center max-w-3xl mx-auto">
        <p className="font-semibold text-brand-orange">{subtitle}</p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">{children}</h2>
    </div>
);


const HeroSection: React.FC<{ onGetStarted: () => void; }> = ({ onGetStarted }) => (
    <div className="relative h-screen min-h-[500px] md:min-h-[700px] flex items-center justify-center text-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-grid-neutral-800/[0.4] [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"></div>
        <div className="relative z-20 px-4 animate-fade-in">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 leading-tight">
                The Command Center for <br/> Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple" style={{
                    animation: 'background-pan 3s linear infinite',
                    backgroundSize: '200%'
                }}>Digital Assets</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-neutral-400">
                Aggregate your entire crypto portfolio from every chain—tokens, NFTs, and DeFi positions—into a single, beautiful, and intelligent dashboard.
            </p>
            <div className="mt-10 flex justify-center">
                <Button onClick={onGetStarted} size="lg" className="bg-brand-orange hover:bg-orange-600 focus:ring-orange-400 px-8 py-4 text-base">
                    Get Started for Free
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
            <a href="#features" aria-label="Scroll down">
              <div className="w-6 h-10 border-2 border-neutral-600 rounded-full flex justify-center items-start p-1">
                <div className="w-1 h-2 bg-neutral-500 rounded-full animate-bounce"></div>
              </div>
            </a>
        </div>
    </div>
);

const FeatureCard: React.FC<{ icon: React.FC<any>; title: string; children: React.ReactNode, svg: React.ReactNode }> = ({ icon: Icon, title, children, svg }) => (
    <div className="bg-card-bg border border-neutral-800 rounded-2xl p-6 flex flex-col items-start hover:border-brand-blue transition-colors group">
        <div className="p-2 bg-neutral-700/50 rounded-lg text-brand-blue mb-4">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-neutral-400 mt-2 flex-grow">{children}</p>
        <div className="mt-6 w-full opacity-70 group-hover:opacity-100 transition-opacity">
          {svg}
        </div>
    </div>
);

const FeaturesSection: React.FC = () => (
  <Section id="features">
    <div className="animate-on-scroll">
      <SectionTitle subtitle="Core Features">
        Everything You Need. Nothing You Don’t.
      </SectionTitle>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard icon={LayersIcon} title="Unified Dashboard" svg={<DashboardShowcaseSvg />}>
          See your entire portfolio—tokens, NFTs, and DeFi positions—from every chain, in one place.
        </FeatureCard>
        <FeatureCard icon={FishIcon} title="Smart Money" svg={<SmartMoneySvg />}>
          Track the wallets of top traders and funds. See what the pros are buying and selling in real-time.
        </FeatureCard>
        <FeatureCard icon={SparklesIcon} title="AI Insights" svg={<TokenTableSvg />}>
          Go beyond numbers. Get personalized, AI-powered analysis to understand your portfolio's health, risks, and opportunities.
        </FeatureCard>
        <FeatureCard icon={LayoutGridIcon} title="NFT Gallery" svg={<NftGallerySvg />}>
          A beautiful, consolidated gallery for all your digital collectibles, with estimated floor prices.
        </FeatureCard>
      </div>
    </div>
  </Section>
);

const HowItWorksStep: React.FC<{ number: string; title: string; children: React.ReactNode; }> = ({ number, title, children }) => (
    <div className="flex-1">
        <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-neutral-800 border-2 border-neutral-700 rounded-full text-brand-orange font-bold text-lg">
                {number}
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 mx-4 hidden sm:block"></div>
        </div>
        <h3 className="text-xl font-bold mt-4">{title}</h3>
        <p className="text-neutral-400 mt-2">{children}</p>
    </div>
);

const HowItWorksSection: React.FC = () => (
    <Section>
        <div className="animate-on-scroll">
            <SectionTitle subtitle="Get Started in Seconds">
                Effortless Onboarding. Instant Clarity.
            </SectionTitle>
            <div className="mt-12 flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-8">
                <HowItWorksStep number="01" title="Connect Your Wallets">
                    Securely add any public wallet address from supported blockchains. We never ask for your private keys.
                </HowItWorksStep>
                <HowItWorksStep number="02" title="View Your Dashboard">
                    Nexus automatically fetches and aggregates all your assets into a single, comprehensive view.
                </HowItWorksStep>
                <HowItWorksStep number="03" title="Gain Insights">
                    Use our powerful analytics and AI tools to understand your portfolio and track the market.
                </HowItWorksStep>
            </div>
        </div>
    </Section>
);

const SecuritySection: React.FC = () => (
  <Section id="security">
    <div className="animate-on-scroll bg-card-bg border border-neutral-800 rounded-2xl p-8 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left">
          <SectionTitle subtitle="Security First">Your Keys, Your Crypto. Always.</SectionTitle>
          <p className="text-neutral-400 mt-4 max-w-md mx-auto md:mx-0">
            Nexus is built on the principle of decentralization. We provide insights on public data—we never have access to your assets.
          </p>
          <ul className="mt-6 space-y-4 text-left inline-block">
            <li className="flex items-start"><ShieldIcon className="w-5 h-5 text-success mr-3 mt-1 flex-shrink-0" /><p><strong>Non-Custodial Protocol:</strong> We never take control of your assets. Your crypto stays in your wallet.</p></li>
            <li className="flex items-start"><ShieldIcon className="w-5 h-5 text-success mr-3 mt-1 flex-shrink-0" /><p><strong>Read-Only Connection:</strong> We only read public on-chain data. We cannot and will not ever initiate transactions.</p></li>
            <li className="flex items-start"><ShieldIcon className="w-5 h-5 text-success mr-3 mt-1 flex-shrink-0" /><p><strong>Privacy First:</strong> Connect with public addresses only. No need to expose sensitive personal information.</p></li>
          </ul>
        </div>
        <div className="flex justify-center items-center">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 bg-brand-blue/30 rounded-full blur-2xl"></div>
            <ShieldIcon className="w-48 h-48 text-brand-blue relative z-10" />
          </div>
        </div>
      </div>
    </div>
  </Section>
);

const TestimonialCard: React.FC<{ quote: string; name: string; handle: string; avatar: string; }> = ({ quote, name, handle, avatar }) => (
    <div className="bg-card-bg border border-neutral-800 rounded-2xl p-6 h-full flex flex-col">
        <QuoteIcon className="w-8 h-8 text-neutral-500 mb-4" />
        <p className="text-neutral-300 flex-grow">"{quote}"</p>
        <div className="mt-6 flex items-center">
            <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
            <div className="ml-4">
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-neutral-400">{handle}</p>
            </div>
        </div>
    </div>
);

const TestimonialsSection: React.FC = () => (
    <Section id="testimonials">
      <div className="animate-on-scroll">
        <SectionTitle subtitle="Social Proof">Trusted by Degens and Devs Alike</SectionTitle>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard name="Clara" handle="@CryptoClara" quote="Tracking whale wallets has never been easier. This is my new secret weapon for spotting trends before they happen." avatar="https://i.pravatar.cc/150?u=clara" />
            <TestimonialCard name="DeFi Dad" handle="@DeFiDad" quote="Nexus finally organized my chaotic multichain life. The AI insights are a game-changer for understanding my risk exposure." avatar="https://i.pravatar.cc/150?u=defidad" />
            <TestimonialCard name="Alex" handle="@NFTCollector_eth" quote="The UI is just stunning. Makes looking at my portfolio a joy, even on red days. The consolidated NFT gallery is perfect." avatar="https://i.pravatar.cc/150?u=alex" />
        </div>
      </div>
    </Section>
);

const CtaSection: React.FC<{ onGetStarted: () => void; }> = ({ onGetStarted }) => (
  <Section>
    <div className="animate-on-scroll">
      <div className="relative bg-gradient-to-br from-brand-blue to-brand-purple rounded-2xl text-center p-6 sm:p-8 md:p-12 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to take control of your crypto universe?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-blue-100">
            Sign up for free and get a complete picture of your digital assets in minutes.
            </p>
            <div className="mt-8">
                <Button onClick={onGetStarted} size="lg" className="!bg-white !text-brand-blue hover:!bg-neutral-200 px-8 py-4 text-base">
                    Sign Up Now
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
      </div>
    </div>
  </Section>
);

const Footer: React.FC = () => (
  <footer className="border-t border-neutral-800 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-neutral-500">
        <div className="flex items-center space-x-2">
          <LogoIcon className="h-6 w-6"/>
          <p>&copy; {new Date().getFullYear()} Nexus Portfolio. All rights reserved.</p>
        </div>
        <div className="flex space-x-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-white">Twitter</a>
          <a href="#" className="hover:text-white">Discord</a>
          <a href="#" className="hover:text-white">Privacy Policy</a>
        </div>
      </div>
  </footer>
);

const AuroraBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-blue/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-brand-purple/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-15%] left-[20%] w-96 h-96 bg-brand-orange/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    useScrollAnimate();
  
    return (
      <div className="bg-dark-bg text-neutral-100 font-sans relative">
        <AuroraBackground />
        <div className="relative z-10 bg-dark-bg/80">
            <Header onLogin={onLogin} onGetStarted={onGetStarted} />
            <main>
                <HeroSection onGetStarted={onGetStarted} />
                <FeaturesSection />
                <HowItWorksSection />
                <SecuritySection />
                <TestimonialsSection />
                <CtaSection onGetStarted={onGetStarted} />
            </main>
            <Footer />
        </div>
      </div>
    );
  };