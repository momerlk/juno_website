import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const steps = [
  {
    number: '01',
    label: 'Discover',
    heading: 'Find labels you\nactually care about.',
    body: 'Juno surfaces indie brands you\'ve never heard of — not because an algorithm promoted them, but because they\'re genuinely good. Browse by vibe, follow your curiosity, let discovery feel like stumbling into something real.',
    image: '/juno_mockups/allbrands_page.png',
    accent: 'from-primary to-secondary',
  },
  {
    number: '02',
    label: 'Follow the Story',
    heading: 'Know the brand\nbehind the piece.',
    body: 'Every label on Juno has a story. Who started it, why they started it, what they\'re making next. When you follow a brand, you\'re not following a catalog — you\'re following a creator.',
    image: '/juno_mockups/beands_page.png',
    accent: 'from-secondary to-primary',
  },
  {
    number: '03',
    label: 'Catch the Drop',
    heading: 'Be there when\nthe next drop lands.',
    body: 'Indie labels drop in small runs. Juno notifies you the moment a brand you follow releases something new. No algorithm delay, no promoted feed — just the drop, when it happens.',
    image: '/juno_mockups/feed.png',
    accent: 'from-primary to-secondary',
  },
  {
    number: '04',
    label: 'Support What\'s Real',
    heading: 'Your purchase funds\nan indie founder.',
    body: 'When you buy on Juno, the money goes directly to the label. No middlemen inflating the price, no mass retailer taking the margin. You\'re not just shopping — you\'re keeping original work alive.',
    image: '/juno_mockups/checkout.png',
    accent: 'from-secondary to-primary',
  },
];

const ScreenshotsSection: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="screenshots" className="py-32 bg-black relative overflow-hidden border-b border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">How it works</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-white tracking-tighter">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic px-2">Journey</span>
          </h2>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto font-light italic">
            From first discovery to becoming part of the scene.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto space-y-32">
          {steps.map((step, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <JourneyStep key={index} step={step} index={index} reversed={isReversed} />
            );
          })}
        </div>
      </div>
    </section>
  );
};

const JourneyStep: React.FC<{
  step: typeof steps[0];
  index: number;
  reversed: boolean;
}> = ({ step, index, reversed }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 }}
      className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-24`}
    >
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-6">
          <span className={`text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r ${step.accent} opacity-20 leading-none`}>
            {step.number}
          </span>
          <span className={`text-xs font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r ${step.accent}`}>
            {step.label}
          </span>
        </div>
        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 whitespace-pre-line leading-tight">
          {step.heading}
        </h3>
        <p className="text-neutral-400 text-lg leading-relaxed font-light">
          {step.body}
        </p>
      </div>

      {/* Phone mockup */}
      <div className="flex-shrink-0 w-[220px] md:w-[260px] relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-10 rounded-[3rem] blur-3xl scale-110`} />
        <div className="relative bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden p-3 backdrop-blur-sm">
          <img
            src={step.image}
            alt={step.label}
            className="w-full h-auto object-contain rounded-[2.5rem]"
            loading="lazy"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ScreenshotsSection;
