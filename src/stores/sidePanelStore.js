import { reactive } from 'vue';

export const sidePanelStore = reactive({
  isOpen: false,
  view: null,
  props: {},
  /**
   * Optional callback invoked before closing the side panel.  Components
   * can assign a function to this property (e.g. to prompt the user when
   * there are unsaved changes).  If the callback returns false or a
   * promise that resolves to false, the panel will not close.
   */
  beforeClose: null,
  open(view, props = {}) {
    this.view = view;
    this.props = props;
    this.isOpen = true;
  },
  async close() {
    // If a beforeClose hook is defined, call it.  If it returns false
    // (synchronously or via a Promise), abort closing.  This allows
    // components to intercept the close (e.g. unsaved changes prompt).
    if (this.beforeClose) {
      try {
        const result = await this.beforeClose();
        if (result === false) {
          return;
        }
      } catch (e) {
        // If the hook throws, still abort closing to avoid losing data
        console.error('Error in beforeClose hook', e);
        return;
      }
    }
    this.isOpen = false;
    // Reset view and props after the panel transition finishes (300ms)
    setTimeout(() => {
      this.view = null;
      this.props = {};
      this.beforeClose = null;
    }, 300);
  },
});
