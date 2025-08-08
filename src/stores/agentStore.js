import { reactive } from 'vue'

const state = reactive({
  manualApprove: false,
})

function setManualApprove(val) {
  state.manualApprove = !!val
}

export const agentStore = { state, setManualApprove }
