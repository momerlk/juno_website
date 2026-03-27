import React from 'react';
import { Building, GraduationCap, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const partners = [
  { name: 'HBL', logo: '/dark_logos/hbl.png' },
  { name: 'ImpactX', logo: '/dark_logos/impactx.png' },
  { name: 'NetSol', logo: '/dark_logos/netsol.png' },
  { name: 'NIC', logo: '/dark_logos/nic.png' },
  { name: 'PMYP', logo: '/dark_logos/pmyp.png' },
];

const ImpactCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number }> = ({ icon, title, description, delay }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="group relative bg-white/5 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
    >
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="mb-8 p-6 rounded-3xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
          {icon}
        </div>
        <h3 className="text-6xl font-black text-white mb-6 tracking-tighter">{title}</h3>
        <p className="text-neutral-400 text-lg leading-relaxed font-light italic">{description}</p>
      </div>
    </motion.div>
  );
};

const JunoApp: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const impactStats = [
    {
      icon: <Building className="text-primary" size={32} />,
      title: '200+',
      description: 'Independent labels making something original — nothing mass-produced, nothing generic.',
      delay: 0.1,
    },
    {
      icon: <GraduationCap className="text-secondary" size={32} />,
      title: '35+',
      description: 'Campus communities across Pakistan shaping what indie fashion becomes next.',
      delay: 0.2,
    },
    {
      icon: <MapPin className="text-primary" size={32} />,
      title: '4 Cities',
      description: 'Karachi, Lahore, Islamabad, Faisalabad — 1-hour delivery from indie to your door.',
      delay: 0.3,
    },
  ];

  return (
    <section id="juno-app" className="py-32 bg-black relative border-b border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-black to-black opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-32">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">
              The Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary py-2 px-3">is Growing</span>
            </h2>
            <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto leading-relaxed font-light italic">
              Thousands of people choosing indie over generic. Join them.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {impactStats.map((stat, index) => (
              <ImpactCard key={index} {...stat} />
            ))}
          </div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-20"
          >
            <h3 className="text-xl md:text-2xl font-black text-white/40 uppercase tracking-[0.3em]">
              Ecosystem Partners
            </h3>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 max-w-6xl mx-auto px-4">
            {partners.map((partner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 0.6, scale: 1 } : {}}
                whileHover={{ opacity: 1, scale: 1.1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="group h-12 md:h-16 flex items-center grayscale hover:grayscale-0 transition-all duration-500"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-full w-auto object-contain"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JunoApp;
