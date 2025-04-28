import React from 'react';
import { motion } from 'framer-motion';

interface FormStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const FormStep: React.FC<FormStepProps> = ({ title, subtitle, children, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        {icon && (
          <div className="flex justify-center mb-4">
            {icon}
          </div>
        )}
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        {subtitle && (
          <p className="text-neutral-400">{subtitle}</p>
        )}
      </div>

      <div className="space-y-6">
        {children}
      </div>
    </motion.div>
  );
};

export default FormStep;