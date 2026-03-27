import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Truck, 
  Users, 
  Smartphone, 
  MessageCircle,
  Package,
  Layers,
  BarChart,
  Palette,
  Settings,
  Mail,
  Lock,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../contexts/SellerAuthContext';

const SpotlightPill: React.FC<{ text: string }> = ({ text }) => (
  <span className="px-6 py-2 rounded-full text-sm font-bold bg-white/5 border border-white/10 text-neutral-200 backdrop-blur-sm whitespace-nowrap">
    {text}
  </span>
);

const StorySection: React.FC<{ title: string; subtitle: string; description: string; side: 'left' | 'right'; image?: string }> = ({ title, subtitle, description, side, image }) => (
  <div className={`flex flex-col ${side === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 mb-32`}>
    <div className="flex-1 w-full">
      <motion.div
        initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <span className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-4 block">{subtitle}</span>
        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
          {title}
        </h2>
        <p className="text-xl text-neutral-400 font-light italic leading-relaxed mb-8">
          {description}
        </p>
      </motion.div>
    </div>
    <div className="flex-1 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative aspect-square lg:aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group"
      >
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
             <Package size={80} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
      </motion.div>
    </div>
  </div>
);

const ProcessStep: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="group flex gap-5 items-start">
    <div className="shrink-0 w-8 pt-1 flex flex-col items-center gap-3">
      <span className="text-[10px] font-mono text-white/20 tracking-[0.3em] leading-none">{number}</span>
      <div className="w-px flex-1 bg-white/[0.06] group-last:hidden min-h-[3rem]" />
    </div>
    <div className="pb-8">
      <h3 className="text-xl font-black text-white mb-2.5 uppercase tracking-tighter group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>
      <p className="text-neutral-400 font-light leading-relaxed text-sm">
        {description}
      </p>
    </div>
  </div>
);

const CondensedAuth: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useSellerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const prefix = window.location.pathname.startsWith('/studio') ? '/studio' : '/seller';
    try {
      await login(email, password);
      navigate(`${prefix}/dashboard`);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input 
            type="email" 
            placeholder="Studio Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors text-white font-medium"
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors text-white font-medium"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm font-bold text-center italic">{error}</p>}
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-2xl font-black uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader className="animate-spin" size={20} /> : <>Enter Studio <ArrowRight size={20} /></>}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button 
          onClick={() => navigate(window.location.pathname.startsWith('/studio') ? '/studio/onboarding' : '/seller/onboarding')}
          className="text-neutral-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
        >
          No Account? <span className="text-primary">Apply to Join</span>
        </button>
      </div>
    </div>
  );
};

