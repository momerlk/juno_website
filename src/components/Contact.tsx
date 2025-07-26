import React, { useState } from 'react';
import { Send, Mail, Instagram, Twitter, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Contact: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      
      // Reset submission status after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    }, 1500);
  };

  const socialLinks = [
    { icon: <Instagram size={24} />, url: 'https://instagram.com/junonow', label: 'Instagram' },
  ];

  return (
    <section id="contact" className="section">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Have questions about Juno or Juno Studio? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="card h-full">
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Mail className="text-primary mr-3" size={20} />
                  <span className="text-neutral-300">junonoww@gmail.com</span>
                </div>
                
                <h4 className="text-xl mb-4">Follow Us</h4>
                <div className="flex gap-4">
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      aria-label={link.label}
                      className="bg-background-light p-3 rounded-full hover:bg-primary/20 transition-colors duration-300"
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-xl mb-4">Download Juno App</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href=" https://testflight.apple.com/join/Pzt9wnBm" className="btn btn-outline flex-1 justify-center">
                    iOS
                  </a>
                  <a href=" https://expo.dev/artifacts/eas/obnKmUixtHAMDne8akt1iV.apk" className="btn btn-outline flex-1 justify-center">
                    Android
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="card">
              <h3 className="text-2xl font-semibold mb-6">Send a Message</h3>
              
              {isSubmitted ? (
                <div className="bg-success/20 border border-success/30 rounded-lg p-4 text-center">
                  <p className="text-success font-medium">Thanks for your message! We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-neutral-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-background-dark border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 focus:outline-none focus:border-primary transition-colors duration-300"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-neutral-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-background-dark border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 focus:outline-none focus:border-primary transition-colors duration-300"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-neutral-300 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-background-dark border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 focus:outline-none focus:border-primary transition-colors duration-300"
                      placeholder="Type your message here..."
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn btn-primary w-full flex items-center justify-center ${isSubmitting ? 'opacity-70' : ''}`}
                  >
                    {isSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={20} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;