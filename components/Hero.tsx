'use client';

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 6l1.5 1.5L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function scrollToCamera() {
  document.getElementById('camera')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Hero() {
  return (
    <section className="pt-36 pb-10 px-5 text-center max-w-md mx-auto">
      <div className="animate-fade-up">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(189,239,255,0.8)] bg-white/60 backdrop-blur-sm mb-8 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-capture animate-red-ping" />
          Festival photo experience
        </div>

        {/* Headline */}
        <h1 className="text-[46px] sm:text-[68px] font-black leading-[0.95] tracking-[-0.04em] text-navy mb-5">
          Vang de sfeer.<br />
          <span className="text-gradient-drop">Deel de&nbsp;herinnering.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-[17px] text-muted leading-[1.6] mb-9 max-w-xs mx-auto">
          Maak 10&nbsp;polaroid-foto's van jouw festivalmomenten en ontvang ze direct in je mailbox.
        </p>

        {/* CTA — scrollt naar de camera */}
        <button onClick={scrollToCamera} className="btn-primary px-8 py-4 text-[15px] mb-5">
          Start met vastleggen
        </button>

        {/* Trust microcopy */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[12px] font-semibold text-muted">
          {['Geen app nodig', 'Veilig & privé', 'Direct in je inbox'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckIcon />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
