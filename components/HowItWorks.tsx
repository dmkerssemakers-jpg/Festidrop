'use client';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Leg vast',
    desc: "Maak 10 polaroid-foto's met je eigen camera. Geen app, geen account — werkt direct in je browser.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="2" y="7" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="13" cy="15" r="4.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 7V5.5A1.5 1.5 0 0110.5 4h5A1.5 1.5 0 0117 5.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="19.5" cy="11.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Verzamel',
    desc: 'Elke foto wordt toegevoegd aan jouw persoonlijke FestiDrop — alles bij elkaar in één mooie set.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="5" y="9" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="8" y="4" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 16.5h6M10 19.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Ontvang',
    desc: 'Vul je e-mailadres in en ontvang je complete FestiDrop direct in je inbox. Klaar.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="20" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 9.5l10 6.5 10-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="hoe-het-werkt" className="px-5 pb-20 max-w-md mx-auto">
      <div className="text-center mb-9">
        <h2 className="text-[32px] font-black tracking-[-0.035em] text-navy leading-tight">
          Zo werkt het
        </h2>
        <p className="text-muted text-sm mt-1.5">Drie stappen. Dat is alles.</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass-card rounded-[24px] p-5 flex items-start gap-4"
          >
            <div
              className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(30,139,255,0.1), rgba(32,214,232,0.16))',
              }}
            >
              <span style={{ color: '#1E8BFF' }}>{step.icon}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gradient-drop block mb-0.5">
                Stap {step.num}
              </span>
              <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-navy">{step.title}</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
