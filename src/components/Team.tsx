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
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 * index }}
      className="card card-hover group text-center p-6"
    >
      <div className="relative mb-6">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-neutral-800 group-hover:border-primary transition-all duration-300"
        />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
        <p className="text-primary font-semibold mb-3">{member.role}</p>
        <p className="text-neutral-400 mb-5 text-sm">{member.bio}</p>
        <div className="flex justify-center">
          {member.social.linkedin && (
            <a 
              href={member.social.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-primary transition-colors duration-300"
              aria-label={`${member.name}'s LinkedIn`}
            >
              <Linkedin size={24} />
            </a>
          )}
        </div>
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
      image: "/team/omer.jpg",
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
    {
      name: "Asmar Shahid",
      role: "Chief Technology Officer",
      image: "https://media.licdn.com/dms/image/D4D03AQH-pL8y3CgZpA/profile-displayphoto-shrink_400_400/0/1716830199593?e=1728518400&v=beta&t=5j_aV-pGf1Z-jY8b8qG8c8Z8Y8J8j8H8j8Y8J8j8Y8",
      bio: "Backend Engineering & Systems",
      social: {
        linkedin: "https://www.linkedin.com/in/asmar-shahid",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
