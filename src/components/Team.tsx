import React from 'react';
import { Github, Linkedin, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  social: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

const TeamMemberCard: React.FC<{ member: TeamMember; index: number }> = ({ member, index }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className="card card-hover group"
    >
      <div className="relative mb-6 mx-auto w-32 h-32 overflow-hidden rounded-full border-2 border-primary/30">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
        <p className="text-secondary mb-3">{member.role}</p>
        <p className="text-neutral-400 mb-4">{member.bio}</p>
        <div className="flex justify-center space-x-4">
          {member.social.linkedin && (
            <a 
              href={member.social.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-primary transition-colors duration-300"
            >
              <Linkedin size={20} />
            </a>
          )}
          {/* {member.social.twitter && (
            <a 
              href={member.social.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-accent transition-colors duration-300"
            >
              <Twitter size={20} />
            </a>
          )} */}
          {/* {member.social.github && (
            <a 
              href={member.social.github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-100 transition-colors duration-300"
            >
              <Github size={20} />
            </a>
          )} */}
        </div>
      </div>
    </motion.div>
  );
};

const Team: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const teamMembers: TeamMember[] = [
    {
      name: "Omer Ali Malik",
      role: "Founder & CEO",
      image: "https://cdn.pixabay.com/photo/2018/11/13/21/43/avatar-3814049_1280.png",
      bio: "Handling Product and Operations",
      social: {
        linkedin: "https://linkedin.com/in/omer-malik-395a2a2a5",
        twitter: "#",
      }
    },
    {
      name: "Amr Nazir",
      role: "COO",
      image: "https://cdn.pixabay.com/photo/2018/11/13/21/43/avatar-3814049_1280.png",
      bio: "Handling sales and business operations",
      social: {
        linkedin: "#",
        github: "#",
      }
    },
    {
      name: "Ali Mukarram",
      role: "CMO",
      image: "https://cdn.pixabay.com/photo/2018/11/13/21/43/avatar-3814049_1280.png",
      bio: "Handling marketing and sales",
      social: {
        linkedin: "#",
        twitter: "#",
      }
    },
    {
      name: "Shahzaib Abid",
      role: "Developer",
      image: "https://cdn.pixabay.com/photo/2018/11/13/21/43/avatar-3814049_1280.png",
      bio: "Handling Product",
      social: {
        linkedin: "#",
        twitter: "#",
      }
    },
  ];

  return (
    <section id="team" className="section">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            Meet Our <span className="gradient-text">Team</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            The passionate innovators behind Juno's mission to revolutionize fashion discovery and commerce.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;