const JunoStudioLanding: React.FC = () => {
  const navigate = useNavigate();

  const spotlightPills = [
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary/10 blur-[120px] animate-pulse delay-1000" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/juno_logos/icon+text_white.png" alt="Juno Logo" className="h-8 md:h-10" />
          </div>
          <button 
            onClick={() => navigate(window.location.pathname.startsWith('/studio') ? '/studio/onboarding' : '/seller/onboarding')}
            className="px-8 py-3 rounded-full bg-white text-black text-sm font-black shadow-xl hover:scale-105 transition-all uppercase tracking-tighter"
          >
            Launch Label
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden border-b border-white/5">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >

              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-12 uppercase">
                FOR BRANDS <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-2">BY BRANDS.</span>
              </h1>


              {/* Main CTA Auth Form */}
              <CondensedAuth />
              
              <div className="mt-12 flex justify-center">
                 <a 
                  href="https://wa.me/923158972405" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#25D366] transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  <MessageCircle size={16} /> Need help getting started? WhatsApp Founders
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Process Section - MOVED UP */}
        <section className="py-48 overflow-hidden bg-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
              <div className="lg:col-span-5">
                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none uppercase mb-12">
                  FROM ZERO <br />
                  TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-2">HERO.</span>
                </h2>
                <div className="space-y-16">
                  <ProcessStep 
                    number="01"
                    title="Tell your story"
                    description="Submit your brand profile and campaign lookbooks. We curate labels that represent the future of Pakistani fashion."
                  />
                  <ProcessStep 
                    number="02"
                    title="Onboard your stock"
                    description="Sync your catalogue in minutes. Our team helps you optimize listings for visual discovery."
                  />
                  <ProcessStep 
                    number="03"
                    title="Scale the drop"
                    description="Reach our community of 10,000+ thoughtful shoppers. Watch your narrative convert into growth."
                  />
                </div>
              </div>
              <div className="lg:col-span-7 relative">
                <motion.div 
                  initial={{ opacity: 0, x: 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="relative rounded-[4rem] overflow-hidden shadow-2xl border border-white/10 aspect-[4/5] lg:aspect-[3/4]"
                >
                  <img src="/brand_banners/rakh3.jpg" alt="Process" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-overlay" />
                </motion.div>
                
                {/* Floating Stats UI Component */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute -bottom-12 -left-12 bg-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-xs hidden md:block"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-widest">Live Campaign</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-neutral-400 text-xs uppercase font-bold">Engagement</span>
                      <span className="text-2xl font-black text-white tracking-tighter">+142%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[70%] bg-gradient-to-r from-primary to-secondary rounded-full" />
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-neutral-400 text-xs uppercase font-bold">Conversion</span>
                      <span className="text-2xl font-black text-white tracking-tighter">8.4%</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Narrative Section */}
        <section className="py-32 container mx-auto px-6 overflow-hidden">
          <StorySection 
            subtitle="The Supply Chain"
            title="Surgical Logistics"
            description="Focus on your craft, not the courier. Our riders pick up from your warehouse. We handle the 1-hour delivery, tracking, and returns. All for a flat 12.5% commission."
            side="left"
            image="/brand_banners/noire6.jpg"
          />
          
          <StorySection 
            subtitle="The Discovery"
            title="AI-Driven Narrative"
            description="Our app prioritizes stories over stock photos. Your brand campaign imagery is featured front-and-center, powered by a recommendation engine that understands style DNA."
            side="right"
            image="/brand_banners/ukiyo6.jpg"
          />

          <StorySection 
            subtitle="The Community"
            title="The Indie Circle"
            description="Join an invite-only circle of Pakistan's most ambitious founders. Collaborate on drops, share manufacturing hacks, and scale the ecosystem together."
            side="left"
            image="/brand_banners/kara2.webp"
          />
        </section>

        {/* The Interface Toolkit */}
        <section className="py-32 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-[1fr_1.6fr] gap-16 lg:gap-28 items-start">

              {/* Sticky label column */}
              <div className="lg:sticky lg:top-32">
                <span className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-4 block">The Interface</span>
                <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-6">
                  THE STUDIO<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">OS</span>
                </h2>
                <p className="text-neutral-400 font-light italic leading-relaxed text-sm max-w-xs">
                  A specialized toolkit built to remove the friction of running an online fashion label.
                </p>
              </div>

              {/* Feature manifest list */}
              <div className="divide-y divide-white/[0.06]">
                {([
                  { icon: <Layers size={18} />, title: 'Unified Inventory', desc: 'Direct connection to your existing Shopify or custom stacks. One source of truth for all sales channels.' },
                  { icon: <BarChart size={18} />, title: 'Style Analytics', desc: 'Understand which aesthetics convert. Track saves, shares, and profile deep-dives by your audience.' },
                  { icon: <Palette size={18} />, title: 'Campaign Tools', desc: 'Rich media tools to showcase the craft and purpose behind your collections front-and-center.' },
                  { icon: <Settings size={18} />, title: 'Automated Ops', desc: 'Automated AWB generation, delivery booking, and payout reconciliation — zero admin overhead.' },
                ] as { icon: React.ReactNode; title: string; desc: string }[]).map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-5 py-7 px-4 -mx-4 rounded-xl hover:bg-white/[0.025] transition-all duration-300 cursor-default"
                  >
                    <span className="text-[10px] font-mono tracking-[0.3em] text-white/20 w-5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0 text-white/35 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black uppercase tracking-tighter text-white group-hover:text-primary transition-colors duration-300 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-neutral-400 font-light leading-relaxed">{item.desc}</p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-white/10 group-hover:text-primary/50 -translate-x-1 group-hover:translate-x-0 transition-all duration-300"
                    />
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="container mx-auto px-6 pb-32 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-[3rem] overflow-hidden"
            style={{ border: '1px solid rgba(255,24,24,0.22)', background: 'rgba(5,5,5,0.85)' }}
          >
            {/* Ambient glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-secondary/20 rounded-full blur-[90px] pointer-events-none" />

            {/* Top rule with label */}
            <div className="flex items-center gap-4 px-10 pt-10">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/25">Now Accepting Applications</span>
              <div className="flex-1 h-px bg-primary/15" />
            </div>

            <div className="relative z-10 px-8 md:px-20 py-16 md:py-24">
              <div className="max-w-2xl mx-auto text-center mb-14">
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-[0.9] uppercase">
                  STOP WAITING.<br />
                  START{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">
                    BUILDING.
                  </span>
                </h2>
                <p className="text-neutral-400 font-light italic leading-relaxed max-w-md mx-auto">
                  Join 50+ of Pakistan&apos;s most exciting independent labels.
                  Your studio setup takes less than 10 minutes.
                </p>
              </div>

              {/* Inline auth form for conversion */}
              <CondensedAuth />
            </div>

            {/* Bottom rule */}
            <div className="flex items-center gap-4 px-10 pb-10">
              <div className="flex-1 h-px bg-primary/15" />
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/20">Juno Studio · Pakistan</span>
              <div className="flex-1 h-px bg-primary/15" />
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <img src="/juno_logos/icon_white.png" alt="Juno" className="h-12 mx-auto mb-8 opacity-20" />
          <div className="text-neutral-500 text-sm font-bold uppercase tracking-[0.3em] mb-4">
            Juno Studio &copy; {new Date().getFullYear()}
          </div>
          <div className="flex items-center justify-center gap-8 text-neutral-400">
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms</a>
            <a href="https://wa.me/923158972405" className="text-primary font-black">+92 315 8972405</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JunoStudioLanding;
