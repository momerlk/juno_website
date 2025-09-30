import React from 'react';
import { Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  social: {
    linkedin?: string;
  };
}

const TeamMemberCard: React.FC<{ member: TeamMember; index: number }> = ({ member, index }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="relative group overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
    >
      <img 
        src={member.image} 
        alt={member.name} 
        className="w-full h-[480px] object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-in-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-2xl font-bold text-white">{member.name}</h3>
        <p className="text-primary font-semibold">{member.role}</p>
        <div className="h-0.5 bg-primary w-1/4 my-2"></div>
        <p className="text-neutral-300 text-sm mb-4">{member.bio}</p>
        
        {member.social.linkedin && (
          <a 
            href={member.social.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-white/10 p-2 rounded-full hover:bg-primary hover:text-white text-neutral-300 transition-all"
            aria-label={`${member.name}'s LinkedIn`}
          >
            <Linkedin size={20} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

const Team: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const teamMembers: TeamMember[] = [
    {
      name: "Omer Ali Malik",
      role: "Chief Executive Officer",
      image: "/team/omer.png",
      bio: "Product, Operations & Engineering",
      social: {
        linkedin: "https://linkedin.com/in/omer-malik-395a2a2a5",
      }
    },
    {
      name: "Ali Mukarram",
      role: "Chief Operating Officer",
      image: "/team/ali.png",
      bio: "Operations, Finance & Legal",
      social: {
        linkedin: "https://www.linkedin.com/in/ali-mukarram-257979209",
      }
    },
    {
      name: "Hooria Wasif",
      role: "Chief Growth Officer",
      image: "/team/hooria.jpg",
      bio: "Growth, Marketing & Brand Integrations",
      social: {
        linkedin: "https://www.linkedin.com/in/hooria-wasif-136637315",
      }
    },
  ];

  return (
    <section id="team" className="section bg-background">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Meet the <span className="gradient-text">Innovators</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            The passionate minds behind Juno's mission to revolutionize fashion discovery and commerce.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
