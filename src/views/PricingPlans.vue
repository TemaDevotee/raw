<template>
  <div
    class="min-h-screen bg-gradient-to-br from-[#111827] to-[#0F172A] py-16 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between mb-6">
  <button @click="$router.back()" class="rounded-full border border-white/30 text-white px-4 py-2 text-sm hover:bg-white/10">
    {{ $t('back') || 'Back' }}
  </button>
</div>
<h2
      class="text-center text-4xl font-extrabold tracking-tight text-white mb-14"
    >
      {{ $t('choosePlan') || 'Choose Your Plan' }}
    </h2>
    <div
      class="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="relative rounded-3xl shadow-lg overflow-hidden flex flex-col bg-gradient-to-br group"
        :class="plan.gradient"
      >
        <!-- Header -->
        <div class="p-6 pb-4 text-white">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-bold">{{ plan.name }}</h3>
            <span
              v-if="plan.label"
              class="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-sm"
            >
              {{ plan.label }}
            </span>
            <span
              v-else-if="plan.badge"
              class="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-sm"
            >
              {{ plan.badge }}
            </span>
          </div>
          <p v-if="plan.priceMonthly" class="mt-6 text-4xl font-extrabold">
            <span class="align-top text-base font-medium mr-1">$</span>
            {{ plan.priceMonthly }}
            <span class="ml-1 text-base font-medium">/mo</span>
          </p>
          <p v-else class="mt-6 text-3xl font-extrabold">{{ $t('letsTalk') || "Let's Talk" }}</p>
          <p v-if="plan.priceYearly" class="mt-1 text-sm text-white/70">
            {{ $t('or') || 'or' }} ${{ plan.priceYearly }} / {{ $t('yr') || 'yr' }}
          </p>
        </div>
        <!-- Features -->
        <ul class="space-y-3 bg-white/5 backdrop-blur-lg p-6 text-sm text-white grow">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-start gap-2"
          >
            <span class="material-icons text-lg mt-0.5">check_circle</span>
            <span>{{ feature }}</span>
          </li>
        </ul>
        <!-- CTA -->
        <div class="p-6 bg-white/10 backdrop-blur-lg">
          <button
            :disabled="selectedPlan === plan.name"
            @click="selectPlan(plan)"
            class="w-full rounded-xl bg-white/20 py-2 font-semibold text-white hover:bg-white/30 transition disabled:opacity-60 disabled:pointer-events-none"
          >
            <span v-if="selectedPlan === plan.name">
              {{ $t('currentPlan') || 'Current Plan' }}
            </span>
            <span v-else>{{ plan.cta }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api';
import { showToast } from '@/stores/toastStore';
import langStore from '@/stores/langStore.js';

// Localised text helper
const $t = langStore.t;

// Pricing definition.  See pricing_plans.jsx for source.  Each plan
// defines a monthly and yearly price, optional badge or label,
// features and a call to action.
const plans = [
  {
    name: 'Free',
    priceMonthly: '0',
    priceYearly: null,
    gradient: 'from-gray-700 to-gray-800',
    label: $t('yourPlan') || 'Your Plan',
    features: ['1 user', '100 MB storage', '100 tokens', '100 clients'],
    cta: $t('selectThisPlan') || 'Select This Plan',
  },
  {
    name: 'Fine',
    priceMonthly: '11',
    priceYearly: '111',
    gradient: 'from-green-400 to-emerald-500',
    badge: $t('mostPopular') || 'Most Popular',
    features: ['1 user', '1 GB storage', '1 000 tokens', '1 000 clients'],
    cta: $t('selectThisPlan') || 'Select This Plan',
  },
  {
    name: 'Superior',
    priceMonthly: '33',
    priceYearly: '333',
    gradient: 'from-sky-400 to-indigo-400',
    features: ['5 users', '5 GB storage', '5 000 tokens', '5 000 clients'],
    cta: $t('selectThisPlan') || 'Select This Plan',
  },
  {
    name: 'Epic',
    priceMonthly: '55',
    priceYearly: '555',
    gradient: 'from-violet-400 to-purple-500',
    features: ['25 users', '25 GB storage', '25 000 tokens', '25 000 clients'],
    cta: $t('selectThisPlan') || 'Select This Plan',
  },
  {
    name: 'Legendary',
    priceMonthly: null,
    priceYearly: null,
    gradient: 'from-yellow-400 to-amber-300',
    features: [
      'Unlimited users',
      '100 GB storage',
      '100 000 tokens',
      'Unlimited clients',
    ],
    cta: $t('contactUs') || 'Contact Us',
  },
];

// Track the currently active plan to disable its CTA
const selectedPlan = ref('');

async function fetchAccount() {
  try {
    const res = await apiClient.get('/account');
    selectedPlan.value = res.data.plan || '';
  } catch (e) {
    // errors handled by apiClient
  }
}

async function selectPlan(plan) {
  // Don't do anything if it's already selected
  if (selectedPlan.value === plan.name) return;
  try {
    await apiClient.post('/account/upgrade', { plan: plan.name });
    selectedPlan.value = plan.name;
    showToast($t('planUpgraded') || 'Plan updated successfully', 'success');
  } catch (e) {
    // errors handled by apiClient
  }
}

onMounted(fetchAccount);
</script>

<style scoped>
/* Animate cards on hover and on scroll.  Cards scale up slightly and
   the shadow lifts on hover.  Respect reduced motion preferences. */
.group:hover {
  transform: scale(1.02);
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
}
@media (prefers-reduced-motion: reduce) {
  .group:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>