'use client';

import React from 'react';

const Obmep: React.FC = () => {
  return (
    <>
      <style>
        {`
          :root {
            --bg-deep: #0a0e27;
            --bg-card: #111638;
            --bg-card-hover: #161d4a;
            --gold-main: #fbbf24;
            --gold-light: #fde68a;
            --blue-accent: #60a5fa;
            --green-accent: #34d399;
            --purple-accent: #a78bfa;
            --cyan-accent: #22d3ee;
            --red-accent: #f87171;
            --text-main: #e2e8f0;
            --text-muted: #94a3b8;
            --text-bright: #f8fafc;
            --border-subtle: rgba(251, 191, 36, 0.15);
            --glow-gold: 0 0 30px rgba(251, 191, 36, 0.2);
            --glow-blue: 0 0 30px rgba(96, 165, 250, 0.2);
            --glow-cyan: 0 0 30px rgba(34, 211, 238, 0.25);
            --glow-red: 0 0 30px rgba(248, 113, 113, 0.25);
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: var(--bg-deep);
            color: var(--text-main);
            min-height: 100vh;
            overflow-x: hidden;
          }
          body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background:
              radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.8), transparent),
              radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.6), transparent),
              radial-gradient(1.5px 1.5px at 50% 10%, rgba(251,191,36,0.8), transparent),
              radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.7), transparent),
              radial-gradient(1.5px 1.5px at 15% 85%, rgba(96,165,250,0.7), transparent),
              radial-gradient(1px 1px at 45% 45%, rgba(255,255,255,0.4), transparent),
              radial-gradient(1px 1px at 80% 15%, rgba(255,255,255,0.6), transparent),
              radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1.5px 1.5px at 25% 35%, rgba(167,139,250,0.6), transparent);
            pointer-events: none; z-index: 0;
            animation: twinkle 4s ease-in-out infinite alternate;
          }
          @keyframes twinkle { 0% { opacity: 0.7; } 100% { opacity: 1; } }

          .container { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; padding: 24px 16px 60px; }

          .dream-scene { position: relative; width: 100%; height: 440px; margin-bottom: 10px; }
          .student-body { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); z-index: 5; }
          .head { position: relative; width: 48px; height: 52px; background: linear-gradient(180deg, #d4a574, #c4915e); border-radius: 50% 50% 45% 45%; margin: 0 auto; z-index: 10; animation: headTilt 4s ease-in-out infinite; }
          @keyframes headTilt { 0%, 100% { transform: rotate(-5deg) translateY(0); } 50% { transform: rotate(-2deg) translateY(-3px); } }
          .hair { position: absolute; top: -4px; left: -4px; right: -4px; height: 30px; background: #2c1810; border-radius: 50% 50% 0 0; z-index: 11; }
          .hair::after { content: ''; position: absolute; top: 8px; right: -3px; width: 10px; height: 20px; background: #2c1810; border-radius: 0 50% 50% 0; }
          .eye-left, .eye-right { position: absolute; top: 22px; width: 7px; height: 8px; background: #2c1810; border-radius: 50%; z-index: 12; }
          .eye-left { left: 12px; }
          .eye-right { right: 12px; }
          .eye-left::after, .eye-right::after { content: ''; position: absolute; top: 1px; right: 1px; width: 3px; height: 3px; background: rgba(255,255,255,0.8); border-radius: 50%; }
          .smile { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); width: 12px; height: 6px; border: 2px solid #a0704c; border-top: none; border-radius: 0 0 12px 12px; z-index: 12; }
          .torso { width: 56px; height: 50px; background: linear-gradient(180deg, #1e40af, #1e3a8a); border-radius: 8px 8px 4px 4px; margin: -4px auto 0; position: relative; }
          .torso::before { content: ''; position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; }
          .arm-left { position: absolute; top: 4px; left: -8px; width: 20px; height: 44px; background: linear-gradient(180deg, #1e40af, #1e3a8a); border-radius: 10px; transform: rotate(15deg); z-index: 4; }
          .arm-left::after { content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; background: #d4a574; border-radius: 50%; }
          .arm-right { position: absolute; top: 4px; right: -6px; width: 20px; height: 40px; background: linear-gradient(180deg, #1e40af, #1e3a8a); border-radius: 10px; transform: rotate(-20deg); z-index: 6; }
          .arm-right::after { content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; background: #d4a574; border-radius: 50%; }
          .desk { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 170px; height: 12px; background: linear-gradient(180deg, #8B6914, #6B4F10); border-radius: 3px 3px 0 0; z-index: 4; }
          .desk::after { content: ''; position: absolute; top: 12px; left: 20px; width: 8px; height: 28px; background: #6B4F10; border-radius: 0 0 2px 2px; box-shadow: 114px 0 0 #6B4F10; }
          .book { position: absolute; bottom: 12px; left: 50%; margin-left: -45px; transform: rotate(-5deg); width: 50px; height: 36px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 2px 4px 4px 2px; z-index: 6; box-shadow: -2px 0 0 #1e40af; }
          .book::before { content: '∑'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.7); font-size: 18px; font-weight: bold; }
          .pencil { position: absolute; bottom: 14px; left: 50%; margin-left: 15px; width: 6px; height: 40px; background: linear-gradient(180deg, #fbbf24 0%, #fbbf24 70%, #f59e0b 70%, #f59e0b 85%, #1a1a2e 85%); border-radius: 1px 1px 0 0; transform: rotate(25deg); z-index: 6; }
          .pencil::before { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-top: 8px solid #d4a574; }

          .thought-cloud {
            position: absolute; top: 0; left: 50%;
            transform: translateX(-50%);
            width: 310px; height: 240px;
            z-index: 3;
            animation: cloudFloat 5s ease-in-out infinite;
            filter: drop-shadow(0 0 18px rgba(167,139,250,0.2)) drop-shadow(0 0 40px rgba(96,165,250,0.08));
          }
          @keyframes cloudFloat {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-8px); }
          }
          .cloud-body {
            position: absolute; top: 30px; left: 15px;
            width: 280px; height: 180px;
            background: linear-gradient(180deg, #141a42 0%, #10153a 60%, #0e1230 100%);
            border-radius: 90px;
            border: 2px solid rgba(255,255,255,0.1);
            overflow: hidden;
          }
          .cloud-body::before {
            content: '';
            position: absolute; inset: 0;
            background: radial-gradient(ellipse at 30% 25%, rgba(96,165,250,0.12), transparent 60%),
                        radial-gradient(ellipse at 70% 70%, rgba(167,139,250,0.08), transparent 50%);
          }
          .cloud-body::after {
            content: '';
            position: absolute; top: 8px; left: 20px;
            width: 60px; height: 25px;
            background: rgba(255,255,255,0.06);
            border-radius: 50%;
            transform: rotate(-15deg);
            filter: blur(6px);
          }
          .cloud-bump {
            position: absolute;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.1);
            z-index: 2;
          }
          .cloud-bump-1 {
            width: 130px; height: 110px;
            top: 0; left: 30px;
            background: linear-gradient(180deg, #161c48, #10153a);
            border-bottom-color: transparent;
          }
          .cloud-bump-2 {
            width: 150px; height: 120px;
            top: -15px; left: 90px;
            background: linear-gradient(180deg, #171e4a, #10153a);
            border-bottom-color: transparent;
          }
          .cloud-bump-3 {
            width: 110px; height: 95px;
            top: 0px; right: 15px;
            background: linear-gradient(180deg, #151b45, #10153a);
            border-bottom-color: transparent;
          }
          .cloud-bump-4 {
            width: 100px; height: 85px;
            top: 20px; left: -5px;
            background: linear-gradient(180deg, #141a42, #10153a);
            border-bottom-color: transparent;
            border-right-color: transparent;
          }
          .cloud-bump-5 {
            width: 95px; height: 80px;
            top: 25px; right: -5px;
            background: linear-gradient(180deg, #141a42, #10153a);
            border-bottom-color: transparent;
            border-left-color: transparent;
          }
          .cloud-content {
            position: absolute;
            top: 40px; left: 25px;
            width: 260px; height: 165px;
            z-index: 4;
          }
          .thought-dot {
            position: absolute;
            border-radius: 50%;
            z-index: 2;
            border: 1.5px solid rgba(255,255,255,0.1);
            animation: thoughtFloat 4s ease-in-out infinite;
          }
          .thought-dot-1 {
            bottom: 110px; left: 50%; margin-left: 85px;
            width: 42px; height: 34px;
            background: radial-gradient(ellipse at 35% 35%, #161c48, #0e1230);
            animation-delay: 0.2s;
          }
          .thought-dot-2 {
            bottom: 128px; left: 50%; margin-left: 62px;
            width: 26px; height: 22px;
            background: radial-gradient(ellipse at 35% 35%, #151b45, #0e1230);
            animation-delay: 0.5s;
          }
          .thought-dot-3 {
            bottom: 142px; left: 50%; margin-left: 48px;
            width: 14px; height: 12px;
            background: radial-gradient(ellipse at 35% 35%, #141a42, #0e1230);
            animation-delay: 0.8s;
          }
          @keyframes thoughtFloat {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
            50% { transform: translateY(-4px) scale(1.08); opacity: 1; }
          }

          .rocket-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 4; animation: rocketLaunch 3s ease-in-out infinite; }
          @keyframes rocketLaunch { 0% { transform: translate(-50%, -40%) rotate(-5deg); } 25% { transform: translate(-50%, -50%) rotate(0deg); } 50% { transform: translate(-50%, -58%) rotate(3deg); } 75% { transform: translate(-50%, -48%) rotate(-2deg); } 100% { transform: translate(-50%, -40%) rotate(-5deg); } }
          .rocket { position: relative; width: 50px; height: 110px; }
          .rocket-body { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: 32px; height: 68px; background: linear-gradient(90deg, #d1d5db 0%, #f8fafc 35%, #e5e7eb 65%, #d1d5db 100%); border-radius: 50% 50% 8px 8px; }
          .rocket-body::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 32px; height: 16px; background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626); border-radius: 0 0 8px 8px; }
          .rocket-nose { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 16px solid transparent; border-right: 16px solid transparent; border-bottom: 30px solid #ef4444; }
          .rocket-window { position: absolute; top: 38px; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; background: radial-gradient(circle at 35% 35%, #93c5fd, #2563eb); border-radius: 50%; border: 2.5px solid #cbd5e1; box-shadow: inset 0 0 6px rgba(59,130,246,0.5), 0 0 8px rgba(96,165,250,0.3); }
          .fin-left, .fin-right { position: absolute; bottom: 16px; width: 14px; height: 22px; }
          .fin-left { left: 0; background: #ef4444; clip-path: polygon(100% 0%, 100% 100%, 0% 100%); }
          .fin-right { right: 0; background: #ef4444; clip-path: polygon(0% 0%, 100% 100%, 0% 100%); }
          .fire { position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); display: flex; gap: 1px; }
          .flame { border-radius: 0 0 50% 50%; animation: flicker 0.12s ease-in-out infinite alternate; }
          .flame-center { width: 14px; height: 36px; background: linear-gradient(180deg, #fef3c7, #fbbf24, #f59e0b, #ef4444, rgba(239,68,68,0.1)); }
          .flame-left { width: 9px; height: 24px; background: linear-gradient(180deg, #fef3c7, #fbbf24, #fb923c, rgba(251,146,60,0)); animation-delay: 0.04s; transform: rotate(10deg); }
          .flame-right { width: 9px; height: 24px; background: linear-gradient(180deg, #fef3c7, #fbbf24, #fb923c, rgba(251,146,60,0)); animation-delay: 0.08s; transform: rotate(-10deg); }
          @keyframes flicker { 0% { height: 30px; } 100% { height: 40px; opacity: 0.85; } }
          .smoke { position: absolute; bottom: -35px; left: 50%; transform: translateX(-50%); width: 60px; height: 30px; }
          .smoke-puff { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.08); animation: smokePuff 2s ease-out infinite; }
          .smoke-puff:nth-child(1) { left: 10px; width: 14px; height: 14px; }
          .smoke-puff:nth-child(2) { left: 25px; width: 18px; height: 18px; animation-delay: 0.3s; }
          .smoke-puff:nth-child(3) { left: 38px; width: 12px; height: 12px; animation-delay: 0.6s; }
          @keyframes smokePuff { 0% { transform: translateY(0) scale(1); opacity: 0.15; } 100% { transform: translateY(25px) scale(3); opacity: 0; } }

          .bubble-star { position: absolute; color: var(--gold-main); font-size: 10px; animation: bubbleStar 3s ease-in-out infinite; z-index: 2; }
          .bubble-star:nth-child(1) { top: 18%; left: 14%; }
          .bubble-star:nth-child(2) { top: 28%; right: 16%; animation-delay: 0.5s; font-size: 8px; }
          .bubble-star:nth-child(3) { bottom: 22%; left: 11%; animation-delay: 1s; font-size: 13px; }
          .bubble-star:nth-child(4) { bottom: 28%; right: 14%; animation-delay: 1.5s; font-size: 7px; }
          .bubble-star:nth-child(5) { top: 12%; left: 42%; animation-delay: 0.7s; font-size: 6px; }
          .bubble-star:nth-child(6) { top: 58%; right: 20%; animation-delay: 1.2s; font-size: 9px; }
          @keyframes bubbleStar { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
          .math-sym { position: absolute; color: rgba(167, 139, 250, 0.4); font-weight: 700; font-size: 14px; z-index: 1; animation: mathFloat 6s ease-in-out infinite; }
          .math-sym:nth-child(1) { top: 16%; left: 22%; }
          .math-sym:nth-child(2) { top: 62%; right: 18%; animation-delay: 1s; font-size: 12px; }
          .math-sym:nth-child(3) { bottom: 18%; left: 20%; animation-delay: 2s; font-size: 16px; }
          .math-sym:nth-child(4) { top: 38%; left: 10%; animation-delay: 3s; font-size: 11px; }
          @keyframes mathFloat { 0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.25; } 50% { transform: translateY(-10px) rotate(12deg); opacity: 0.55; } }

          .zzz { position: absolute; right: 50%; margin-right: -165px; top: 135px; z-index: 6; }
          .zzz span { display: block; color: rgba(251, 191, 36, 0.5); font-weight: 800; animation: zFloat 3s ease-in-out infinite; }
          .zzz span:nth-child(1) { font-size: 10px; }
          .zzz span:nth-child(2) { font-size: 14px; margin-left: 10px; animation-delay: 0.4s; }
          .zzz span:nth-child(3) { font-size: 18px; margin-left: 20px; animation-delay: 0.8s; }
          @keyframes zFloat { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-8px); opacity: 0.7; } }
          .dream-label { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); text-align: center; z-index: 10; }
          .dream-label span { font-size: 0.68rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--text-muted); background: rgba(10,14,39,0.8); padding: 3px 14px; border-radius: 8px; opacity: 0.7; }

          .exam-date-banner {
            position: relative;
            margin-bottom: 24px;
            padding: 4px;
            border-radius: 22px;
            background: linear-gradient(135deg, #ef4444, #fbbf24, #ef4444, #fbbf24);
            background-size: 300% 300%;
            animation: borderShift 3s ease-in-out infinite;
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.3), 0 0 60px rgba(251, 191, 36, 0.15);
          }
          @keyframes borderShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .exam-date-pulse {
            position: absolute; inset: -4px;
            border-radius: 26px;
            background: linear-gradient(135deg, rgba(239,68,68,0.4), rgba(251,191,36,0.3));
            animation: examPulse 2s ease-in-out infinite;
            z-index: -1;
            filter: blur(8px);
          }
          @keyframes examPulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
          }
          .exam-date-content {
            background: linear-gradient(135deg, #1a0a0a 0%, #1f1020 50%, #1a0a0a 100%);
            border-radius: 18px;
            padding: 28px 24px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .exam-date-content::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #ef4444, #fbbf24, #ef4444);
          }
          .exam-date-content::after {
            content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #fbbf24, #ef4444, #fbbf24);
          }
          .exam-date-icon {
            font-size: 2.8rem;
            margin-bottom: 8px;
            animation: calendarBounce 2s ease-in-out infinite;
            filter: drop-shadow(0 0 10px rgba(251,191,36,0.5));
          }
          @keyframes calendarBounce {
            0%, 100% { transform: scale(1) rotate(0deg); }
            15% { transform: scale(1.15) rotate(-5deg); }
            30% { transform: scale(1) rotate(3deg); }
            45% { transform: scale(1.08) rotate(0deg); }
          }
          .exam-date-label {
            font-size: 0.72rem; font-weight: 700;
            letter-spacing: 3px; text-transform: uppercase;
            color: var(--red-accent);
            margin-bottom: 8px;
          }
          .exam-date-phase {
            font-size: 1rem; font-weight: 700;
            letter-spacing: 2px; text-transform: uppercase;
            color: var(--gold-light);
            margin-bottom: 6px;
          }
          .exam-date-day {
            font-size: clamp(1.6rem, 5vw, 2.2rem);
            font-weight: 900;
            color: #ffffff;
            text-shadow: 0 0 20px rgba(251,191,36,0.4), 0 0 40px rgba(239,68,68,0.2);
            letter-spacing: 1px;
            margin-bottom: 8px;
            line-height: 1.2;
          }
          .exam-date-local {
            font-size: 1.05rem; font-weight: 700;
            color: var(--gold-main);
            margin-bottom: 12px;
            letter-spacing: 1px;
          }
          .exam-date-countdown {
            font-size: 0.88rem; font-weight: 500;
            color: var(--text-main);
            padding: 8px 16px;
            background: rgba(251, 191, 36, 0.1);
            border-radius: 10px;
            display: inline-block;
            border: 1px solid rgba(251, 191, 36, 0.2);
          }

          .hero-text { text-align: center; padding: 0 20px 36px; animation: fadeInUp 0.8s ease-out; }
          .hero-text h1 { font-size: clamp(1.7rem, 5vw, 2.4rem); font-weight: 800; color: var(--gold-main); letter-spacing: -0.5px; line-height: 1.2; text-shadow: 0 0 40px rgba(251, 191, 36, 0.3); }
          .hero-star { display: inline-block; color: var(--gold-light); margin: 0 4px; animation: starPulse 2s ease-in-out infinite; }
          @keyframes starPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
          .hero-subtitle { font-size: clamp(0.95rem, 3vw, 1.1rem); color: var(--text-main); margin-top: 14px; line-height: 1.6; font-weight: 300; max-width: 520px; margin-left: auto; margin-right: auto; }

          .divider { display: flex; align-items: center; gap: 12px; margin: 28px 0; opacity: 0.4; }
          .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-main), transparent); }

          .card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 28px 24px; margin-bottom: 20px; transition: all 0.3s ease; animation: fadeInUp 0.6s ease-out both; }
          .card:hover { background: var(--bg-card-hover); border-color: rgba(251, 191, 36, 0.3); transform: translateY(-2px); box-shadow: var(--glow-gold); }

          .card-obmep-king {
            background: linear-gradient(135deg, #1a0a0a 0%, #2a1020 30%, #1a0a18 60%, #1a0a0a 100%);
            border: 3px solid rgba(251, 191, 36, 0.5);
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.2), 0 0 80px rgba(248, 113, 113, 0.1);
            padding: 36px 30px; position: relative; overflow: hidden;
            animation: fadeInUp 0.6s ease-out both, kingGlow 3s ease-in-out infinite;
          }
          @keyframes kingGlow {
            0%, 100% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.2), 0 0 80px rgba(248, 113, 113, 0.1); }
            50% { box-shadow: 0 0 60px rgba(251, 191, 36, 0.35), 0 0 100px rgba(248, 113, 113, 0.15); }
          }
          .card-obmep-king::before {
            content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background: radial-gradient(circle at 40% 30%, rgba(251, 191, 36, 0.08), transparent 50%);
            pointer-events: none;
          }
          .card-obmep-king .card-title { color: var(--gold-main); font-size: 1.4rem; }
          .card-obmep-king .card-tip { background: rgba(251, 191, 36, 0.1); border-left-color: var(--gold-main); color: var(--gold-light); }

          .badge-king {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(248, 113, 113, 0.15));
            color: var(--gold-main);
            border: 1px solid rgba(251, 191, 36, 0.4);
          }

          .card-featured {
            background: linear-gradient(135deg, #111638 0%, #1a1f50 50%, #111638 100%);
            border: 2px solid rgba(251, 191, 36, 0.35); box-shadow: var(--glow-gold);
            padding: 32px 28px; position: relative; overflow: hidden;
          }
          .card-featured::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.06), transparent 60%); pointer-events: none; }
          .card-featured .card-title { color: var(--gold-main); }

          .card-trophy {
            background: linear-gradient(135deg, #111638 0%, #1a1340 50%, #111638 100%);
            border: 2px solid rgba(167, 139, 250, 0.35); box-shadow: var(--glow-blue);
            padding: 32px 28px; position: relative; overflow: hidden;
          }
          .card-trophy::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 70% 30%, rgba(167, 139, 250, 0.06), transparent 60%); pointer-events: none; }
          .card-trophy .card-title { color: var(--purple-accent); }
          .card-trophy .card-tip { background: rgba(167, 139, 250, 0.08); border-left-color: var(--purple-accent); color: #c4b5fd; }

          .badge-cyan { background: rgba(34, 211, 238, 0.15); color: var(--cyan-accent); border: 1px solid rgba(34, 211, 238, 0.35); }

          .card-icons {
            display: flex; align-items: center; gap: 6px;
            margin-bottom: 12px; flex-wrap: wrap;
          }
          .medal-trophy {
            display: inline-flex; align-items: center; gap: 3px;
            font-size: 1.5rem;
            animation: medalShine 3s ease-in-out infinite;
            filter: drop-shadow(0 0 6px rgba(251,191,36,0.4));
          }
          @keyframes medalShine {
            0%, 100% { filter: drop-shadow(0 0 6px rgba(251,191,36,0.3)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 12px rgba(251,191,36,0.6)); transform: scale(1.05); }
          }
          .medal-trophy-big {
            font-size: 2rem;
            animation: medalShineBig 2.5s ease-in-out infinite;
            filter: drop-shadow(0 0 10px rgba(251,191,36,0.5));
          }
          @keyframes medalShineBig {
            0%, 100% { filter: drop-shadow(0 0 10px rgba(251,191,36,0.4)); transform: scale(1) rotate(0deg); }
            50% { filter: drop-shadow(0 0 18px rgba(251,191,36,0.7)); transform: scale(1.08) rotate(3deg); }
          }

          .card-badge {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
            letter-spacing: 2px; padding: 5px 14px; border-radius: 100px;
          }
          .badge-gold { background: rgba(251, 191, 36, 0.15); color: var(--gold-main); border: 1px solid rgba(251, 191, 36, 0.3); }
          .badge-purple { background: rgba(167, 139, 250, 0.15); color: var(--purple-accent); border: 1px solid rgba(167, 139, 250, 0.3); }

          .badge-free {
            display: inline-flex; align-items: center; gap: 4px;
            font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 1.5px; padding: 4px 12px; border-radius: 8px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white; margin-left: 8px;
            animation: freePulse 2s ease-in-out infinite;
            box-shadow: 0 0 12px rgba(16,185,129,0.3);
          }
          @keyframes freePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

          .badge-number-one {
            display: inline-flex; align-items: center; gap: 4px;
            font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 1.5px; padding: 4px 12px; border-radius: 8px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            animation: freePulse 2s ease-in-out infinite;
            box-shadow: 0 0 12px rgba(239,68,68,0.3);
          }

          .card-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 4px; }
          .card-sub { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1.5px; }

          .card-link {
            display: inline-flex; align-items: center; gap: 8px;
            color: var(--text-bright); background: rgba(255,255,255,0.08);
            padding: 10px 18px; border-radius: 12px; text-decoration: none;
            font-weight: 500; font-size: 0.95rem; margin: 12px 0 16px;
            border: 1px solid rgba(255,255,255,0.1); transition: all 0.25s ease;
            word-break: break-all;
          }
          .card-link:hover { background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.3); color: var(--gold-light); }

          .card-features { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
          .feature-item { display: flex; align-items: flex-start; gap: 8px; font-size: 0.88rem; line-height: 1.4; }
          .feature-icon { flex-shrink: 0; font-size: 1rem; }

          .card-tip {
            display: flex; align-items: flex-start; gap: 8px;
            margin-top: 16px; padding: 12px 14px;
            background: rgba(251, 191, 36, 0.08); border-radius: 12px;
            border-left: 3px solid var(--gold-main);
            font-size: 0.88rem; color: var(--gold-light); line-height: 1.5;
          }

          .tip-important {
            margin-top: 16px; padding: 14px 16px;
            background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(251,191,36,0.08));
            border: 1px solid rgba(251, 191, 36, 0.25);
            border-radius: 14px;
            font-size: 0.9rem; color: var(--text-bright); line-height: 1.6;
            position: relative;
          }
          .tip-important strong { color: var(--gold-main); }
          .tip-important-icon { font-size: 1.2rem; margin-right: 6px; }

          .search-hint { font-size: 0.82rem; color: var(--text-muted); margin-top: 8px; }
          .search-hint span { color: var(--text-main); font-weight: 500; }

          .obs-box {
            margin-top: 18px; padding: 18px 18px 16px;
            background: linear-gradient(135deg, rgba(251,191,36,0.12), rgba(239,68,68,0.06));
            border: 2px solid rgba(251, 191, 36, 0.3);
            border-radius: 16px;
            font-size: 0.9rem; color: var(--text-bright); line-height: 1.65;
            position: relative; overflow: hidden;
            animation: obsGlow 3s ease-in-out infinite;
          }
          @keyframes obsGlow {
            0%, 100% { border-color: rgba(251, 191, 36, 0.3); }
            50% { border-color: rgba(251, 191, 36, 0.5); }
          }
          .obs-box::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, var(--gold-main), #ef4444, var(--gold-main));
          }
          .obs-header {
            display: flex; align-items: center; gap: 8px;
            margin-bottom: 10px;
            font-size: 0.8rem; letter-spacing: 1.5px; text-transform: uppercase;
            color: var(--gold-main);
          }
          .obs-icon { font-size: 1.3rem; }

          .levels-box {
            margin-top: 18px; padding: 18px;
            background: rgba(251, 191, 36, 0.06);
            border: 1px solid rgba(251, 191, 36, 0.2);
            border-radius: 16px;
          }
          .levels-title {
            font-size: 0.78rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 2px;
            color: var(--gold-main); margin-bottom: 14px;
            text-align: center;
          }
          .levels-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
          }
          .level-item {
            text-align: center;
            padding: 14px 10px;
            border-radius: 14px;
            border: 2px solid;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .level-item:hover { transform: translateY(-3px); }
          .level-item::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 3px;
          }
          .level-1 {
            background: rgba(52, 211, 153, 0.08);
            border-color: rgba(52, 211, 153, 0.3);
          }
          .level-1::before { background: var(--green-accent); }
          .level-1 .level-number { color: var(--green-accent); }
          .level-1:hover { box-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }

          .level-2 {
            background: rgba(96, 165, 250, 0.08);
            border-color: rgba(96, 165, 250, 0.3);
          }
          .level-2::before { background: var(--blue-accent); }
          .level-2 .level-number { color: var(--blue-accent); }
          .level-2:hover { box-shadow: 0 0 20px rgba(96, 165, 250, 0.2); }

          .level-3 {
            background: rgba(167, 139, 250, 0.08);
            border-color: rgba(167, 139, 250, 0.3);
          }
          .level-3::before { background: var(--purple-accent); }
          .level-3 .level-number { color: var(--purple-accent); }
          .level-3:hover { box-shadow: 0 0 20px rgba(167, 139, 250, 0.2); }

          .level-number {
            font-size: 0.72rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 2px;
            margin-bottom: 4px;
          }
          .level-grades {
            font-size: 0.95rem; font-weight: 600;
            color: var(--text-bright);
          }
          .levels-hint {
            text-align: center;
            margin-top: 12px;
            font-size: 0.84rem;
            color: var(--gold-light);
            font-weight: 500;
          }

          .video-container { margin-top: 18px; border-radius: 14px; overflow: hidden; border: 2px solid rgba(34, 211, 238, 0.2); box-shadow: 0 0 20px rgba(34, 211, 238, 0.1); position: relative; background: #000; }
          .video-container::before { content: ''; display: block; padding-top: 56.25%; }
          .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          .video-label { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 0.8rem; color: var(--text-muted); }
          .video-label-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255, 0, 0, 0.15); color: #ff4444; font-size: 0.65rem; }

          .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
          .section-header-icon { font-size: 1.3rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
          .section-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-bright); }
          .section-header p { font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

          .site-list { display: flex; flex-direction: column; gap: 12px; }
          .site-item { display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.25s ease; }
          .site-item:hover { background: rgba(255,255,255,0.06); }
          .site-icon { font-size: 1.6rem; flex-shrink: 0; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: rgba(255,255,255,0.05); }
          .site-info { flex: 1; }
          .site-name { font-weight: 600; font-size: 0.95rem; color: var(--text-bright); margin-bottom: 3px; }
          .site-name a { color: inherit; text-decoration: none; border-bottom: 1px dashed rgba(255,255,255,0.3); transition: all 0.2s; }
          .site-name a:hover { color: var(--gold-main); border-bottom-color: var(--gold-main); }
          .site-desc { font-size: 0.83rem; color: var(--text-muted); line-height: 1.4; }

          .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .why-item { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: rgba(52, 211, 153, 0.06); border: 1px solid rgba(52, 211, 153, 0.15); border-radius: 12px; font-size: 0.9rem; font-weight: 500; color: var(--green-accent); transition: all 0.25s; }
          .why-item:hover { background: rgba(52, 211, 153, 0.1); transform: translateX(4px); }

          .why-extra {
            margin-top: 16px; padding: 14px 16px;
            background: linear-gradient(135deg, rgba(52,211,153,0.08), rgba(96,165,250,0.06));
            border: 1px solid rgba(52, 211, 153, 0.2);
            border-radius: 14px;
            font-size: 0.88rem; color: var(--text-main); line-height: 1.6;
            border-left: 3px solid var(--green-accent);
          }
          .why-extra strong { color: var(--green-accent); }

          .challenge { text-align: center; padding: 32px 24px; background: linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02)); border: 2px dashed rgba(251, 191, 36, 0.25); border-radius: 20px; margin: 20px 0; }
          .challenge-icon { font-size: 2.4rem; display: block; margin-bottom: 10px; animation: sparkle 2s ease-in-out infinite; }
          @keyframes sparkle { 0%, 100% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(-10deg) scale(1.1); } 75% { transform: rotate(10deg) scale(1.05); } }
          .challenge h3 { font-size: 1.2rem; font-weight: 700; color: var(--gold-main); margin-bottom: 8px; }
          .challenge p { font-size: 0.95rem; font-weight: 300; }

          .yt-cat { margin-bottom: 20px; }
          .yt-cat-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--blue-accent); margin-bottom: 12px; padding: 4px 12px; background: rgba(96, 165, 250, 0.1); border-radius: 8px; }
          .yt-cat-label.olimp { color: var(--gold-main); background: rgba(251, 191, 36, 0.1); }
          .yt-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; margin-bottom: 8px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); transition: all 0.2s; }
          .yt-item:hover { background: rgba(255,255,255,0.05); }
          .yt-play { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255, 0, 0, 0.15); color: #ff4444; font-size: 0.9rem; flex-shrink: 0; }
          .yt-info { flex: 1; }
          .yt-name { font-weight: 600; font-size: 0.92rem; color: var(--text-bright); margin-bottom: 2px; }
          .yt-desc { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
          .yt-search { font-size: 0.76rem; color: var(--text-muted); margin-top: 4px; }
          .yt-search span { color: var(--text-main); }
          .bell-tip { text-align: center; padding: 16px; margin: 16px 0; font-size: 0.9rem; color: var(--text-muted); background: rgba(255,255,255,0.03); border-radius: 14px; }

          .footer { text-align: center; padding: 40px 20px 20px; }
          .footer-motto { font-size: 1.1rem; color: var(--gold-light); margin-bottom: 20px; font-weight: 600; }
          .footer-believe { font-size: 1rem; margin-bottom: 24px; }
          .footer-sign { font-size: 0.9rem; color: var(--text-muted); font-style: italic; line-height: 1.6; }
          .footer-name { font-weight: 600; color: var(--text-main); font-style: normal; }

          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .delay-1 { animation-delay: 0.1s; }
          .delay-15 { animation-delay: 0.15s; }
          .delay-2 { animation-delay: 0.2s; }
          .delay-25 { animation-delay: 0.25s; }
          .delay-3 { animation-delay: 0.3s; }
          .delay-4 { animation-delay: 0.4s; }
          .delay-5 { animation-delay: 0.5s; }
          .delay-6 { animation-delay: 0.6s; }
          .delay-7 { animation-delay: 0.7s; }

          @media (max-width: 500px) {
            .container { padding: 16px 12px 40px; }
            .card { padding: 22px 18px; }
            .card-obmep-king { padding: 28px 20px; }
            .card-featured, .card-trophy { padding: 26px 20px; }
            .card-features, .why-grid { grid-template-columns: 1fr; }
            .dream-scene { height: 380px; }
            .thought-cloud { width: 240px; height: 200px; top: 10px; }
            .cloud-body { width: 220px; height: 145px; top: 25px; left: 10px; border-radius: 70px; }
            .cloud-bump-1 { width: 100px; height: 85px; left: 20px; }
            .cloud-bump-2 { width: 120px; height: 95px; left: 65px; }
            .cloud-bump-3 { width: 85px; height: 75px; }
            .cloud-bump-4 { width: 80px; height: 68px; }
            .cloud-bump-5 { width: 75px; height: 65px; }
            .rocket-container { transform: translate(-50%, -50%) scale(0.85); }
            .zzz { margin-right: -135px; }
            .medal-trophy-big { font-size: 1.6rem; }
          }
        `}
      </style>
      <div className="container">

        <div className="dream-scene">
          <div className="thought-cloud">
            <div className="cloud-bump cloud-bump-1"></div>
            <div className="cloud-bump cloud-bump-2"></div>
            <div className="cloud-bump cloud-bump-3"></div>
            <div className="cloud-bump cloud-bump-4"></div>
            <div className="cloud-bump cloud-bump-5"></div>
            <div className="cloud-body">
              <span className="bubble-star">✦</span><span className="bubble-star">✦</span>
              <span className="bubble-star">★</span><span className="bubble-star">✦</span>
              <span className="bubble-star">✧</span><span className="bubble-star">✦</span>
              <span className="math-sym">π</span><span className="math-sym">∑</span>
              <span className="math-sym">∞</span><span className="math-sym">Δ</span>
              <div className="rocket-container">
                <div className="rocket">
                  <div className="rocket-nose"></div><div className="rocket-body"></div><div className="rocket-window"></div>
                  <div className="fin-left"></div><div className="fin-right"></div>
                  <div className="fire"><div className="flame flame-left"></div><div className="flame flame-center"></div><div className="flame flame-right"></div></div>
                  <div className="smoke"><div className="smoke-puff"></div><div className="smoke-puff"></div><div className="smoke-puff"></div></div>
                </div>
              </div>
            </div>
          </div>
          <div className="thought-dot thought-dot-1"></div>
          <div className="thought-dot thought-dot-2"></div>
          <div className="thought-dot thought-dot-3"></div>
          <div className="zzz"><span>✦</span><span>✧</span><span>💡</span></div>
          <div className="student-body">
            <div className="head"><div className="hair"></div><div className="eye-left"></div><div className="eye-right"></div><div className="smile"></div></div>
            <div className="torso"><div className="arm-left"></div><div className="arm-right"></div></div>
          </div>
          <div className="desk"></div><div className="book"></div><div className="pencil"></div>
          <div className="dream-label"><span>imaginando o futuro com a matemática</span></div>
        </div>

        <div className="hero-text">
          <h1>PARA QUEM DESEJA<br />VOAR ALTO!</h1>
          <p className="hero-subtitle"><span className="hero-star">⭐</span> Descubra até onde a Matemática pode levar você <span className="hero-star">⭐</span></p>
          <p className="hero-subtitle" style={{ marginTop: '10px', fontSize: '0.93rem', opacity: 0.85 }}>Se você quer melhorar suas notas, entender melhor os conteúdos ou se preparar para novos desafios, este é o seu ponto de partida.</p>
        </div>

        <div className="exam-date-banner">
          <div className="exam-date-pulse"></div>
          <div className="exam-date-content">
            <div className="exam-date-icon">📅</div>
            <div className="exam-date-label">FIQUE ATENTO — DATA DA PROVA!</div>
            <div className="exam-date-phase">1ª FASE DA OBMEP 2026</div>
            <div className="exam-date-day">09 DE JUNHO DE 2026</div>
            <div className="exam-date-local">📍 NA PRÓPRIA ESCOLA</div>
            <div className="exam-date-countdown">⏳ Comece a estudar AGORA — cada dia conta!</div>
          </div>
        </div>

        <div className="card card-obmep-king delay-1">
          <div className="card-icons">
            <span className="medal-trophy medal-trophy-big">🏅</span>
            <span className="medal-trophy medal-trophy-big">🏆</span>
            <span className="card-badge badge-king">👑 Comece Aqui</span>
            <span className="badge-number-one">Nº 1</span>
          </div>
          <h2 className="card-title">OBMEP — Olimpíada Brasileira de Matemática</h2>
          <p className="card-sub">O site oficial da maior olimpíada de Matemática do Brasil</p>
          <a href="http://www.obmep.org.br/" target="_blank" rel="noreferrer" className="card-link">👉 www.obmep.org.br — CLIQUE AQUI</a>
          <div className="card-features">
            <div className="feature-item"><span className="feature-icon">📝</span><span>Provas anteriores com gabarito</span></div>
            <div className="feature-item"><span className="feature-icon">✅</span><span>Soluções detalhadas passo a passo</span></div>
          </div>
          <div className="levels-box">
            <div className="levels-title">📊 NÍVEIS DA OBMEP</div>
            <div className="levels-grid">
              <div className="level-item level-1">
                <div className="level-number">NÍVEL 1</div>
                <div className="level-grades">6º e 7º anos</div>
              </div>
              <div className="level-item level-2">
                <div className="level-number">NÍVEL 2</div>
                <div className="level-grades">8º e 9º anos</div>
              </div>
              <div className="level-item level-3">
                <div className="level-number">NÍVEL 3</div>
                <div className="level-grades">Ensino Médio</div>
              </div>
            </div>
            <p className="levels-hint">🎯 Encontre o seu nível e comece a resolver as provas!</p>
          </div>

          <div className="tip-important">
            <span className="tip-important-icon">🚨</span>
            <strong>DICA DE OURO:</strong> Acesse o site e clique em <strong>"PROVAS E SOLUÇÕES"</strong>. Dê preferência aos estudos resolvendo questões da OBMEP — essa é a melhor forma de se preparar! Quanto mais questões você resolver, mais longe vai chegar.
          </div>

          <div className="card-tip">💡 Este é o ponto de partida para qualquer aluno que queira se destacar na OBMEP. Comece pelas provas do seu nível!</div>

          <div className="obs-box">
            <div className="obs-header">
              <span className="obs-icon">📢</span>
              <strong>OBSERVAÇÃO IMPORTANTE</strong>
            </div>
            <p>Na OBMEP, <strong>foque na resolução de problemas de provas anteriores!</strong> Essa é a estratégia mais eficiente para se preparar. Além disso, <strong>assistam videoaulas de resolução de questões de edições anteriores da OBMEP</strong> — ver como os problemas são resolvidos passo a passo ajuda a desenvolver o raciocínio lógico e a confiança para enfrentar novos desafios.</p>
            <p style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.85 }}>🔁 <em>Pratique → Erre → Aprenda → Repita. Esse é o caminho dos campeões!</em></p>
          </div>

          <p className="search-hint">🔎 Procure no Google: <span>OBMEP provas e soluções</span></p>
        </div>

        <div className="card card-featured delay-15">
          <div className="card-icons">
            <span className="medal-trophy">🥇</span>
            <span className="medal-trophy">🏆</span>
            <span className="card-badge badge-gold">🌟 Estude Aqui</span>
          </div>
          <h2 className="card-title">Portal da Matemática da OBMEP</h2>
          <p className="card-sub">Videoaulas e trilhas para reforçar seus estudos</p>
          <a href="https://portaldaobmep.impa.br" target="_blank" rel="noreferrer" className="card-link">👉 portaldaobmep.impa.br — CLIQUE AQUI</a>
          <div className="card-features">
            <div className="feature-item"><span className="feature-icon">📚</span><span>Videoaulas claras e objetivas</span></div>
            <div className="feature-item"><span className="feature-icon">🧠</span><span>Exercícios e desafios interativos</span></div>
            <div className="feature-item"><span className="feature-icon">📊</span><span>Simulados e trilhas por nível</span></div>
            <div className="feature-item"><span className="feature-icon">🎯</span><span>Do 6º ano ao Ensino Médio</span></div>
          </div>
          <div className="card-tip">💡 Perfeito para estudar para a OBMEP e reforçar os conteúdos das aulas.</div>
          <p className="search-hint">🔎 Procure no Google: <span>Portal da Matemática OBMEP</span></p>
        </div>

        <div className="card card-trophy delay-2">
          <div className="card-icons">
            <span className="medal-trophy">🥇</span>
            <span className="medal-trophy">🏆</span>
            <span className="card-badge badge-purple">🏆 Próximo Nível</span>
          </div>
          <h2 className="card-title">POTI — Polos Olímpicos de Treinamento Intensivo</h2>
          <p className="card-sub">Quer ir ainda mais longe? Este é o próximo passo!</p>
          <a href="https://poti.impa.br" target="_blank" rel="noreferrer" className="card-link" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>👉 poti.impa.br — CLIQUE AQUI</a>
          <div className="card-features">
            <div className="feature-item"><span className="feature-icon">🎯</span><span>Programa <strong>GRATUITO</strong> do IMPA</span></div>
            <div className="feature-item"><span className="feature-icon">📋</span><span>Material: iniciante ao avançado</span></div>
            <div className="feature-item"><span className="feature-icon">🧠</span><span>Treinamento oficial para olimpíadas</span></div>
            <div className="feature-item"><span className="feature-icon">🏅</span><span>Usado por medalhistas OBMEP/OBM</span></div>
          </div>
          <div className="card-tip">💡 Se você já estuda pelo Portal da OBMEP, o POTI é o caminho para se destacar de verdade!</div>
          <p className="search-hint">🔎 Procure no Google: <span>POTI IMPA</span></p>
        </div>

        <div className="divider"><span>✦</span></div>

        <div className="card delay-3">
          <div className="section-header">
            <div className="section-header-icon" style={{ background: 'rgba(96,165,250,0.1)' }}>📚</div>
            <div><h3>Explore Também</h3><p>Outros sites gratuitos</p></div>
          </div>
          <div className="site-list">
            <div className="site-item">
              <div className="site-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>🎓</div>
              <div className="site-info">
                <div className="site-name"><a href="https://pt.khanacademy.org" target="_blank" rel="noreferrer">Khan Academy</a></div>
                <div className="site-desc">Aprenda no seu ritmo com aulas e exercícios personalizados</div>
              </div>
            </div>
            <div className="site-item">
              <div className="site-icon" style={{ background: 'rgba(96,165,250,0.1)' }}>📊</div>
              <div className="site-info">
                <div className="site-name"><a href="https://www.geogebra.org" target="_blank" rel="noreferrer">GeoGebra</a></div>
                <div className="site-desc">Visualize a Matemática com gráficos e simulações interativas</div>
              </div>
            </div>
            <div className="site-item">
              <div className="site-icon" style={{ background: 'rgba(251,191,36,0.1)' }}>📖</div>
              <div className="site-info">
                <div className="site-name"><a href="https://www.somatematica.com.br" target="_blank" rel="noreferrer">Só Matemática</a></div>
                <div className="site-desc">Teoria, exercícios resolvidos e jogos do 6º ano ao Ensino Médio</div>
              </div>
            </div>
            <div className="site-item">
              <div className="site-icon" style={{ background: 'rgba(167,139,250,0.1)' }}>🔬</div>
              <div className="site-info">
                <div className="site-name"><a href="https://phet.colorado.edu/pt_BR/" target="_blank" rel="noreferrer">PhET Simulações</a></div>
                <div className="site-desc">Simulações interativas para "ver" a Matemática funcionando</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card delay-4">
          <div className="section-header">
            <div className="section-header-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>🌟</div>
            <div><h3>Por Que Vale a Pena?</h3></div>
          </div>
          <div className="why-grid">
            <div className="why-item">✔ Mais confiança na Matemática</div>
            <div className="why-item">✔ Melhor desempenho escolar</div>
            <div className="why-item">✔ Novas oportunidades acadêmicas</div>
            <div className="why-item">✔ Possíveis bolsas e conquistas</div>
            <div className="why-item">🧠 Desenvolve o raciocínio lógico</div>
            <div className="why-item">🎮 Está por trás dos jogos e tecnologia</div>
            <div className="why-item">💰 As profissões mais bem pagas usam Matemática</div>
            <div className="why-item">🚀 Abre portas para Engenharia, Medicina e TI</div>
            <div className="why-item">📱 Seu celular só existe graças à Matemática</div>
            <div className="why-item">🏆 Medalhistas OBMEP ganham bolsas de estudo</div>
            <div className="why-item">🌍 É uma linguagem universal — vale no mundo inteiro</div>
            <div className="why-item">🔓 Quem domina Matemática resolve qualquer problema</div>
          </div>
          <div className="why-extra">
            💡 <strong>Você sabia?</strong> Alunos premiados na OBMEP podem ganhar bolsas de Iniciação Científica, acesso a programas especiais do IMPA e até vantagens para entrar em universidades federais. A Matemática é o passaporte para o seu futuro!
          </div>
        </div>

        <div className="challenge delay-5">
          <span className="challenge-icon">✨</span>
          <h3>DESAFIO DA SEMANA</h3>
          <p>Entre no portal e assista a pelo menos uma aula!</p>
        </div>

        <div className="card delay-6">
          <div className="section-header">
            <div className="section-header-icon" style={{ background: 'rgba(255,0,0,0.1)' }}>🎬</div>
            <div><h3>Canais do YouTube Recomendados</h3></div>
          </div>
          <div className="yt-cat">
            <div className="yt-cat-label">📘 Para Reforço Escolar</div>
            <div className="yt-item"><div className="yt-play">▶</div><div className="yt-info"><div className="yt-name">Ferretto Matemática</div><div className="yt-desc">Aulas completas e organizadas por série — excelente didática.</div><div className="yt-search">🔎 Pesquise: <span>Ferretto Matemática</span></div></div></div>
            <div className="yt-item"><div className="yt-play">▶</div><div className="yt-info"><div className="yt-name">Gis com Giz</div><div className="yt-desc">Explicações claras e acolhedoras do fundamental ao médio.</div><div className="yt-search">🔎 Pesquise: <span>Gis com Giz</span></div></div></div>
            <div className="yt-item"><div className="yt-play">▶</div><div className="yt-info"><div className="yt-name">Equaciona Matemática</div><div className="yt-desc">Conteúdo do 6º ao 9º ano, bem estruturado e direto.</div><div className="yt-search">🔎 Pesquise: <span>Equaciona Matemática</span></div></div></div>
          </div>
          <div className="yt-cat">
            <div className="yt-cat-label olimp">🏅 Para OBMEP e Olimpíadas</div>
            <div className="yt-item"><div className="yt-play">▶</div><div className="yt-info"><div className="yt-name">Matemática Rio — Prof. Rafael Procopio</div><div className="yt-desc">Dicas de olimpíadas, curiosidades e desafios.</div><div className="yt-search">🔎 Pesquise: <span>Matemática Rio</span></div></div></div>
            <div className="yt-item"><div className="yt-play">▶</div><div className="yt-info"><div className="yt-name">Se Liga Nessa Matemática</div><div className="yt-desc">Resolução de provas da OBMEP passo a passo.</div><div className="yt-search">🔎 Pesquise: <span>Se Liga Nessa Matemática</span></div></div></div>
          </div>
          <div className="bell-tip">💡 Inscreva-se nos canais e ative o sininho 🔔 para não perder nenhuma aula!</div>
        </div>

        <footer className="footer delay-7">
          <p className="footer-motto">✨ Quanto mais você pratica, mais longe você chega! ✨</p>
          <p className="footer-believe">🙌 A escola acredita no seu potencial</p>
          <p className="footer-sign">Grato,<br /><span className="footer-name">Rangel — Vice-Diretor</span></p>
        </footer>

      </div>
    </>
  );
};

export default Obmep;