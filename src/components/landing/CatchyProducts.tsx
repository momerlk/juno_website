import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ShoppingBag, ArrowRight, ArrowLeft, Sparkles, Zap, Flame, Crown } from 'lucide-react';

const products = [
  {
    vibe: "The Street Edit",
    brand: "Ukiyo",
    title: "Tensai Jersey",
    price: "2,499",
    image: "https://cdn.shopify.com/s/files/1/0567/2458/6614/files/WhatsApp_Image_2025-10-28_at_22.51.06_07b8590f.jpg?v=1761674146",
    tag: "Bird-eye Mesh",
    story: "Ukiyo built this for Karachi summers. The bird-eye mesh breathes — made for the streets, not a studio.",
    color: "from-blue-500/20 to-cyan-500/20",
    icon: <Zap size={14} />
  },
  {
    vibe: "The Studio Edit",
    brand: "Kara",
    title: "Teal Coord",
    price: "6,600",
    image: "https://cdn.shopify.com/s/files/1/0898/0778/2200/files/DSC09685.jpg?v=1762697592",
    tag: "Marine Fabric",
    story: "Kara's take on the coord: clean lines, marine-weight fabric. Dressed-up or dressed-down — it decides.",
    color: "from-emerald-500/20 to-teal-500/20",
    icon: <Crown size={14} />
  },
  {
    vibe: "The Street Edit",
    brand: "Ukiyo",
    title: "Toki Jersey",
    price: "2,499",
    image: "https://cdn.shopify.com/s/files/1/0567/2458/6614/files/WhatsApp_Image_2025-10-28_at_22.51.06_eae36b49.jpg?v=1761674113",
    tag: "Oversized Fit",
    story: "Oversized by design, not by accident. Ukiyo cut this deliberately wider — the slouch is the point.",
    color: "from-purple-500/20 to-pink-500/20",
    icon: <Zap size={14} />
  },
  {
    vibe: "The Craft Edit",
    brand: "NOIRE",
    title: "Hand Knitted Sweater",
    price: "5,999",
    image: "https://cdn.shopify.com/s/files/1/0759/8266/8026/files/25.jpg?v=1765052254",
    tag: "Artisanal Knit",
    story: "Six days. Two hands. Twenty made. NOIRE doesn't do mass production — this is what craft looks like.",
    color: "from-orange-500/20 to-amber-500/20",
    icon: <Flame size={14} />
  },
  {
    vibe: "The Active Edit",
    brand: "Grabbers",
    title: "GBR Street Racer Set",
    price: "7,999",
    image: "https://cdn.shopify.com/s/files/1/0945/2516/1755/files/rn-image_picker_lib_temp_c6331ea0-33e1-495e-bde7-2574bef3c11f.jpg?v=1765093426",
    tag: "Limited Run",
    story: "Grabbers made 40 of these. When they're gone, they're gone. Built for movement, designed for notice.",
    color: "from-red-500/20 to-orange-500/20",
    icon: <Zap size={14} />
  },
  {
    vibe: "The Studio Edit",
    brand: "Kara",
    title: "Deep Olive",
    price: "7,100",
    image: "https://cdn.shopify.com/s/files/1/0898/0778/2200/files/DSC09135.jpg?v=1762687765",
    tag: "Minimalist",
    story: "Kara sourced this olive fabric for three months. The result is a piece that earns its price in silence.",
    color: "from-green-500/20 to-lime-500/20",
    icon: <Crown size={14} />
  },
  {
    vibe: "The Street Edit",
    brand: "Ukiyo",
    title: "Kazan Tee",
    price: "1,999",
    image: "https://cdn.shopify.com/s/files/1/0567/2458/6614/files/kazan_front.jpg?v=1754329344",
    tag: "240 GSM Cotton",
    story: "240 GSM so it sits right. Ukiyo uses the same weight across every basic — consistency is the craft.",
    color: "from-yellow-500/20 to-orange-500/20",
    icon: <Zap size={14} />
  },
  {
    vibe: "The Craft Edit",
    brand: "NOIRE",
    title: "Rust Red Ribbed Polo",
    price: "2,699",
    image: "https://cdn.shopify.com/s/files/1/0759/8266/8026/files/DROP_NEDDEL_RED_6.jpg?v=1754046385",
    tag: "Old Money Poise",
    story: "NOIRE calls this their 'old money' silhouette. Ribbed polo, rust red — understated on purpose.",
    color: "from-red-900/20 to-red-600/20",
    icon: <Crown size={14} />
  },
  {
    vibe: "The Active Edit",
    brand: "Grabbers",
    title: "Blast Jeans",
    price: "2,599",
    image: "https://cdn.shopify.com/s/files/1/0945/2516/1755/files/rn-image_picker_lib_temp_cb8dc639-1f50-4e62-bada-034a0d2ed823.jpg?v=1767681724",
    tag: "Distressed Denim",
    story: "Grabbers distressed these in-house, not factory-done. Each pair is a little different — that's the point.",
    color: "from-indigo-500/20 to-blue-500/20",
    icon: <Zap size={14} />
  },
  {
    vibe: "The Street Edit",
    brand: "Ukiyo",
    title: "Jet Black Zipper",
    price: "3,699",
    image: "https://cdn.shopify.com/s/files/1/0567/2458/6614/files/WhatsAppImage2025-12-31at2.23.47AM.jpg?v=1767129893",
    tag: "Heavy Fleece",
    story: "Heavy fleece for Lahore winters. The zipper runs clean — Ukiyo refuses to compromise on hardware.",
    color: "from-zinc-500/20 to-black/20",
    icon: <Zap size={14} />
  },
  {
    vibe: "The Active Edit",
    brand: "Grabbers",
    title: "Bomber Jacket",
    price: "2,199",
    image: "https://cdn.shopify.com/s/files/1/0945/2516/1755/files/2148a2e7-a425-40ee-a784-56813358cc60.jpg?v=1760179842",
    tag: "Versatile Layer",
    story: "Grabbers designed this bomber to go everywhere. Campus to city, day to night — it adapts with you.",
    color: "from-slate-500/20 to-zinc-500/20",
    icon: <Zap size={14} />
  },
  {
    vibe: "The Street Edit",
    brand: "Ukiyo",
    title: "Mizukage Tee",
    price: "3,899",
    image: "https://cdn.shopify.com/s/files/1/0567/2458/6614/files/EE9ADBCA-CF0B-4DA3-A984-DA939899A997.jpg?v=1746110572",
    tag: "3D Logo Print",
    story: "The 3D logo is raised, not printed flat. Ukiyo spent two weeks getting the texture right — you'll feel it.",
    color: "from-blue-900/20 to-blue-400/20",
    icon: <Zap size={14} />
  }
];

