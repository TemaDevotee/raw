export const dict = {
  en: {
    autosave: 'Autosave',
    save: 'Save',
    load: 'Load',
    reset: 'Reset',
    export: 'Export',
    autosaveOn: 'Autosave enabled',
    autosaveOff: 'Autosave disabled',
    savedSnapshot: 'Snapshot saved',
    loadedSnapshot: 'Snapshot loaded',
    exported: 'Exported'
  },
  ru: {
    autosave: 'Автосохранение',
    save: 'Сохранить',
    load: 'Загрузить',
    reset: 'Сброс',
    export: 'Экспорт',
    autosaveOn: 'Автосохранение включено',
    autosaveOff: 'Автосохранение выключено',
    savedSnapshot: 'Снапшот сохранён',
    loadedSnapshot: 'Снапшот загружен',
    exported: 'Экспортировано'
  }
};

export function t(lang, key) {
  return dict[lang]?.[key] || key;
}
