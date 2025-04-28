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
          {member.social.twitter && (
            <a 
              href={member.social.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-accent transition-colors duration-300"
            >
              <Twitter size={20} />
            </a>
          )}
          {member.social.github && (
            <a 
              href={member.social.github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-100 transition-colors duration-300"
            >
              <Github size={20} />
            </a>
          )}
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
      name: "Alex Chen",
      role: "Founder & CEO",
      image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      bio: "Fashion industry veteran with a passion for technology and innovation.",
      social: {
        linkedin: "#",
        twitter: "#",
      }
    },
    {
      name: "Sophia Johnson",
      role: "CTO",
      image: "https://images.pexels.com/photos/3775087/pexels-photo-3775087.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      bio: "Tech visionary with experience building consumer mobile applications.",
      social: {
        linkedin: "#",
        github: "#",
      }
    },
    {
      name: "Marcus Williams",
      role: "Creative Director",
      image: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      bio: "Designer with a background in fashion and digital product design.",
      social: {
        linkedin: "#",
        twitter: "#",
      }
    },
    {
      name: "Olivia Garcia",
      role: "Head of Partnerships",
      image: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      bio: "Building relationships between brands and the Juno platform.",
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