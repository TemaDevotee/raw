import { reactive } from 'vue'

export const uiStore = reactive({
  isCollapsed: localStorage.getItem('app.ui.sidebar.collapsed') === '1',
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed
    localStorage.setItem('app.ui.sidebar.collapsed', this.isCollapsed ? '1' : '0')
  }
})

export default uiStore
