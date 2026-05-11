import { CpModal } from '../../ui/components/CpModal.js';

export function createModalService() {
  const openModals = new Map();

  return {
    open(config = {}) {
      const id = config.id ?? 'cp-modal-' + Date.now();
      const modal = CpModal({
        id,
        title: config.title ?? '',
        body: config.body ?? '',
        footer: config.footer ?? ''
      });
      openModals.set(id, modal);
      return {
        id,
        close: () => {
          modal.close();
          openModals.delete(id);
        },
        el: modal.el
      };
    },
    close(id) {
      const modal = openModals.get(id);
      if (modal) {
        modal.close();
        openModals.delete(id);
      }
    }
  };
}
