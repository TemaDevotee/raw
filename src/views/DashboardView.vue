<template>
  <div class="p-10">
    <div class="max-w-5xl mx-auto">
      <!-- Welcome header with link to account -->
      <header class="mb-12 text-center">
        <h1 class="text-4xl font-bold">
          {{ langStore.t('welcome') }},
          <router-link
            to="/account"
            class="underline hover:text-[var(--c-text-brand)]"
            >{{ account.name }}</router-link
          >!
        </h1>
        <p class="text-lg text-muted mt-2">
          {{ langStore.t('dashboardSubtitle') }}
        </p>
      </header>

      <!-- Four cards for navigation -->
      <section class="grid gap-6 sm:grid-cols-2">
        <router-link to="/agents" class="nav-card">
          <div>
            <h3 class="nav-card-title">{{ langStore.t('navAgents') }}</h3>
            <p class="nav-card-sub">{{ langStore.t('navAgentsDesc') }}</p>
          </div>
          <span class="material-icons nav-arrow">arrow_forward</span>
        </router-link>
        <router-link to="/chats" class="nav-card">
          <div>
            <h3 class="nav-card-title">{{ langStore.t('navChats') }}</h3>
            <p class="nav-card-sub">{{ langStore.t('navChatsDesc') }}</p>
          </div>
          <span class="material-icons nav-arrow">arrow_forward</span>
        </router-link>
        <router-link to="/knowledge" class="nav-card">
          <div>
            <h3 class="nav-card-title">{{ langStore.t('navKnowledge') }}</h3>
            <p class="nav-card-sub">{{ langStore.t('navKnowledgeDesc') }}</p>
          </div>
          <span class="material-icons nav-arrow">arrow_forward</span>
        </router-link>
        <router-link to="/account" class="nav-card">
          <div>
            <h3 class="nav-card-title">{{ langStore.t('navAccount') }}</h3>
            <p class="nav-card-sub">{{ langStore.t('navAccountDesc') }}</p>
          </div>
          <span class="material-icons nav-arrow">arrow_forward</span>
        </router-link>
      </section>

      <!-- CTA card for first agent creation -->
      <div
        class="mt-10 p-6 text-center rounded-xl gradient-cta text-white font-semibold text-xl cursor-pointer shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1"
        @click="$router.push('/agents')"
      >
        {{ langStore.t('createFirstAgent') }}<br />
        <span class="text-sm font-normal">{{ langStore.t('createFirstAgentSubtitle') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api';
import langStore from '@/stores/langStore.js';

const account = ref({ name: 'User' });
onMounted(async () => {
  try {
    const response = await apiClient.get('/account');
    account.value = response.data;
  } catch (err) {
    console.error(err);
  }
});
</script>

<style scoped>
.text-muted {
  color: var(--c-text-secondary);
}

/* Card styling */
.nav-card {
  @apply relative flex justify-between items-start p-6 rounded-xl transition-all transform;
  background-color: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
}
.nav-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  border-color: var(--c-text-brand);
}
.nav-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--c-text-primary);
}
.nav-card-sub {
  font-size: 0.875rem;
  color: var(--c-text-secondary);
  margin-top: 0.25rem;
}
.nav-arrow {
  font-size: 1.75rem;
  color: var(--c-text-brand);
  transition: transform 0.2s ease;
}
.nav-card:hover .nav-arrow {
  transform: translateX(4px);
}

/* Gradient CTA (uses --c-text-brand and --c-bg-hover from themes) */
.gradient-cta {
  background-image: linear-gradient(90deg, var(--c-text-brand), var(--c-bg-hover));
}
</style>
