<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block mb-1 text-sm">{{ t('knowledgeQuestion') }}</label>
      <textarea v-model="question" class="w-full border rounded p-2" rows="2" />
    </div>
    <div>
      <label class="block mb-1 text-sm">{{ t('knowledgeAnswer') }}</label>
      <textarea v-model="answer" class="w-full border rounded p-2" rows="3" />
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" class="btn-secondary" @click="$emit('close')">{{ t('commonCancel') }}</button>
      <button type="submit" class="btn-primary" :disabled="!valid">{{ t('knowledgeAddEntry') }}</button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { knowledgeStore } from '@/stores/knowledgeStore'
import langStore from '@/stores/langStore'

const props = defineProps({
  collectionId: String,
})
const emit = defineEmits(['added', 'close'])

const t = langStore.t
const question = ref('')
const answer = ref('')
const valid = computed(() => question.value.trim() && answer.value.trim())

async function submit() {
  await knowledgeStore.addQASource(props.collectionId, question.value, answer.value)
  emit('added')
}
</script>
