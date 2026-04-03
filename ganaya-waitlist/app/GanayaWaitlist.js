'use client'
import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const track = (event, props = {}) => {
  if (typeof window !== "undefined" && window.posthog) window.posthog.capture(event, props);
  if (typeof window !== "undefined" && window.fbq) {
    if (event === "waitlist_completed") window.fbq("track", "Lead");
    else window.fbq("trackCustom", event, props);
  }
};

const saveSignup = async ({ email, phone, answers, referredBy, referralCode }) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      answers,
      referred_by: referredBy || null,
      referral_code: referralCode,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "error");
  }
  return res.json();
};

const getCount = async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist?select=id`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "count=exact" },
  });
  return parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10);
};

const QUESTIONS = [
  { id:"age", emoji:"🎂", title:"¿Qué edad tenés?", sub:"Así te mostramos las misiones que más te sirven", type:"single",
    opts:[{v:"18-24",l:"18–24",e:"🎓"},{v:"25-30",l:"25–30",e:"💼"},{v:"31-40",l:"31–40",e:"🏠"},{v:"41+",l:"41+",e:"⭐"}] },
  { id:"gender", emoji:"🙋", title:"¿Cómo te identificás?", sub:"Nos ayuda a personalizar las misiones para vos", type:"single",
    opts:[{v:"hombre",l:"Hombre",e:"👨"},{v:"mujer",l:"Mujer",e:"👩"},{v:"otro",l:"Otro",e:"🧑"},{v:"nodecir",l:"Prefiero no decir",e:"🤐"}] },
  { id:"city", emoji:"📍", title:"¿De dónde sos?", sub:"Algunas misiones son específicas de tu zona", type:"single",
    opts:[{v:"CABA",l:"CABA",e:"🏙️"},{v:"GBA",l:"Gran Buenos Aires",e:"🌆"},{v:"Córdoba",l:"Córdoba",e:"🏔️"},{v:"Rosario",l:"Rosario",e:"🌊"},{v:"Mendoza",l:"Mendoza",e:"🍷"},{v:"Otro",l:"Otra ciudad",e:"📌"}] },
  { id:"rewards", emoji:"🎁", title:"¿Qué premios te interesan?", sub:"Elegí todos los que quieras", type:"multi",
    opts:[{v:"ml",l:"MercadoLibre",e:"🛍️"},{v:"rappi",l:"Rappi",e:"🛵"},{v:"recarga",l:"Recarga celular",e:"📱"},{v:"spotify",l:"Spotify",e:"🎵"},{v:"steam",l:"Steam / Gaming",e:"🎮"},{v:"cash",l:"Plata (MercadoPago)",e:"💰"}] },
  { id:"tasks", emoji:"🎯", title:"¿Qué misiones preferís?", sub:"Elegí todas las que te interesen", type:"multi",
    opts:[{v:"surveys",l:"Encuestas",e:"📝",d:"Respondé preguntas y ganá"},{v:"apps",l:"Probar apps",e:"📲",d:"Descargá y probá apps"},{v:"videos",l:"Mirar videos",e:"▶️",d:"Videos cortos y ganá"},{v:"services",l:"Probar servicios",e:"🆕",d:"Registrate en servicios"},{v:"games",l:"Jugar juegos",e:"🕹️",d:"Jugá y ganá"},{v:"refs",l:"Invitar amigos",e:"👥",d:"Ganá por cada referido"}] },
  { id:"apps_used", emoji:"📱", title:"¿Qué apps usás hoy?", sub:"Nos ayuda a conseguirte mejores ofertas", type:"multi",
    opts:[{v:"mp",l:"MercadoPago",e:"💳"},{v:"uala",l:"Ualá",e:"💜"},{v:"brubank",l:"Brubank",e:"🟣"},{v:"rappi",l:"Rappi",e:"🧡"},{v:"pedidosya",l:"PedidosYa",e:"🔴"},{v:"lemon",l:"Lemon Cash",e:"🍋"},{v:"personal",l:"Mi Personal",e:"📶",d:"App de Personal Flow"},{v:"claro",l:"Mi Claro",e:"📡",d:"App de Claro Argentina"}] },
];

const genCode = () => "GY" + Math.random().toString(36).substring(2, 8).toUpperCase();

export default function GanayaWaitlist() {
  const [screen, setScreen] = useState("hero");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [refCode, setRefCode] = useState("");
  const [position, setPosition] = useState(null);
  const [totalSignups, setTotalSignups] = useState(0);
  const [referredBy, setReferredBy] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animDir, setAnimDir] = useState("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setReferredBy(ref);
    getCount().then(n => { if (n > 0) setTotalSignups(n); }).catch(() => {});

    // Meta Pixel
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (pixelId && typeof window !== "undefined" && !window.fbq) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }

    track("page_view");
  }, []);

  const selectOption = (qid, val, type) => {
    setAnswers(prev => {
      if (type === "single") return { ...prev, [qid]: val };
      const cur = prev[qid] || [];
      return { ...prev, [qid]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
    });
  };

  const isSelected = (qid, val) => {
    const a = answers[qid];
    return Array.isArray(a) ? a.includes(val) : a === val;
  };

  const canProceed = () => {
    const q = QUESTIONS[step];
    const a = answers[q.id];
    return q.type === "single" ? !!a : Array.isArray(a) && a.length > 0;
  };

  const navigate = useCallback((dir) => {
    setAnimDir(dir);
    setIsAnimating(true);
    setTimeout(() => {
      if (dir === "forward") {
        if (step < QUESTIONS.length - 1) setStep(s => s + 1);
        else setScreen("signup");
      } else {
        if (step > 0) setStep(s => s - 1);
        else setScreen("hero");
      }
      setIsAnimating(false);
    }, 220);
  }, [step]);

  const nextStep = () => {
    if (!canProceed()) return;
    track("funnel_step", { step: step + 1, q: QUESTIONS[step].id });
    navigate("forward");
  };

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const code = genCode();
    try {
      await saveSignup({ email, phone, answers, referredBy, referralCode: code });
      const count = await getCount();
      setTotalSignups(count);
      setPosition(count);
      setRefCode(code);
      setScreen("done");
      track("waitlist_completed");
    } catch (err) {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        setError("Este email ya está registrado. ¡Ya estás en la lista! 🎉");
      } else {
        setError("Algo salió mal. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const progress = screen === "signup" ? 100 : ((step + (canProceed() ? 0.5 : 0)) / QUESTIONS.length) * 100;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?ref=${refCode}` : `https://ganaya.app/?ref=${refCode}`;

  const copyLink = () => { navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); track("referral_copied"); };
  const shareWA = () => { window.open(`https://wa.me/?text=${encodeURIComponent(`🎁 Che, encontré GanáYa — completás misiones y ganás gift cards de MeLi y Rappi. Sumate: ${shareUrl}`)}`,"_blank"); track("referral_whatsapp"); };

  return (
    <div style={{ minHeight:"100vh", background:"#060b14", color:"#f0f0f0", fontFamily:"'Sora','DM Sans',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(0,230,118,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,230,118,0.03) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%);-webkit-mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)}
        .orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(80px)}
        .orb1{width:500px;height:500px;background:radial-gradient(circle,rgba(0,230,118,0.08) 0%,transparent 70%);top:-100px;right:-100px;animation:o1 12s ease-in-out infinite}
        .orb2{width:400px;height:400px;background:radial-gradient(circle,rgba(64,120,255,0.06) 0%,transparent 70%);bottom:-80px;left:-80px;animation:o2 15s ease-in-out infinite}
        @keyframes o1{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}
        @keyframes o2{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-40px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{from{background-position:-200% center}to{background-position:200% center}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(0,230,118,0.4)}50%{box-shadow:0 0 0 10px rgba(0,230,118,0)}}
        @keyframes checkPop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes borderPulse{0%,100%{border-color:rgba(0,230,118,0.3)}50%{border-color:rgba(0,230,118,0.7)}}
        @keyframes slideInR{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOutL{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-50px)}}
        @keyframes slideInL{from{opacity:0;transform:translateX(-50px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOutR{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(60px)}}
        .mono{font-family:'JetBrains Mono',monospace}
        .option-card{background:rgba(255,255,255,0.025);border:1.5px solid rgba(255,255,255,0.07);border-radius:18px;padding:16px;cursor:pointer;transition:all 0.18s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;gap:14px;user-select:none;-webkit-tap-highlight-color:transparent;position:relative;overflow:hidden}
        .option-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.14);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3)}
        .option-card:active{transform:scale(0.97)}
        .option-card.selected{background:rgba(0,230,118,0.07);border-color:rgba(0,230,118,0.45);box-shadow:0 0 0 1px rgba(0,230,118,0.15)}
        .primary-btn{background:linear-gradient(135deg,#00e676 0%,#00c853 50%,#00e676 100%);background-size:200% 200%;animation:shimmer 3s linear infinite;color:#060b14;border:none;padding:17px 40px;font-size:17px;font-weight:800;border-radius:16px;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.2s;width:100%}
        .primary-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,230,118,0.4)}
        .primary-btn:disabled{opacity:0.3;cursor:not-allowed;animation:none;background:#444}
        .ghost-btn{background:transparent;border:none;color:rgba(255,255,255,0.35);font-size:14px;font-weight:600;cursor:pointer;padding:12px 16px;font-family:'Sora',sans-serif;transition:all 0.2s;display:flex;align-items:center;gap:6px;border-radius:12px}
        .ghost-btn:hover{color:rgba(255,255,255,0.65);background:rgba(255,255,255,0.04)}
        .input-field{background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);border-radius:14px;padding:16px 20px;font-size:16px;color:#f0f0f0;width:100%;font-family:'Sora',sans-serif;transition:all 0.2s;outline:none}
        .input-field:focus{border-color:rgba(0,230,118,0.5);background:rgba(0,230,118,0.03);box-shadow:0 0 0 3px rgba(0,230,118,0.07)}
        .input-field::placeholder{color:rgba(255,255,255,0.2)}
        .glass{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:32px 28px;backdrop-filter:blur(20px);box-shadow:0 24px 48px rgba(0,0,0,0.3)}
        .share-row{display:flex;align-items:center;gap:14px;padding:15px 18px;border-radius:16px;border:1.5px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.025);cursor:pointer;transition:all 0.18s;margin-bottom:8px}
        .share-row:hover{background:rgba(255,255,255,0.05);transform:translateX(4px)}
        .pill{display:inline-flex;align-items:center;gap:7px;background:rgba(0,230,118,0.08);border:1px solid rgba(0,230,118,0.18);border-radius:100px;padding:7px 16px;font-size:13px;font-weight:600;color:#00e676}
        .chip{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:100px;padding:7px 14px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.55)}
        .stat-box{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:16px 12px;text-align:center}
        .ref-box{background:rgba(0,230,118,0.05);border:1.5px dashed rgba(0,230,118,0.25);border-radius:16px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;animation:borderPulse 3s ease infinite}
        .progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#00c853,#00e676,#69f0ae);background-size:200% 100%;animation:shimmer 2s linear infinite;transition:width 0.5s cubic-bezier(0.4,0,0.2,1)}
      `}</style>

      <div className="bg-grid" />
      <div className="orb orb1" />
      <div className="orb orb2" />

      {/* NAV */}
      <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:50,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center", background:screen!=="hero"?"rgba(6,11,20,0.88)":"transparent", backdropFilter:screen!=="hero"?"blur(16px)":"none", borderBottom:screen!=="hero"?"1px solid rgba(255,255,255,0.05)":"none", transition:"all 0.3s" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#00e676,#00c853)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#060b14",boxShadow:"0 4px 12px rgba(0,230,118,0.35)" }}>G</div>
          <span style={{ fontWeight:800,fontSize:20,letterSpacing:-0.7 }}>Ganá<span style={{ color:"#00e676" }}>Ya</span></span>
        </div>
        {referredBy && <div className="pill" style={{ fontSize:11,padding:"4px 12px" }}>🎁 Invitación</div>}
      </nav>

      {/* PROGRESS */}
      {(screen==="questions"||screen==="signup") && (
        <div style={{ position:"fixed",top:64,left:0,right:0,zIndex:40,padding:"8px 20px 10px",background:"rgba(6,11,20,0.88)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
            <span style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.3)" }}>{screen==="signup"?"Último paso":`Paso ${step+1} de ${QUESTIONS.length}`}</span>
            <span className="mono" style={{ fontSize:12,fontWeight:700,color:"#00e676" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height:3,borderRadius:3,background:"rgba(255,255,255,0.06)",overflow:"hidden" }}>
            <div className="progress-fill" style={{ width:`${progress}%` }} />
          </div>
        </div>
      )}

      {/* HERO */}
      {screen==="hero" && (
        <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"80px 24px 60px",position:"relative",zIndex:1,textAlign:"center",animation:"fadeUp 0.65s ease" }}>
          <div className="pill" style={{ marginBottom:32 }}>🇦🇷 Primera plataforma argentina de do-to-earn</div>
          <h1 style={{ fontSize:"clamp(36px,9vw,60px)",fontWeight:900,lineHeight:1.08,letterSpacing:-2,marginBottom:20,maxWidth:520 }}>
            Completá misiones.<br/>
            <span style={{ background:"linear-gradient(135deg,#00e676,#69f0ae,#b9f6ca)",backgroundSize:"200% 200%",animation:"shimmer 4s linear infinite",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>Ganá premios.</span>
          </h1>
          <p style={{ fontSize:17,lineHeight:1.65,color:"rgba(255,255,255,0.45)",maxWidth:400,margin:"0 auto 40px" }}>
            Respondé encuestas, probá apps y servicios desde tu celu. Canjeá por gift cards de{" "}
            <span style={{ color:"#FFE600",fontWeight:700 }}>MercadoLibre</span>,{" "}
            <span style={{ color:"#FF6B00",fontWeight:700 }}>Rappi</span> o plata en{" "}
            <span style={{ color:"#009EE3",fontWeight:700 }}>MercadoPago</span>.
          </p>
          <div style={{ width:"100%",maxWidth:340 }}>
            <button className="primary-btn" onClick={() => { setScreen("questions"); track("cta_clicked"); }} style={{ borderRadius:60,fontSize:18,padding:"19px 40px" }}>
              Quiero sumarme →
            </button>
          </div>
          <div style={{ marginTop:28,display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center" }}>
            {["🛍️ MercadoLibre","🛵 Rappi","📱 Recarga celular","🎵 Spotify","💰 MercadoPago"].map((r,i) => <span key={i} className="chip">{r}</span>)}
          </div>
          <div style={{ marginTop:40 }}>
            <div className="pill" style={{ fontSize:13,padding:"8px 18px" }}>🚀 Lanzamos pronto — Anotate para beneficios anticipados</div>
          </div>
          <div style={{ marginTop:24,display:"flex",gap:20,justifyContent:"center",fontSize:12,color:"rgba(255,255,255,0.18)",flexWrap:"wrap" }}>
            <span>✓ 100% gratis</span><span>·</span><span>✓ Sin spam</span><span>·</span><span>✓ Hecho en Argentina</span>
          </div>
        </div>
      )}

      {/* QUESTIONS */}
      {screen==="questions" && (
        <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"110px 20px 40px",position:"relative",zIndex:1 }}>
          <div style={{ maxWidth:480,margin:"0 auto",width:"100%", animation:isAnimating?(animDir==="forward"?"slideOutL 0.22s ease forwards":"slideOutR 0.22s ease forwards"):(animDir==="forward"?"slideInR 0.3s ease":"slideInL 0.3s ease") }}>
            <div style={{ textAlign:"center",marginBottom:28 }}>
              <div style={{ fontSize:44,marginBottom:14 }}>{QUESTIONS[step].emoji}</div>
              <h2 style={{ fontSize:24,fontWeight:800,letterSpacing:-0.6,marginBottom:8 }}>{QUESTIONS[step].title}</h2>
              <p style={{ fontSize:14,color:"rgba(255,255,255,0.38)",fontWeight:500 }}>{QUESTIONS[step].sub}</p>
              {QUESTIONS[step].type==="multi" && <span style={{ display:"inline-block",marginTop:8,fontSize:11,fontWeight:700,color:"rgba(0,230,118,0.55)",background:"rgba(0,230,118,0.07)",borderRadius:100,padding:"3px 10px" }}>Podés elegir varias</span>}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:QUESTIONS[step].opts.length<=4?"1fr":"1fr 1fr",gap:9,marginBottom:28 }}>
              {QUESTIONS[step].opts.map((opt,i) => {
                const sel = isSelected(QUESTIONS[step].id, opt.v);
                return (
                  <div key={opt.v} className={`option-card${sel?" selected":""}`}
                    style={{ animation:`fadeUp 0.3s ease ${0.04*i}s both`, gridColumn:QUESTIONS[step].opts.length<=4?"1 / -1":undefined }}
                    onClick={() => { selectOption(QUESTIONS[step].id,opt.v,QUESTIONS[step].type); if(QUESTIONS[step].type==="single") setTimeout(()=>navigate("forward"),320); }}>
                    <div style={{ fontSize:QUESTIONS[step].opts.length<=4?26:22,width:44,height:44,borderRadius:13,background:sel?"rgba(0,230,118,0.14)":"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s" }}>{opt.e}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:15,fontWeight:700,color:sel?"#00e676":"#f0f0f0",transition:"color 0.2s" }}>{opt.l}</div>
                      {opt.d && <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2 }}>{opt.d}</div>}
                    </div>
                    {sel && <div style={{ width:24,height:24,borderRadius:8,background:"#00e676",display:"flex",alignItems:"center",justifyContent:"center",animation:"checkPop 0.28s ease",flexShrink:0 }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5L5 9.5L11 3.5" stroke="#060b14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>}
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:12 }}>
              <button className="ghost-btn" onClick={() => navigate("back")}>← Atrás</button>
              {QUESTIONS[step].type==="multi" && <button className="primary-btn" onClick={nextStep} disabled={!canProceed()} style={{ width:"auto",padding:"13px 28px",fontSize:15,borderRadius:14 }}>Siguiente →</button>}
            </div>
          </div>
        </div>
      )}

      {/* SIGNUP */}
      {screen==="signup" && (
        <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"110px 20px 40px",position:"relative",zIndex:1,animation:"fadeUp 0.45s ease" }}>
          <div style={{ maxWidth:440,margin:"0 auto",width:"100%" }}>
            <div className="glass">
              <div style={{ textAlign:"center",marginBottom:28 }}>
                <div style={{ width:60,height:60,borderRadius:18,background:"linear-gradient(135deg,rgba(0,230,118,0.15),rgba(0,200,83,0.08))",border:"1px solid rgba(0,230,118,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px" }}>🚀</div>
                <h2 style={{ fontSize:24,fontWeight:800,letterSpacing:-0.6,marginBottom:6 }}>¡Último paso!</h2>
                <p style={{ fontSize:14,color:"rgba(255,255,255,0.38)" }}>Reservá tu acceso anticipado</p>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:14,marginBottom:20 }}>
                <div>
                  <label style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.35)",marginBottom:7,display:"block",textTransform:"uppercase",letterSpacing:1.2 }}>Email *</label>
                  <input type="email" className="input-field" placeholder="vos@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.35)",marginBottom:7,display:"block",textTransform:"uppercase",letterSpacing:1.2 }}>WhatsApp <span style={{ fontWeight:400,textTransform:"none",opacity:0.6 }}>(opcional)</span></label>
                  <input type="tel" className="input-field" placeholder="+54 11 1234-5678" value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
              </div>
              {error && <div style={{ background:"rgba(255,70,70,0.08)",border:"1px solid rgba(255,70,70,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#ff7070",fontWeight:500 }}>{error}</div>}
              <button className="primary-btn" onClick={handleSubmit} disabled={loading||!email.trim()}>{loading?"Registrando...":"Reservar mi lugar 🎉"}</button>
              <button className="ghost-btn" onClick={()=>{setScreen("questions");setStep(QUESTIONS.length-1)}} style={{ width:"100%",justifyContent:"center",marginTop:8 }}>← Volver</button>
              <div style={{ display:"flex",gap:12,justifyContent:"center",marginTop:16,fontSize:12,color:"rgba(255,255,255,0.2)",flexWrap:"wrap" }}>
                <span>✓ 100% gratis</span><span>·</span><span>✓ Sin spam</span><span>·</span><span>✓ Acceso anticipado</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {screen==="done" && (
        <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"80px 20px 40px",position:"relative",zIndex:1,animation:"fadeUp 0.5s ease" }}>
          <div style={{ maxWidth:440,margin:"0 auto",width:"100%" }}>
            <div className="glass" style={{ marginBottom:14 }}>
              <div style={{ textAlign:"center",marginBottom:24 }}>
                <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(0,230,118,0.1)",border:"1.5px solid rgba(0,230,118,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 16px",animation:"pulseGlow 2.5s ease infinite" }}>✅</div>
                <h2 style={{ fontSize:27,fontWeight:900,letterSpacing:-0.7,marginBottom:5 }}>¡Estás adentro!</h2>
                <p style={{ fontSize:15,color:"rgba(255,255,255,0.4)" }}>Te anotaste con éxito. Te vamos a avisar apenas lancemos.</p>
              </div>
              <div className="ref-box" style={{ marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:3,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700 }}>Tu código</div>
                  <div className="mono" style={{ fontSize:20,fontWeight:800,color:"#00e676" }}>{refCode}</div>
                </div>
                <button onClick={copyLink} style={{ background:copied?"#00e676":"rgba(0,230,118,0.12)",color:copied?"#060b14":"#00e676",border:"1px solid rgba(0,230,118,0.3)",borderRadius:12,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all 0.2s" }}>{copied?"¡Copiado! ✓":"Copiar"}</button>
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)",borderRadius:16,padding:"16px 18px" }}>
                <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:12,textTransform:"uppercase",letterSpacing:1.2 }}>🏆 Beneficios por invitar</div>
                {[{count:3,reward:"Acceso anticipado al beta",icon:"⚡"},{count:10,reward:"500 puntos de regalo al lanzar",icon:"🎁"},{count:25,reward:"Gift card de $5 USD gratis",icon:"💳"}].map((m,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<2?"1px solid rgba(255,255,255,0.04)":"none",opacity:0.45 }}>
                    <div style={{ width:32,height:32,borderRadius:10,flexShrink:0,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.3)" }}>{m.count}</div>
                    <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)" }}>{m.icon} {m.reward}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass" style={{ padding:"22px 20px" }}>
              <p style={{ fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.5)",marginBottom:14,textAlign:"center" }}>Invitá amigos y subí en la lista 🚀</p>
              <div className="share-row" onClick={shareWA}><span style={{ fontSize:22 }}>💬</span><span style={{ fontWeight:700,fontSize:15,color:"#f0f0f0" }}>Compartir por WhatsApp</span><span style={{ marginLeft:"auto",opacity:0.35 }}>→</span></div>
              <div className="share-row" onClick={copyLink}><span style={{ fontSize:22 }}>🔗</span><span style={{ fontWeight:700,fontSize:15,color:"#f0f0f0" }}>Copiar link directo</span><span style={{ marginLeft:"auto",opacity:0.35 }}>{copied?"✓":"→"}</span></div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ padding:"28px 20px",textAlign:"center",position:screen==="hero"?"absolute":"relative",bottom:0,left:0,right:0,zIndex:1 }}>
        <p style={{ fontSize:12,color:"rgba(255,255,255,0.15)",fontWeight:500 }}>Hecho con 💚 en Argentina</p>
      </footer>
    </div>
  );
}
