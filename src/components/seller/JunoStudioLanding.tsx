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

/* ── Logistics Globe ─────────────────────────────────────── */
const LogisticsGraphic: React.FC = () => {
  const cities = [
    { cx: 258, cy: 158, label: 'ISB' },
    { cx: 240, cy: 178, label: 'LHE' },
    { cx: 270, cy: 242, label: 'KHI' },
    { cx: 148, cy: 210, label: 'DXB' },
  ];
  const activeArcs = [
    { d: 'M 258,158 Q 200,128 148,210', dur: '2.5s', dotColor: '#FF4585' },
    { d: 'M 258,158 Q 276,198 270,242', dur: '2.2s', dotColor: '#FF1818' },
    { d: 'M 240,178 Q 195,218 148,210', dur: '3.0s', dotColor: '#FF4585' },
    { d: 'M 270,242 Q 210,252 148,210', dur: '3.5s', dotColor: '#FF1818' },
  ];

  return (
    <div
      className="w-full h-full relative"
      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,24,24,0.09) 0%, #040404 65%)' }}
    >
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="logArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1818" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF4585" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Globe outline */}
        <circle cx="200" cy="200" r="148" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Latitude ellipses */}
        <ellipse cx="200" cy="200" rx="148" ry="37" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <ellipse cx="200" cy="174" rx="127" ry="32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
        <ellipse cx="200" cy="226" rx="127" ry="32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
        <ellipse cx="200" cy="150" rx="88"  ry="22" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
        <ellipse cx="200" cy="250" rx="88"  ry="22" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />

        {/* Longitude ellipses */}
        <ellipse cx="200" cy="200" rx="37"  ry="148" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="80"  ry="148" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="120" ry="148" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />

        {/* Inactive connections */}
        <path d="M 245,155 Q 268,195 265,242" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <path d="M 148,210 Q 195,252 265,242" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* Animated delivery arcs */}
        {activeArcs.map((arc, i) => (
          <g key={i}>
            <path d={arc.d} fill="none" stroke="url(#logArcGrad)" strokeWidth="1.5" strokeDasharray="5 4">
              <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.8s" repeatCount="indefinite" />
            </path>
            <circle r="3.5" fill={arc.dotColor} opacity="0.9">
              {/* @ts-ignore — animateMotion path attr */}
              <animateMotion dur={arc.dur} repeatCount="indefinite" path={arc.d} />
            </circle>
          </g>
        ))}

        {/* City nodes */}
        {cities.map((city, i) => (
          <g key={i}>
            <circle cx={city.cx} cy={city.cy} r="8" fill="none" stroke="rgba(255,24,24,0.35)" strokeWidth="1">
              <animate attributeName="r"       values="7;14;7"     dur={`${2.5 + i * 0.35}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6"  dur={`${2.5 + i * 0.35}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={city.cx} cy={city.cy} r="4.5" fill="#FF1818" />
            <circle cx={city.cx} cy={city.cy} r="2"   fill="white" />
            <text x={city.cx} y={city.cy - 13} textAnchor="middle"
              fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="monospace" letterSpacing="1">
              {city.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ── AI Neural Network ───────────────────────────────────── */
const AIGraphic: React.FC = () => {
  const lx = [65, 165, 265, 355];
  const ly: number[][] = [
    [80, 140, 200, 260, 320],
    [80, 140, 200, 260, 320],
    [103, 168, 233, 298],
    [155, 245],
  ];
  const path1: [number, number][] = [[0, 0], [1, 1], [2, 0], [3, 0]];
  const path2: [number, number][] = [[0, 3], [1, 3], [2, 2], [3, 1]];
  const isHot = (l: number, n: number) =>
    [...path1, ...path2].some(([pl, pn]) => pl === l && pn === n);
  const inputLabels = ['Style', 'Fit', 'Price', 'Size', 'City'];

  return (
    <div
      className="w-full h-full relative"
      style={{ background: 'radial-gradient(circle at 75% 50%, rgba(255,69,133,0.08) 0%, #040404 70%)' }}
    >
      <svg viewBox="0 0 420 400" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="aiPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1818" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF4585" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* All dim connections */}
        {ly.slice(0, -1).flatMap((layer, li) =>
          layer.flatMap((y1, ni) =>
            ly[li + 1].map((y2, nj) => (
              <line key={`c-${li}-${ni}-${nj}`}
                x1={lx[li]} y1={y1} x2={lx[li + 1]} y2={y2}
                stroke="rgba(255,255,255,0.035)" strokeWidth="0.8"
              />
            ))
          )
        )}

        {/* Hot path 1 */}
        {path1.slice(0, -1).map(([l, n], i) => {
          const [nl, nn] = path1[i + 1];
          return (
            <line key={`h1-${i}`} x1={lx[l]} y1={ly[l][n]} x2={lx[nl]} y2={ly[nl][nn]}
              stroke="url(#aiPathGrad)" strokeWidth="1.5"
            >
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
            </line>
          );
        })}

        {/* Hot path 2 */}
        {path2.slice(0, -1).map(([l, n], i) => {
          const [nl, nn] = path2[i + 1];
          return (
            <line key={`h2-${i}`} x1={lx[l]} y1={ly[l][n]} x2={lx[nl]} y2={ly[nl][nn]}
              stroke="url(#aiPathGrad)" strokeWidth="1.5"
            >
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" repeatCount="indefinite" begin={`${i * 0.4 + 0.6}s`} />
            </line>
          );
        })}

        {/* Nodes */}
        {ly.flatMap((layer, li) =>
          layer.map((y, ni) => {
            const hot = isHot(li, ni);
            return (
              <g key={`n-${li}-${ni}`}>
                {hot && (
                  <circle cx={lx[li]} cy={y} r="12" fill="none" stroke="rgba(255,24,24,0.2)">
                    <animate attributeName="r"       values="9;17;9"    dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={lx[li]} cy={y} r={hot ? 7 : 5.5}
                  fill={hot ? 'rgba(255,24,24,0.2)' : 'rgba(255,255,255,0.03)'}
                  stroke={hot ? 'rgba(255,24,24,0.85)' : 'rgba(255,255,255,0.13)'}
                  strokeWidth={hot ? 1.5 : 0.8}
                />
                {hot && (
                  <circle cx={lx[li]} cy={y} r="2.5" fill="#FF4585">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })
        )}

        {/* Input labels */}
        {inputLabels.map((label, i) => (
          <text key={`il-${i}`} x={lx[0] - 10} y={ly[0][i] + 4} textAnchor="end"
            fill={isHot(0, i) ? 'rgba(255,100,100,0.65)' : 'rgba(255,255,255,0.18)'}
            fontSize="9" fontFamily="monospace"
          >{label}</text>
        ))}

        {/* Output labels */}
        {['Match', 'Match'].map((label, i) => (
          <text key={`ol-${i}`} x={lx[3] + 10} y={ly[3][i] + 4} textAnchor="start"
            fill="rgba(255,69,133,0.8)" fontSize="9" fontFamily="monospace"
          >{label}</text>
        ))}

        {/* Footer watermark */}
        <text x="210" y="382" textAnchor="middle"
          fill="rgba(255,255,255,0.07)" fontSize="7.5" fontFamily="monospace" letterSpacing="2">
          STYLE INFERENCE ENGINE
        </text>
      </svg>
    </div>
  );
};

/* ── StorySection ─────────────────────────────────────────── */
const StorySection: React.FC<{
  title: string;
  subtitle: string;
  description: string;
  side: 'left' | 'right';
  image?: string;
  graphic?: React.ReactNode;
}> = ({ title, subtitle, description, side, image, graphic }) => (
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
        {graphic ? (
          <div className="w-full h-full">{graphic}</div>
        ) : image ? (
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
            <Package size={80} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none" />
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
            placeholder="Email" 
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

              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                <span className="text-xs font-mono text-neutral-300 tracking-[0.2em] uppercase">Pakistan&apos;s First Swipe-to-Shop · Now Live</span>
              </div>

              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-6 uppercase">
                FOR BRANDS <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-2">BY BRANDS.</span>
              </h1>

              <p className="text-lg md:text-xl text-neutral-400 font-light italic mb-10 max-w-lg mx-auto leading-relaxed">
                A marketplace for indie fashion brands.
              </p>

              {/* Social proof stats */}
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-12">
                {([
                  { value: '50+', label: 'Indie Labels' },
                  { value: '12.5%', label: 'Commission Only' },
                ] as { value: string; label: string }[]).map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                    <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/30 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

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

        {/* Community Showcase — "who's already inside" */}
        <section className="py-20 bg-black relative overflow-hidden border-b border-white/5">
          <div className="container mx-auto px-6 mb-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-primary/70 mb-2 block">The Circle</span>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
                  Who&apos;s Already{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">Inside</span>
                </h2>
              </div>
              <p className="text-neutral-500 font-mono text-sm uppercase tracking-[0.2em] shrink-0">
                Invite-Only · 50+ Curated Labels
              </p>
            </div>
          </div>

          {(() => {
            const communityLogos = [
              'enthenio.jpg', 'kainaat.jpg', 'mugho.jpg', 'rakh.jpg',
              'zarukee.jpg', 'egnar.jpg', 'ukiyo.jpeg', 'grabbers.jpg',
              'Aphrodite.png', 'Gumaan.png', 'Kara.png', 'NOIRE.png',
              'Tabaadil.png', 'Seek Attire.png', 'Ukiyo.png', 'NoRgrt.png',
              'Nakashi.png', 'Qariney.png', 'ROPE.png', 'Core Store.png',
            ].map(f => ({ src: `/brand_logos/${f}`, alt: f.split('.')[0] }));
            const row1 = communityLogos.slice(0, Math.ceil(communityLogos.length / 2));
            const row2 = communityLogos.slice(Math.ceil(communityLogos.length / 2));
            return (
              <div className="relative flex flex-col gap-4 overflow-hidden">
                <div className="flex whitespace-nowrap py-3" style={{ animation: 'seller-marquee 50s linear infinite' }}>
                  {[...row1, ...row1, ...row1, ...row1].map((logo, i) => (
                    <div key={i} className="inline-flex items-center justify-center px-5 group">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-white/10 overflow-hidden bg-white/[0.03] grayscale group-hover:grayscale-0 opacity-35 group-hover:opacity-100 group-hover:border-primary/40 transition-all duration-500">
                        <img src={logo.src} alt={logo.alt} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex whitespace-nowrap py-3" style={{ animation: 'seller-marquee-rev 50s linear infinite' }}>
                  {[...row2, ...row2, ...row2, ...row2].map((logo, i) => (
                    <div key={i} className="inline-flex items-center justify-center px-5 group">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-white/10 overflow-hidden bg-white/[0.03] grayscale group-hover:grayscale-0 opacity-35 group-hover:opacity-100 group-hover:border-primary/40 transition-all duration-500">
                        <img src={logo.src} alt={logo.alt} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
                <style>{`
                  @keyframes seller-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
                  @keyframes seller-marquee-rev { from { transform: translateX(-50%) } to { transform: translateX(0) } }
                `}</style>
              </div>
            );
          })()}
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
            title="Logistics"
            description="Focus on your craft, not the courier. Smartlane-managed riders pick up from your warehouse daily. We handle carrier assignment, tracking, and returns — all at a flat 12.5% commission."
            side="left"
            graphic={<LogisticsGraphic />}
          />
          
          <StorySection 
            subtitle="The Discovery"
            title="AI-Driven"
            description="Our app prioritizes stories over stock photos. Your brand campaign imagery is featured front-and-center, powered by a recommendation engine that understands style DNA."
            side="right"
            graphic={<AIGraphic />}
          />

          <StorySection 
            subtitle="The Community"
            title="Indie"
            description="Join an invite-only circle of Pakistan's most ambitious founders. Collaborate on drops, share manufacturing hacks, and scale the ecosystem together."
            side="left"
            image="/brand_banners/kara2.webp"
          />
        </section>

        {/* The Economics */}
        <section className="py-32 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-4 block">The Deal</span>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                FAIR{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">BY DESIGN</span>
              </h2>
              <p className="text-neutral-400 font-light italic mt-4 max-w-md mx-auto text-sm leading-relaxed">
                We take less so you keep more. Our commission is the lowest in Pakistan — by a long way.
              </p>
            </div>

            {/* Main stats row */}
            <div
              className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-2xl mb-px"
              style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
            >
              {([
                {
                  tag: 'Commission',
                  value: '12.5%',
                  sub: 'vs. up to 30% on other platforms',
                  highlight: true,
                },
                {
                  tag: 'Ad Spend Required',
                  value: 'Zero.',
                  sub: 'AI surfaces your brand to the right buyers automatically',
                  highlight: false,
                  gradient: true,
                },
              ] as { tag: string; value: string; sub: string; highlight?: boolean; gradient?: boolean }[]).map((item, i) => (
                <div
                  key={i}
                  className="relative p-10 border-b md:border-b-0 md:border-r last:border-r-0"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  {item.highlight && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent pointer-events-none rounded-none" />
                  )}
                  <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/25 mb-5 relative">{item.tag}</p>
                  <p className={`text-6xl md:text-7xl font-black tracking-tighter leading-none mb-3 relative ${
                    item.gradient
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary'
                      : 'text-white'
                  }`}>
                    {item.value}
                  </p>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed relative">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Supporting details */}
            <div
              className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-2xl"
              style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
            >
              {([
                {
                  icon: <Truck size={16} />,
                  title: 'End-to-End Logistics',
                  desc: 'Smartlane-managed couriers pick up from your warehouse daily. Daily load sheets, airway bills, full tracking — handled.',
                },
                {
                  icon: <Smartphone size={16} />,
                  title: 'Swipe-to-Shop Discovery',
                  desc: 'Buyers swipe through your campaign imagery full-screen. Our AI learns their preferences and surfaces your products intelligently.',
                },
                {
                  icon: <Users size={16} />,
                  title: 'Founder-to-Founder Support',
                  desc: 'Direct WhatsApp access to the Juno founders. We help you optimize listings, plan drops, and grow — not just list and forget.',
                },
              ] as { icon: React.ReactNode; title: string; desc: string }[]).map((item, i) => (
                <div
                  key={i}
                  className="p-8 border-b md:border-b-0 md:border-r last:border-r-0 flex flex-col gap-3"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/35">
                    {item.icon}
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter">{item.title}</h4>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
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
