import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import accountStore from '@/stores/accountStore'
import langStore from '@/stores/langStore'
import { showToast } from '@/stores/toastStore'

export function usePricing() {
  const router = useRouter()
  const t = langStore.t
  const plans = accountStore.state.plans
  const currentId = computed(() => accountStore.state.currentPlanId)
  const isUpdating = ref(false)
  const pendingId = ref(null)

  function goBack() {
    if (history.length > 1) router.back()
    else router.replace('/')
  }

  async function choose(id) {
    if (id === currentId.value || isUpdating.value) return
    isUpdating.value = true
    pendingId.value = id
    try {
      await accountStore.upgradeTo(id)
      showToast(t('planUpdated', { name: t(`plan.${id}`) }), 'success')
    } catch (e) {
      showToast(t('planUpdateFailed'), 'error')
    } finally {
      isUpdating.value = false
      pendingId.value = null
    }
  }

  return { plans, currentId, isUpdating, pendingId, goBack, choose, t }
}

export default usePricing
