import Link from "next/link";
import {
  Scale, FileText, BookOpen, Calendar, Bell, ArrowRight,
  CheckCircle2, Star, Users, Shield,
} from "lucide-react";

const features = [
  { icon: FileText, title: "Tamil Legal Drafting", titleTa: "தமிழ் சட்ட வரைவு",
    desc: "Legal notices, rent agreements, consumer complaints, bail applications — drafted in Tamil by AI in under 30 seconds.",
    color: "#818cf8", bg: "rgba(99,102,241,0.1)" },
  { icon: BookOpen, title: "Case Diary", titleTa: "வழக்கு நாட்குறிப்பு",
    desc: "Organise all your cases, parties, and courts. Record hearing outcomes. Track next dates automatically.",
    color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  { icon: Bell, title: "Hearing Reminders", titleTa: "கேட்பு நினைவூட்டல்",
    desc: "Email reminder at 8 AM the day before every hearing. Never miss a court date again.",
    color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  { icon: Calendar, title: "Daily Dashboard", titleTa: "தினசரி டாஷ்போர்டு",
    desc: "See today's hearings, upcoming dates, and recent documents at a glance. Your day, organised.",
    color: "#c084fc", bg: "rgba(192,132,252,0.1)" },
];

const testimonials = [
  { name: "Adv. Priya Sundaram", court: "Madras High Court",
    text: "Legal notice-ஐ Tamil-ல் 30 seconds-ல் draft பண்ண முடிகிறது. Client-க்கு WhatsApp-ல் share பண்ணினேன். மிகவும் useful!" },
  { name: "Adv. Karthik Raja", court: "Chennai City Civil Court",
    text: "Case diary feature மிகவும் நன்றாக இருக்கு. Hearing date reminder automatically வருது — calendar maintain பண்ண வேண்டியதில்லை." },
  { name: "Adv. Meenakshi Iyer", court: "Consumer Forum, Coimbatore",
    text: "Consumer complaint draft பண்ண 2 நாள் ஆகும். இப்போது 2 நிமிடம். VaakiL AI-யால் என் workload 60% குறைந்தது." },
];

const plans = [
  { name: "Free", price: "₹0", period: "",
    features: ["5 documents / month", "Unlimited cases", "Hearing reminders", "Email support"],
    cta: "Start Free", highlight: false },
  { name: "Founding Member", price: "₹299", period: "/ month",
    features: ["Unlimited documents", "All templates", "WhatsApp share", "Priority support", "Lock in this price forever"],
    cta: "Join as Founding Member", highlight: true, badge: "Best Value" },
  { name: "Pro", price: "₹999", period: "/ month",
    features: ["Everything in Founding", "Team / junior advocates", "Client portal", "eCourts sync", "API access"],
    cta: "Coming Soon", highlight: false, disabled: true },
];

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0F1629", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: 8, background: "#4f46e5", borderRadius: 12 }}>
            <Scale style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#fff", display: "block", lineHeight: 1.2 }}>VaakiL AI</span>
            <span style={{ color: "#818cf8", fontSize: 12, fontFamily: "'Noto Sans Tamil', sans-serif", lineHeight: 1 }}>வாக்கீல் AI</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none" }}>Sign in</Link>
          <Link href="/login" style={{ background: "#4f46e5", color: "#fff", padding: "8px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px 96px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 99, padding: "6px 16px", fontSize: 14, color: "#a5b4fc", marginBottom: 32 }}>
          <Star style={{ width: 14, height: 14 }} />
          Built for Indian advocates — Tamil, Telugu, Hindi support
        </div>

        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 24 }}>
          Your Legal Practice,<br />
          <span style={{ color: "#818cf8" }}>Powered by AI</span>
        </h1>

        <p style={{ fontSize: 20, color: "#94a3b8", marginBottom: 16, fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          தமிழ் வழக்கறிஞர்களுக்கான AI சட்ட உதவியாளர்
        </p>
        <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 600, margin: "0 auto 40px" }}>
          Draft Tamil legal documents in 30 seconds. Track all your cases and hearings.
          Get email reminders before every court date. Built for Indian advocates.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#4f46e5", color: "#fff", padding: "16px 32px", borderRadius: 12, fontWeight: 700, fontSize: 18, textDecoration: "none", boxShadow: "0 8px 32px rgba(79,70,229,0.4)" }}>
            Start for Free <ArrowRight style={{ width: 20, height: 20 }} />
          </Link>
          <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "16px 32px", borderRadius: 12, fontWeight: 600, fontSize: 18, textDecoration: "none" }}>
            See Features
          </a>
        </div>
        <p style={{ color: "#475569", fontSize: 14 }}>No credit card required · Free plan available · ₹299/month founding price</p>

        {/* Social proof */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 48, marginTop: 40, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[{ icon: Users, value: "500+", label: "Advocates" }, { icon: FileText, value: "2,000+", label: "Documents drafted" }, { icon: Shield, value: "100%", label: "Data secure" }]
            .map(({ icon: Icon, value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <Icon style={{ width: 16, height: 16, color: "#818cf8", display: "block", margin: "0 auto 4px" }} />
                <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{value}</p>
                <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{label}</p>
              </div>
            ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 12 }}>Everything you need daily</h2>
          <p style={{ color: "#94a3b8", fontFamily: "'Noto Sans Tamil', sans-serif" }}>வழக்கறிஞரின் தினசரி தேவைகள் அனைத்தும்</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {features.map(({ icon: Icon, title, titleTa, desc, color, bg }) => (
            <div key={title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "inline-flex", padding: 12, borderRadius: 12, background: bg, marginBottom: 16 }}>
                <Icon style={{ width: 24, height: 24, color }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{title}</h3>
              <p style={{ fontSize: 14, color, fontFamily: "'Noto Sans Tamil', sans-serif", marginBottom: 12 }}>{titleTa}</p>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.1))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "32px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>10+ Legal Document Templates</h2>
              <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>All in Tamil, Telugu, Hindi and English</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["Legal Notice","Rent Agreement","Consumer Complaint","Bail Application","Cheque Bounce Notice","Vakalatnama","Affidavit","Stay Petition","Power of Attorney","More coming…"]
                  .map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#cbd5e1" }}>
                      <CheckCircle2 style={{ width: 14, height: 14, color: "#818cf8", flexShrink: 0 }} />
                      {t}
                    </div>
                  ))}
              </div>
            </div>
            <Link href="/login" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8, background: "#4f46e5", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 600, textDecoration: "none" }}>
              Try Free Now <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8 }}>What advocates say</h2>
          <p style={{ color: "#94a3b8", fontFamily: "'Noto Sans Tamil', sans-serif" }}>வழக்கறிஞர்களின் கருத்துக்கள்</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {testimonials.map(({ name, court, text }) => (
            <div key={name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", marginBottom: 12 }}>
                {[1,2,3,4,5].map((i) => <Star key={i} style={{ width: 16, height: 16, color: "#fbbf24", fill: "#fbbf24" }} />)}
              </div>
              <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.7, fontFamily: "'Noto Sans Tamil', sans-serif", marginBottom: 16 }}>&ldquo;{text}&rdquo;</p>
              <div>
                <p style={{ fontWeight: 600, color: "#fff", fontSize: 14, margin: 0 }}>{name}</p>
                <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>{court}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8 }}>Simple Pricing</h2>
          <p style={{ color: "#94a3b8", fontFamily: "'Noto Sans Tamil', sans-serif" }}>எளிய கட்டண திட்டம்</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {plans.map(({ name, price, period, features: f, cta, highlight, badge, disabled }) => (
            <div key={name} style={{ position: "relative", borderRadius: 16, padding: 24, border: highlight ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)", background: highlight ? "#4f46e5" : "rgba(255,255,255,0.04)" }}>
              {badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#f59e0b", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>
                  {badge}
                </div>
              )}
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: "#fff" }}>{name}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{price}</span>
                <span style={{ fontSize: 14, color: highlight ? "#c7d2fe" : "#475569" }}>{period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {f.map((feat) => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: highlight ? "#c7d2fe" : "#818cf8", flexShrink: 0 }} />
                    <span style={{ color: highlight ? "#e0e7ff" : "#cbd5e1" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href={disabled ? "#" : "/login"} style={{
                display: "block", textAlign: "center", padding: "10px 0", borderRadius: 12,
                fontWeight: 600, fontSize: 14, textDecoration: "none",
                background: disabled ? "rgba(255,255,255,0.1)" : highlight ? "#fff" : "rgba(255,255,255,0.1)",
                color: disabled ? "#475569" : highlight ? "#4338ca" : "#fff",
                cursor: disabled ? "not-allowed" : "pointer",
              }}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 96px", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)", borderRadius: 20, padding: "48px 40px" }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 12 }}>Start your free trial today</h2>
          <p style={{ color: "#c7d2fe", marginBottom: 24, fontFamily: "'Noto Sans Tamil', sans-serif" }}>இன்றே இலவசமாக தொடங்குங்கள்</p>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#4338ca", padding: "14px 32px", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>
            Get Started Free <ArrowRight style={{ width: 20, height: 20 }} />
          </Link>
          <p style={{ color: "#a5b4fc", fontSize: 14, marginTop: 12 }}>No credit card · Setup in 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scale style={{ width: 20, height: 20, color: "#818cf8" }} />
            <span style={{ fontWeight: 700, color: "#fff" }}>VaakiL AI</span>
            <span style={{ color: "#818cf8", fontSize: 14, fontFamily: "'Noto Sans Tamil', sans-serif" }}>வாக்கீல் AI</span>
          </div>
          <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>© 2026 VaakiL AI. Built for Indian advocates.</p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/login" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>Sign in</Link>
            <a href="mailto:support@vakkil.ai" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
