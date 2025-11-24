import React from 'react';
import { motion } from 'framer-motion';

interface NavigationLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
}

const NavigationLoader: React.FC<NavigationLoaderProps> = ({ 
  isLoading, 
  children 
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear"
          }}
        />
        <p className="mt-4 text-gray-600">Loading...</p>
      </motion.div>
    </div>
  );
};

export default NavigationLoader;