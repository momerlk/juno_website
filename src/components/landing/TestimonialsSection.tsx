import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Flame, Heart, Star, MessageCircle } from 'lucide-react';

type CardType = 'voice' | 'drop' | 'moment';

interface FeedItem {
  type: CardType;
  name: string;
  handle?: string;
  text: string;
  tag?: string;
  brand?: string;
  time: string;
  likes?: number;
  rating?: number;
}

const feedItems: FeedItem[] = [
  {
    type: 'drop',
    name: 'Ukiyo',
    handle: '@ukiyo.pk',
    text: 'The Tensai Jersey just dropped. Bird-eye mesh, oversized cut, built for the city. First run — 40 pieces.',
    tag: 'New Drop',
    time: '2h ago',
    likes: 284,
  },
  {
    type: 'voice',
    name: 'Shanzeh Khan',
    handle: '@shanzeh',
    text: 'thank god someone made an app that doesn\'t make shopping monotonous and boring 😔🔥 this is so fun and i couldn\'t recommend it enough!!',
    time: '5h ago',
    likes: 91,
    rating: 5,
  },
  {
    type: 'moment',
    name: 'NOIRE',
    handle: '@noire.studio',
    text: 'Every stitch by hand. The Hand Knitted Sweater took 6 days to make. We made 20. This is what craft looks like.',
    tag: 'Behind the Seams',
    time: '1d ago',
    likes: 412,
  },
  {
    type: 'voice',
    name: 'Amal',
    handle: '@amal.fits',
    text: 'Love discovering new Pakistani fashion brands on Juno! Easy to use, trendy clothes, and actually supporting local designers — finally.',
    time: '8h ago',
    likes: 63,
    rating: 5,
  },
  {
    type: 'drop',
    name: 'Grabbers',
    handle: '@grabbers.pk',
    text: 'GBR Street Racer Set. Limited run. The energy is different when you wear something built by people who care.',
    tag: 'Limited Run',
    time: '3h ago',
    likes: 178,
  },
  {
    type: 'voice',
    name: 'Jannat Imran',
    handle: '@jannat',
    text: 'Juno\'s absolutely a banger!! cannot wait to see it rise to the top 💕',
    time: '1d ago',
    likes: 44,
    rating: 5,
  },
  {
    type: 'moment',
    name: 'Kara',
    handle: '@kara.official',
    text: 'The Teal Coord started as a sketch on a Tuesday. Marine fabric, minimal silhouette. Worn once — sold out in 3 hours.',
    tag: 'Founder Note',
    time: '2d ago',
    likes: 329,
  },
  {
    type: 'voice',
    name: 'Mustafa Qureshi',
    handle: '@mustafa.q',
    text: 'The \'tinder for clothes\' idea is great. Love how simple it makes discovery. Stumbled onto three brands I\'d never heard of.',
    time: '3d ago',
    likes: 57,
    rating: 4,
  },
  {
    type: 'voice',
    name: 'Zainab Haroon',
    handle: '@zainab.h',
    text: 'In love with the swipe feature! It makes finding new indie labels an actual experience instead of a chore.',
    time: '2d ago',
    likes: 82,
    rating: 5,
  },
  {
    type: 'drop',
    name: 'Aqs Attire',
    handle: '@aqsattire',
    text: 'New collection drops Friday. Two years of building this brand from a bedroom. Each piece is proof that indie is the future.',
    tag: 'Coming Friday',
    time: '12h ago',
    likes: 501,
  },
  {
    type: 'voice',
    name: 'Ibrahim',
    handle: '@ibrahim',
    text: 'A refreshing step forward for Pakistan\'s fashion scene. The app is sleek and beautifully showcases outfits. Feels thoughtfully curated.',
    time: '4d ago',
    likes: 73,
    rating: 5,
  },
];

const tagStyles: Record<string, string> = {
  'New Drop': 'bg-primary/20 text-primary border-primary/30',
  'Limited Run': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Behind the Seams': 'bg-white/10 text-neutral-300 border-white/20',
  'Founder Note': 'bg-secondary/20 text-secondary border-secondary/30',
  'Coming Friday': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const VoiceCard: React.FC<{ item: FeedItem }> = ({ item }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm hover:bg-white/[0.08] transition-all group h-full flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="font-black text-white text-sm tracking-wide">{item.name}</p>
        <p className="text-neutral-500 text-xs">{item.handle}</p>
      </div>
      <Quote size={16} className="text-primary opacity-30 group-hover:opacity-80 transition-opacity mt-1 shrink-0" />
    </div>
    {item.rating && (
      <div className="flex gap-0.5 mb-3">
        {[...Array(item.rating)].map((_, i) => (
          <Star key={i} size={11} className="text-primary fill-primary" />
        ))}
      </div>
    )}
    <p className="text-neutral-300 text-sm leading-relaxed italic flex-grow">"{item.text}"</p>
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
      <span className="text-neutral-600 text-xs">{item.time}</span>
      <div className="flex items-center gap-1.5 text-neutral-500">
        <Heart size={12} />
        <span className="text-xs">{item.likes}</span>
      </div>
    </div>
  </div>
);

const DropCard: React.FC<{ item: FeedItem }> = ({ item }) => (
  <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.03] border border-white/10 p-6 rounded-3xl backdrop-blur-sm hover:border-primary/20 transition-all group h-full flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Flame size={14} className="text-white" />
        </div>
        <div>
          <p className="font-black text-white text-sm">{item.name}</p>
          <p className="text-neutral-500 text-xs">{item.handle}</p>
        </div>
      </div>
      {item.tag && (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tagStyles[item.tag] || 'bg-white/10 text-white/60 border-white/20'}`}>
          {item.tag}
        </span>
      )}
    </div>
    <p className="text-neutral-200 text-sm leading-relaxed flex-grow">{item.text}</p>
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
      <span className="text-neutral-600 text-xs">{item.time}</span>
      <div className="flex items-center gap-3 text-neutral-500">
        <div className="flex items-center gap-1">
          <Heart size={12} />
          <span className="text-xs">{item.likes}</span>
        </div>
        <MessageCircle size={12} />
      </div>
    </div>
  </div>
);

const MomentCard: React.FC<{ item: FeedItem }> = ({ item }) => (
  <div className="bg-white/[0.04] border border-white/10 p-6 rounded-3xl backdrop-blur-sm hover:bg-white/[0.07] transition-all group h-full flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="font-black text-white text-sm">{item.name}</p>
        <p className="text-neutral-500 text-xs">{item.handle}</p>
      </div>
      {item.tag && (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tagStyles[item.tag] || 'bg-white/10 text-white/60 border-white/20'}`}>
          {item.tag}
        </span>
      )}
    </div>
    <p className="text-neutral-300 text-sm leading-relaxed flex-grow">{item.text}</p>
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
      <span className="text-neutral-600 text-xs">{item.time}</span>
      <div className="flex items-center gap-1.5 text-neutral-500">
        <Heart size={12} />
        <span className="text-xs">{item.likes}</span>
      </div>
    </div>
  </div>
);

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden border-b border-white/5">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Live Community</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            The Pulse
          </h2>
          <p className="text-neutral-400 text-xl font-light italic">
            Drops, voices, and moments from Pakistan's indie fashion scene.
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5 max-w-7xl mx-auto">
          {feedItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="break-inside-avoid"
            >
              {item.type === 'voice' && <VoiceCard item={item} />}
              {item.type === 'drop' && <DropCard item={item} />}
              {item.type === 'moment' && <MomentCard item={item} />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
