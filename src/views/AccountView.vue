<template>
  <div>
    <PageHeader
      :title="langStore.t('accountSettings')"
      :subtitle="langStore.t('manageProfileTeamBilling')"
    >
      <button class="btn-primary" @click="openInvite">
        <span class="material-icons-outlined mr-1">person_add</span>
        {{ langStore.t('inviteMember') }}
      </button>
    </PageHeader>
    <div class="px-10 space-y-8" v-if="account">
      <!-- Profile -->
      <section
        class="p-6 rounded-xl bg-secondary border border-default space-y-1"
      >
        <h2 class="text-xl font-semibold">
          {{ langStore.t('profileSection') }}
        </h2>
        <p>
          <strong>{{ langStore.t('name') }}:</strong> {{ (account && account.name) || '-' }}
        </p>
        <p>
          <strong>{{ langStore.t('email') }}:</strong> {{ (account && account.email) || '-' }}
        </p>
        <p class="flex items-center flex-wrap">
          <strong>{{ langStore.t('planLabel') }}:</strong>
          <span class="ml-1">{{ account.plan || 'N/A' }}</span>
          <router-link
            to="/account/plan"
            class="ml-3 text-sm font-semibold text-brand underline hover:text-brand/80"
          >
            {{ langStore.t('changePlan') || 'Change' }}
          </router-link>
        </p>
      </section>

      <!-- Plan & Tokens -->
      <section
        v-if="billingStore.state.loaded"
        class="p-6 rounded-xl bg-secondary border border-default space-y-2"
        data-testid="billing-card"
      >
        <h2 class="text-xl font-semibold">
          {{ langStore.t('billing.plan') }}
        </h2>
        <p class="font-medium">{{ billingStore.state.plan }}</p>
        <div>
          <div class="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              class="h-full bg-brand"
              :style="{ width: billingStore.tokenPct() + '%' }"
            ></div>
          </div>
          <p class="text-sm mt-1">
            {{
              langStore
                .t('billing.usedOf')
                .replace('{used}', billingStore.state.tokenUsed.toLocaleString())
                .replace('{quota}', billingStore.state.tokenQuota.toLocaleString())
            }}
            <span v-if="billingStore.state.period">
              —
              {{
                langStore
                  .t('billing.resets')
                  .replace(
                    '{date}',
                    new Date(billingStore.state.period.end).toLocaleDateString(),
                  )
              }}
            </span>
          </p>
        </div>
      </section>

      <!-- Team management -->
      <section class="p-6 rounded-xl bg-secondary border border-default">
        <h2 class="text-xl font-semibold mb-4">
          {{ langStore.t('teamManagementSection') }}
        </h2>
        <div class="flex items-center mb-4">
          <WorkspaceSwitcher class="flex-1 mr-2" />
          <button
            class="btn-primary h-11 rounded-full px-6 font-semibold flex items-center"
            @click="confirmAddWs"
          >
            <span class="material-icons-outlined mr-1">add</span>
            {{ langStore.t('addWorkspace') || 'Add workspace' }}
          </button>
        </div>
        <div v-if="account.team && account.team.length > 0">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-default">
              <tr>
                <th class="px-4 py-3">{{ langStore.t('name') }}</th>
                <th class="px-4 py-3">{{ langStore.t('email') }}</th>
                <th class="px-4 py-3">{{ langStore.t('role') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y border-default">
              <tr v-for="member in account.team" :key="member.id">
                <td class="px-4 py-3">{{ member.name }}</td>
                <td class="px-4 py-3 text-muted">{{ member.email }}</td>
                <td class="px-4 py-3">
                  <!-- Handle different member states/roles -->
                  <template v-if="member.status === 'invited'">
                    <span
                      class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full mr-2"
                      style="
                        background-color: rgba(253, 230, 138, 0.5);
                        color: #92400e;
                      "
                    >
                      {{ langStore.t('pendingInvitation') }}
                    </span>
                    <button
                      @click="cancelInvite(member)"
                      class="text-red-600 hover:underline"
                      :title="langStore.t('cancelInvite')"
                    >
                      &times;
                    </button>
                  </template>
                  <template v-else-if="member.role === 'Owner'">
                    <span
                      class="inline-flex items-center h-10 px-3 rounded-lg border border-transparent"
                    >
                      {{ langStore.t('owner') }}
                    </span>
                  </template>
                  <template v-else>
                    <select
                      v-model="member.role"
                      @change="updateRole(member)"
                      class="form-input"
                    >
                      <option value="Admin">{{ langStore.t('admin') }}</option>
                      <option value="Operator">
                        {{ langStore.t('operator') }}
                      </option>
                      <option value="Read-only">
                        {{ langStore.t('readOnly') }}
                      </option>
                    </select>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted">{{ langStore.t('noTeamMembers') }}</div>
      </section>

      <!-- Danger Zone -->
      <section class="p-6 rounded-xl bg-secondary border border-default">
        <button
          class="flex justify-between items-center w-full text-left"
          @click="dangerOpen = !dangerOpen"
          :aria-expanded="dangerOpen.toString()"
          aria-controls="danger-zone-content"
        >
          <h2 class="text-xl font-semibold text-red-600">
            {{ langStore.t('dangerZoneSection') }}
          </h2>
          <span
            class="material-icons transition-transform"
            :class="{ 'rotate-90': dangerOpen }"
            >chevron_right</span
          >
        </button>
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-40 opacity-100"
          leave-from-class="max-h-40 opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div
            v-show="dangerOpen"
            id="danger-zone-content"
            class="mt-5 space-y-6"
          >
            <button class="btn-secondary" @click="transferOwnership">
              {{ langStore.t('transferOwnershipAction') }}
            </button>
            <button class="btn-danger" @click="deleteAccount">
              {{ langStore.t('deleteAccountAction') }}
            </button>
          </div>
        </transition>
      </section>

      <!-- Logout button -->
      <section class="p-6 rounded-xl bg-secondary border border-default">
        <button class="btn-secondary" @click="attemptLogout">
          <span class="material-icons-outlined mr-1">logout</span>
          {{ langStore.t('logout') }}
        </button>
      </section>
    </div>
    <ConfirmDialog
      v-if="dialog"
      v-bind="dialog"
      @confirm="dialog.onConfirm"
      @cancel="dialog = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import { sidePanelStore } from '@/stores/sidePanelStore'
import InviteMemberForm from '@/components/InviteMemberForm.vue'
import { showToast } from '@/stores/toastStore'
import langStore from '@/stores/langStore.js'
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { workspaceStore } from '@/stores/workspaceStore'
import billingStore from '@/stores/billingStore.js'
import { orchestratedLogout, getLogoutRisk } from '@/stores/logout.js'

const account = ref({ name: '', email: '', plan: '', team: [] })
const dangerOpen = ref(false)
const dialog = ref(null)

async function fetchAccount() {
  try {
    const res = await apiClient.get('/account')
    account.value = res.data
  } catch (e) {
    console.error(e)
  }
}
onMounted(fetchAccount)

function openInvite() {
  sidePanelStore.open(InviteMemberForm, { onSaveSuccess: fetchAccount })
}

function confirmAddWs() {
  dialog.value = {
    title: 'Создать новый workspace?',
    body: 'Его можно будет удалить позже.',
    confirmLabel: 'Создать',
    cancelLabel: 'Отмена',
    onConfirm: () => {
      workspaceStore.createWorkspace(prompt('Название workspace') || undefined)
      dialog.value = null
    },
  }
}
async function updateRole(member) {
  try {
    await apiClient.patch(`/account/team/${member.id}`, { role: member.role })
    showToast(langStore.t('roleUpdated'), 'success')
  } catch (e) {
    showToast(langStore.t('roleUpdateFailed'), 'error')
  }
}
async function cancelInvite(member) {
  try {
    await apiClient.delete(`/account/team/${member.id}`)
    await fetchAccount()
    showToast(langStore.t('invitationCancelled'), 'success')
  } catch (e) {
    showToast(langStore.t('invitationCancelFailed'), 'error')
  }
}
async function deleteAccount() {
  // Ask for confirmation using translated message
  if (confirm(langStore.t('deleteAccountConfirm'))) {
    try {
      await apiClient.delete('/account')
      showToast(langStore.t('accountDeletedMsg'), 'success')
    } catch (e) {
      showToast(langStore.t('accountDeleteFailed'), 'error')
    }
  }
}
function transferOwnership() {
  // Use a toast for consistency to announce upcoming feature rather than alert.
  showToast(langStore.t('transferComingSoon'), 'info')
}

// Log the user out by clearing stored state and redirecting to the login page
function attemptLogout() {
  const { controlCount, draftCount } = getLogoutRisk()
  if (controlCount || draftCount) {
    const parts = []
    if (controlCount)
      parts.push(
        langStore
          .t('logoutHoldChats')
          .replace('{n}', String(controlCount)),
      )
    if (draftCount)
      parts.push(
        langStore
          .t('logoutDrafts')
          .replace('{n}', String(draftCount)),
      )
    dialog.value = {
      title: langStore.t('logoutConfirmTitle'),
      body: parts.join('\n'),
      confirmLabel: langStore.t('yes'),
      cancelLabel: langStore.t('no'),
      onConfirm: () => {
        dialog.value = null
        orchestratedLogout()
      },
    }
  } else {
    orchestratedLogout()
  }
}
</script>

<style scoped>
.text-muted {
  color: var(--c-text-secondary);
}
.bg-secondary {
  background-color: var(--c-bg-secondary);
}
.border-default {
  border-color: var(--c-border);
}
.form-input {
  @apply w-full p-2.5 rounded-lg border;
  background-color: var(--c-bg-input, var(--c-bg-primary));
  border-color: var(--c-border);
}
.form-input:focus {
  @apply ring-2 border-transparent outline-none;
  --tw-ring-color: var(--c-text-brand);
}
</style>
