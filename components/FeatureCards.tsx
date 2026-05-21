'use client';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Geen app nodig',
    desc: "Werkt direct in je browser. Open, maak foto's, ontvang.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
        <path d="M9 6h6M9 9h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Veilig & privé',
    desc: "Je foto's blijven van jou. Je e-mail gebruiken we alleen voor je drop.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Direct in je inbox',
    desc: 'Na je e-mailadres invullen ontvang je de set direct.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 9l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function FeatureCards() {
  return (
    <section className="px-5 pb-20 max-w-md mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.09 }}
            className="glass-card rounded-[22px] p-5 text-center"
          >
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(30,139,255,0.1), rgba(32,214,232,0.16))',
              }}
            >
              <span style={{ color: '#1E8BFF' }}>{f.icon}</span>
            </div>
            <h3 className="text-sm font-extrabold text-navy mb-1.5">{f.title}</h3>
            <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
