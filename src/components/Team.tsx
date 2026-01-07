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
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-[2rem] bg-neutral-900 border border-white/5"
    >
      <div className="aspect-[3/4] w-full overflow-hidden">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      </div>
      
      {/* Glass Overlay Content */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-3xl font-bold text-white mb-1">{member.name}</h3>
        <p className="text-primary font-semibold text-lg mb-4">{member.role}</p>
        
        <div className="h-px w-12 bg-white/20 mb-4" />
        
        <p className="text-neutral-300 text-base mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
          {member.bio}
        </p>
        
        {member.social.linkedin && (
          <a 
            href={member.social.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-all duration-300"
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
    <section id="team" className="py-32 bg-black relative">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Innovators</span>
          </h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            The passionate minds behind Juno's mission to revolutionize fashion discovery and commerce.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;