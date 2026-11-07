<script setup>
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  TrendingUp,
} from 'lucide-vue-next'

import BrandMark from '@/components/BrandMark.vue'

defineProps({
  headline: {
    type: String,
    default: 'One calm place to run your entire school.',
  },
  description: {
    type: String,
    default:
      'Classes, teachers, assignments, submissions and grading — beautifully connected so your team can focus on learning.',
  },
})

const features = [
  'Role-aware dashboards for administration and students',
  'Live assignment tracking with deadlines and grading',
  'Instant insight into your school at a glance',
]
</script>

<template>
  <div class="auth-page">
    <section class="auth-visual">
      <div class="visual-grid" aria-hidden="true" />
      <div class="blob blob-a" aria-hidden="true" />
      <div class="blob blob-b" aria-hidden="true" />

      <header class="visual-top">
        <BrandMark light />
      </header>

      <div class="visual-content">
        <span class="eyebrow">
          <Sparkles :size="14" />
          NewHope digital campus
        </span>
        <h1>{{ headline }}</h1>
        <p class="visual-desc">{{ description }}</p>

        <ul class="features">
          <li v-for="feature in features" :key="feature">
            <CheckCircle2 :size="17" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <div class="visual-cards">
          <div class="glass-card card-progress">
            <div class="glass-head">
              <span class="glass-icon">
                <FileCheck2 :size="17" />
              </span>
              <div>
                <strong>Grading progress</strong>
                <small>Department overview</small>
              </div>
              <ArrowUpRight :size="16" class="glass-arrow" />
            </div>
            <div class="glass-progress">
              <span />
            </div>
            <div class="glass-foot">
              <span>82% reviewed</span>
              <span class="glass-trend">
                <TrendingUp :size="13" />
                +12%
              </span>
            </div>
          </div>

          <div class="glass-card card-verified">
            <span class="glass-icon success">
              <BadgeCheck :size="18" />
            </span>
            <div>
              <strong>Submissions verified</strong>
              <small>Real-time sync</small>
            </div>
          </div>
        </div>
      </div>

      <footer class="visual-footer">
        <span>NewHope School · Management Portal</span>
        <span>Built for focused teams</span>
      </footer>
    </section>

    <section class="auth-panel">
      <div class="auth-mobile-brand">
        <BrandMark />
      </div>
      <div class="auth-card">
        <slot />
      </div>
      <p class="auth-footnote">
        &copy; {{ new Date().getFullYear() }} NewHope School. All rights reserved.
      </p>
    </section>
  </div>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  min-height: 100vh;
}

.auth-visual {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 34px 48px 28px;
  color: #e2e8f0;
  background: linear-gradient(150deg, #090f21 0%, #0e1830 48%, #101f3d 100%);
}

.visual-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      rgba(148, 163, 184, 0.055) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(148, 163, 184, 0.055) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(circle at 35% 30%, #000 0%, transparent 78%);
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.6;
  pointer-events: none;
}

.blob-a {
  width: 420px;
  height: 420px;
  top: -140px;
  right: -100px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.55), transparent 68%);
}

.blob-b {
  width: 380px;
  height: 380px;
  bottom: -120px;
  left: -90px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.35), transparent 68%);
}

.visual-top {
  position: relative;
  z-index: 1;
}

.visual-content {
  position: relative;
  z-index: 1;
  margin: auto 0;
  padding: 40px 0;
  max-width: 540px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.14);
  border: 1px solid rgba(129, 140, 248, 0.26);
  color: #c7d2fe;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

h1 {
  color: #fff;
  font-size: clamp(2rem, 3.4vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.045em;
  margin: 22px 0 16px;
  font-weight: 800;
}

.visual-desc {
  color: #a8b6cc;
  font-size: 0.98rem;
  line-height: 1.65;
  max-width: 450px;
}

.features {
  list-style: none;
  margin: 26px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: #cbd5e1;
  font-weight: 500;
}

.features svg {
  color: #34d399;
  flex-shrink: 0;
}

.visual-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 38px;
}

.glass-card {
  border-radius: 17px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 50px -28px rgba(0, 0, 0, 0.7);
}

.card-progress {
  width: min(286px, 100%);
}

.glass-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.glass-head > div {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  flex: 1;
}

.glass-head strong,
.card-verified strong {
  font-size: 0.82rem;
  color: #f1f5f9;
  font-weight: 700;
}

.glass-head small,
.card-verified small {
  font-size: 0.68rem;
  color: #8fa1ba;
  margin-top: 2px;
}

.glass-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(129, 140, 248, 0.18);
  color: #c7d2fe;
  flex-shrink: 0;
}

.glass-icon.success {
  background: rgba(52, 211, 153, 0.16);
  color: #6ee7b7;
}

.glass-arrow {
  color: #818cf8;
}

.glass-progress {
  height: 7px;
  margin: 15px 0 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  overflow: hidden;
}

.glass-progress span {
  display: block;
  width: 82%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #818cf8, #38bdf8);
}

.glass-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 600;
}

.glass-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #6ee7b7;
}

.card-verified {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: flex-end;
}

.card-verified > div {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.visual-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.68rem;
  color: rgba(148, 163, 184, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 18px;
}

.auth-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px 28px;
  background: var(--bg);
  background-image: radial-gradient(
      circle at 90% 10%,
      rgba(79, 70, 229, 0.08),
      transparent 45%
    ),
    radial-gradient(circle at 10% 90%, rgba(14, 165, 233, 0.07), transparent 45%);
}

.auth-card {
  width: min(430px, 100%);
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: 24px;
  padding: 34px;
  box-shadow: 0 40px 90px -50px rgba(15, 23, 42, 0.45);
}

.auth-mobile-brand {
  display: none;
}

.auth-footnote {
  font-size: 0.7rem;
  color: var(--muted-2);
  text-align: center;
}

@media (max-width: 1024px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-visual {
    display: none;
  }

  .auth-panel {
    min-height: 100vh;
    padding: 26px 18px;
  }

  .auth-mobile-brand {
    display: block;
    margin-bottom: 2px;
  }
}

@media (max-width: 520px) {
  .auth-card {
    padding: 24px 20px;
    border-radius: 20px;
  }
}
</style>
