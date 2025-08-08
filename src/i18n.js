export const messages = {
  en: {
    welcome: 'Welcome back',
    agentsSubtitle: 'Build, test, and deploy your custom agents.',
    createAgent: 'Create Agent',
    noAgents: 'No agents created yet',
    clickToCreate: "Click 'Create Agent' to get started",
    statusPublished: 'Published',
    statusDraft: 'Draft',
    chats: 'Chats',
    noChats: 'No chats yet',
    selectChat: 'Select a chat to view',
    account: 'Account',
    profile: 'Profile',
    teamManagement: 'Team Management',
    dangerZone: 'Danger Zone',
    transferOwnership: 'Transfer Ownership',
    deleteAccount: 'Delete Account'
    // ...добавьте другие английские ключи
  },
  ru: {
    welcome: 'С возвращением',
    agentsSubtitle: 'Создавайте, тестируйте и развёртывайте своих агентов.',
    createAgent: 'Создать агента',
    noAgents: 'Агенты пока не созданы',
    clickToCreate: "Нажмите 'Создать агента', чтобы начать",
    statusPublished: 'Опубликован',
    statusDraft: 'Черновик',
    chats: 'Чаты',
    noChats: 'Пока нет чатов',
    selectChat: 'Выберите чат, чтобы просмотреть',
    account: 'Аккаунт',
    profile: 'Профиль',
    teamManagement: 'Управление командой',
    dangerZone: 'Опасная зона',
    transferOwnership: 'Передать владение',
    deleteAccount: 'Удалить аккаунт'
    // ...добавьте другие русские ключи
  }
}

// helper
export function t(lang, key) {
  return messages[lang][key] ?? messages.en[key] ?? key;
}
