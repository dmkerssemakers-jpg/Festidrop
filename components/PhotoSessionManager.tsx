'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraCapture from './CameraCapture';
import EmailDropCard from './EmailDropCard';

export default function PhotoSessionManager() {
  const [photos, setPhotos] = useState<string[]>([]);
  const isComplete = photos.length >= 10;

  return (
    <>
      <CameraCapture onComplete={setPhotos} />

      <AnimatePresence>
        {isComplete && (
          <motion.div
            key="email-card"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <EmailDropCard photos={photos} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