const CatchyProducts: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section id="catchy-products" className="py-24 bg-black relative overflow-hidden border-b border-white/5">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px] -z-10 animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <Sparkles className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm font-bold text-neutral-300 tracking-wider uppercase">The Catchy Edit</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-2 px-3">Drop Board</span>
            </h2>
            <p className="text-xl text-neutral-400 font-light italic max-w-2xl leading-relaxed">
              What the community is wearing — and the story behind why.
            </p>
          </motion.div>

          <div className="flex gap-4">
            <button
              onClick={() => scroll('left')}
              className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="min-w-[300px] md:min-w-[350px] snap-start"
            >
              <div className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${product.color} rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-sm hover:border-white/20 transition-all duration-500 flex flex-col h-full group-hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                        {product.icon}
                        {product.vibe}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <ShoppingBag size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="mb-3">
                      <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-1">{product.brand}</p>
                      <h3 className="text-2xl font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-1">{product.title}</h3>
                    </div>

                    <p className="text-neutral-500 text-xs leading-relaxed mb-4 italic">{product.story}</p>

                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-1 rounded-full bg-neutral-600" />
                      <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">{product.tag}</p>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase font-black tracking-[0.2em] mb-0.5">From</p>
                        <p className="text-xl font-black text-white">Rs. {product.price}</p>
                      </div>
                      <button className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider group/btn">
                        Discover
                        <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <a
            href="/download"
            className="inline-flex items-center px-12 py-6 rounded-full bg-white text-black font-black text-xl hover:bg-neutral-200 hover:scale-105 transition-all shadow-2xl shadow-white/10 group"
          >
            Join the Community
            <ArrowRight size={24} className="ml-2 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default CatchyProducts;
