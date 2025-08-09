import { reactive } from 'vue'

const state = reactive({
  operators: [
    { id: 'op1', name: 'Alice', online: true },
    { id: 'op2', name: 'Bob', online: true },
  ],
})

export const presenceStore = { state }
