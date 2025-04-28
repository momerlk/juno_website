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
      icon: <Target size={24} className="text-primary" />,
      title: "Our Mission",
      description: "To create a seamless connection between fashion brands and consumers through innovative technology."
    },
    {
      icon: <Users size={24} className="text-secondary" />,
      title: "The Problem",
      description: "Traditional fashion discovery is fragmented and inefficient, making it difficult for consumers to find brands that match their style."
    },
    {
      icon: <Smartphone size={24} className="text-accent" />,
      title: "Our Solution",
      description: "A mobile-first platform that makes discovering and shopping for fashion as simple and enjoyable as swiping through content."
    },
    {
      icon: <Sparkles size={24} className="text-success" />,
      title: "Our Vision",
      description: "To become the go-to platform for fashion discovery and shopping, connecting millions of consumers with their perfect style matches."
    }
  ];

  return (
    <section id="mission" className="section bg-background-light relative overflow-hidden">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            Our <span className="gradient-text">Mission</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Revolutionizing how people discover and shop for fashion
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {missionItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="card"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-background via-background-light to-background p-3 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-neutral-400">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="max-w-2xl">
            <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
              <p className="text-lg text-center italic text-neutral-300">
                "At Juno, we believe fashion discovery should be as fun and intuitive as scrolling through your favorite social media feed. Our technology brings brands and consumers together in a way that's never been done before."
              </p>
              <p className="text-center mt-4 text-neutral-400">- Alex Chen, Founder & CEO</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background gradient */}
      <div className="absolute -bottom-40 left-0 right-0 h-80 bg-gradient-conic from-primary/10 via-secondary/5 to-accent/10 blur-3xl opacity-30"></div>
    </section>
  );
};

export default Mission;