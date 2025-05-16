import React from 'react';
import { Target, Users, Smartphone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface MissionItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Mission: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const missionItems: MissionItem[] = [
    {
      icon: <Target size={48} className="text-primary" />,
      title: "Our Mission",
      description: "To create a seamless connection between fashion brands and consumers through innovative technology."
    },
    {
      icon: <Users size={48} className="text-secondary" />,
      title: "The Problem",
      description: "Traditional fashion discovery is fragmented and inefficient, making it difficult for consumers to find brands that match their style."
    },
    {
      icon: <Smartphone size={48} className="text-accent" />,
      title: "Our Solution",
      description: "A mobile-first platform that makes discovering and shopping for fashion as simple and enjoyable as swiping through content."
    },
    {
      icon: <Sparkles size={48} className="text-success" />,
      title: "Our Vision",
      description: "To become the go-to platform for fashion discovery and shopping, connecting millions of consumers with their perfect style matches."
    }
  ];

  return (
    <section id="mission" className="min-h-screen bg-background-light relative overflow-hidden py-20">
      <div className="max-w-[90%] mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl lg:text-7xl font-bold mb-8">
            Our <span className="gradient-text">Mission</span>
          </h2>
          <p className="text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto">
            Revolutionizing how people discover and shop for fashion
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {missionItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 * index }}
              className="bg-gradient-to-br from-background/50 to-background-light/30 backdrop-blur-xl rounded-3xl p-12 hover:shadow-2xl transition-all duration-500 group"
            >
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-background via-background-light to-background p-6 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-500">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-3xl lg:text-4xl font-bold mb-4 group-hover:text-primary transition-colors duration-500">{item.title}</h3>
                  <p className="text-xl text-neutral-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-24"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-xl rounded-3xl p-12">
              <p className="text-2xl text-center italic text-neutral-300 leading-relaxed">
                "At Juno, we believe fashion discovery should be as fun and intuitive as scrolling through your favorite social media feed. Our technology brings brands and consumers together in a way that's never been done before."
              </p>
              <p className="text-center mt-6 text-xl text-neutral-400">- Omer Malik, Founder</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background gradient */}
      <div className="absolute -bottom-40 left-0 right-0 h-96 bg-gradient-conic from-primary/20 via-secondary/10 to-accent/20 blur-3xl opacity-40"></div>
    </section>
  );
};

export default Mission;