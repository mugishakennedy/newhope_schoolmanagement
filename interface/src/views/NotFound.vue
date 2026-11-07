<script setup>
import { ArrowLeft } from 'lucide-vue-next'
</script>

<template>
  <div class="notfound">
    <div class="orb orb-a" aria-hidden="true" />
    <div class="orb orb-b" aria-hidden="true" />
    <div class="notfound-card card">
      <span class="code">404</span>
      <h1>Page not found</h1>
      <p>
        This page may have moved or never existed. Let's get you back on track.
      </p>
      <div class="actions">
        <router-link to="/" class="btn btn-primary">
          <ArrowLeft :size="16" />
          Go home
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notfound {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.4;
}

.orb-a {
  width: 320px;
  height: 320px;
  top: -120px;
  right: -80px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent 68%);
}

.orb-b {
  width: 300px;
  height: 300px;
  bottom: -120px;
  left: -70px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.4), transparent 68%);
}

.notfound-card {
  position: relative;
  text-align: center;
  padding: 44px 34px;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.code {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-700);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 18px 0 10px;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

p {
  color: var(--muted);
  line-height: 1.6;
}

.actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
