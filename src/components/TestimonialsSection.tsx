import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const reviews = [
  { name: "Shanzeh khan", text: "thank god someone made an app that doesn’t make shopping monotonous and boring asl 😔🔥 this app is so fun to use and i couldn’t recommend it enough!!", role: "Power User", rating: 5 },
  { name: "Ibrahim", text: "A refreshing step forward for Pakistan’s fashion scene. The app is sleek, easy to use, and beautifully showcases outfits. It feels thoughtfully curated.", role: "Minimalist", rating: 5 },
  { name: "Amal", text: "Love discovering new Pakistani fashion brands on Juno! The swipe-to-shop feature is so much fun! Easy to use, trendy clothes, and supporting local designers.", role: "Fashion Enthusiast", rating: 5 },
  { name: "Muneeb", text: "The app is great, having access to the products of different brands at one place makes online shopping extremely easier and convenient. Discounts as high as 70%!", role: "Smart Shopper", rating: 5 },
  { name: "Jannat Imran", text: "Juno’s absolutely a banger! Definitely needs more kinds of clothing articles but it is doing so good already 💕 cannot wait to see Juno rise to the top!!", role: "Trendsetter", rating: 5 },
  { name: "Zainab Haroon", text: "In love with your swipe to shop feature! It makes finding new indie labels an actual experience.", role: "Digital Native", rating: 5 },
  { name: "Hooria", text: "Obviously obsessed with the collection and the interface. Finally something that understands my style.", role: "Early Adopter", rating: 5 },
  { name: "Muhammad", text: "It's quite a unique idea. The take a picture of your wardrobe idea is especially nice and helpful.", role: "Tech Enthusiast", rating: 5 },
  { name: "Mustafa Qureshi", text: "the entire 'tinder clothes' idea is great. I love how simple it makes discovery.", role: "UX Critique", rating: 4 },
  { name: "Rameen Rao", text: "Its a very creative idea. Overall unique app and very smooth experience.", role: "Creator", rating: 4 },
  { name: "Musa Aziz", text: "User friendly interface, tons of options to choose from. Amazing app in general in my opinion.", role: "Style Hunter", rating: 5 }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden border-b border-white/5">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary py-2 px-3">Wall</span>
          </h2>
          <p className="text-neutral-400 text-xl font-light italic">
            Real voices from the indie fashion revolution.
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-7xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="break-inside-avoid bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm hover:bg-white/[0.08] transition-all group"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-primary fill-primary" />
                ))}
              </div>
              
              <p className="text-neutral-200 text-base italic leading-relaxed mb-6 group-hover:text-white transition-colors">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div>
                  <p className="font-black text-white text-sm uppercase tracking-wider">{review.name}</p>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{review.role}</p>
                </div>
                <Quote size={20} className="text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
