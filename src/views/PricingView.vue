<template>
  <div class="max-w-5xl mx-auto p-4">
    <button
      class="flex items-center text-sm mb-6 gap-1 hover:underline"
      @click="goBack"
    >
      <span class="material-icons text-base">arrow_back</span>
      {{ t('back') }}
    </button>
    <h1 class="text-2xl font-semibold mb-1">{{ t('plansTitle') }}</h1>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-8">
      {{ t('plansSubtitle') }}
    </p>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="relative rounded-xl border shadow-sm p-6 flex flex-col bg-white dark:bg-gray-800"
      >
        <h2 class="text-lg font-semibold mb-2">{{ t(plan.nameKey) }}</h2>
        <p class="text-2xl font-bold mb-4">
          {{ plan.priceText }}
          <span class="text-sm font-normal">{{ t(plan.periodKey) }}</span>
        </p>
        <ul class="mb-6 text-sm flex-1">
          <li v-for="feat in plan.features" :key="feat" class="flex items-center gap-2 mb-1">
            <span class="material-icons text-green-500 text-base">check</span>
            <span>{{ t(feat) }}</span>
          </li>
        </ul>
        <button
          class="mt-auto w-full rounded-md py-2 text-sm font-medium transition"
          :class="currentId === plan.id ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'"
          :disabled="isUpdating || currentId === plan.id"
          @click="choose(plan.id)"
        >
          <span v-if="currentId === plan.id">{{ t('currentPlan') }}</span>
          <span v-else>{{ t('choosePlan') }}</span>
        </button>
        <div
          v-if="isUpdating && pendingId === plan.id"
          class="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl text-white text-sm"
        >
          {{ t('updatingPlan') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePricing } from './pricingLogic'

const { plans, currentId, isUpdating, pendingId, goBack, choose, t } = usePricing()
</script>
