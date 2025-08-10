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
    selectChat: 'Search by customer, ID, agent',
    account: 'Account',
    profile: 'Profile',
    teamManagement: 'Team Management',
    dangerZone: 'Danger Zone',
    transferOwnership: 'Transfer Ownership',
    deleteAccount: 'Delete Account',
    created: 'Created',
    theme: 'Theme',
    language: 'Language',
    langEnglish: 'English',
    langRussian: 'Russian',
    controls: {
      interfere: 'Interfere',
      return: 'Return to agent',
      changeStatus: 'Change status'
    },
    composer: {
      placeholder: {
        locked: 'Agent in control. Interfere to reply.'
      }
    },
    chat: {
      heldByOther: 'In control by {name}'
    },
    statusAttention: 'Attention',
    statusLive: 'Live',
    statusPaused: 'Paused',
    statusResolved: 'Resolved',
    statusEnded: 'Ended',
    statusIdle: 'Idle',
    status: {
      live: 'Live',
      attention: 'Attention',
      paused: 'Paused',
      resolved: 'Resolved',
      idle: 'Idle'
    },
    agent: {
      notFoundTitle: 'Agent not found',
      backToList: 'Back to list'
    },
    knowledge: {
      add: 'Add',
      drawerTitle: 'Create collection',
      name: 'Name',
      description: 'Description',
      visibility: 'Visibility',
      private: 'Private',
      workspace: 'Workspace',
      create: 'Create',
      empty: 'No sources yet'
    },
    sidebar: {
      expand: 'Expand sidebar',
      collapse: 'Collapse sidebar'
    },
    workspaces: 'Workspaces',
    createWorkspace: 'Create workspace',
    renameWorkspace: 'Rename workspace',
    deleteWorkspace: 'Delete workspace',
    sla: {
      title: 'SLA',
      remaining: 'SLA: {time} remaining',
      breached: 'SLA time exceeded',
      mmss: '{mm}:{ss}',
    },
    assign: {
      assignedTo: 'Assigned to {name}',
      unassigned: 'Unassigned',
      claim: 'Claim chat',
      unassign: 'Unassign',
      transfer: 'Transfer to…',
      toMe: 'Assigned to me',
      cannotInterfere: 'Assigned to {name}',
      transferredTo: 'Transferred to {name}',
      claimed: 'You claimed this chat',
      unassignedToast: 'Chat unassigned',
    },
    autoReturn: {
      title: 'Auto-return',
      warn: 'Returning control to agent in 60s',
      cancel: 'Cancel',
      returned: 'Control returned to agent',
    },
    tokens: {
      quota: 'Tokens',
      usedOf: '{used} of {included}',
      left: '{left} left',
      purchase: 'Buy tokens',
      purchased: 'Purchased {count} tokens',
      estimate: '\u2248 {count} tok',
      messageUsed: '{count} tok',
      periodResets: 'Resets {date}',
      analytics: 'Usage analytics',
      byChat: 'By chat',
      byAgent: 'By agent',
      total: 'Total',
      avgPerMsg: 'Avg / msg',
    },
    presence: {
      participants: 'Participants',
      more: '+{count}',
    },
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
    selectChat: 'Поиск по клиенту, ID, агенту',
    account: 'Аккаунт',
    profile: 'Профиль',
    teamManagement: 'Управление командой',
    dangerZone: 'Опасная зона',
    transferOwnership: 'Передать владение',
    deleteAccount: 'Удалить аккаунт',
    created: 'Создано',
    theme: 'Тема',
    language: 'Язык',
    langEnglish: 'Английский',
    langRussian: 'Русский',
    controls: {
      interfere: 'Вмешаться',
      return: 'Вернуть агенту',
      changeStatus: 'Изменить статус'
    },
    composer: {
      placeholder: {
        locked: 'Агент отвечает. Вмешайтесь, чтобы писать.'
      }
    },
    chat: {
      heldByOther: 'В чате уже работает {name}'
    },
    statusAttention: 'Требует внимания',
    statusLive: 'Активен',
    statusPaused: 'На паузе',
    statusResolved: 'Решён',
    statusEnded: 'Завершён',
    statusIdle: 'Неактивен',
    status: {
      live: 'В эфире',
      attention: 'Требует внимания',
      paused: 'На паузе',
      resolved: 'Решён',
      idle: 'Неактивен'
    },
    agent: {
      notFoundTitle: 'Агент не найден',
      backToList: 'Назад к списку'
    },
    knowledge: {
      add: 'Добавить',
      drawerTitle: 'Новая коллекция',
      name: 'Название',
      description: 'Описание',
      visibility: 'Доступ',
      private: 'Личный',
      workspace: 'В воркспейсе',
      create: 'Создать',
      empty: 'Источников пока нет'
    },
    sidebar: {
      expand: 'Развернуть сайдбар',
      collapse: 'Свернуть сайдбар'
    },
    workspaces: 'Рабочие пространства',
    createWorkspace: 'Создать пространство',
    renameWorkspace: 'Переименовать пространство',
    deleteWorkspace: 'Удалить пространство',
    sla: {
      title: 'SLA',
      remaining: 'SLA: осталось {time}',
      breached: 'Превышено время SLA',
      mmss: '{mm}:{ss}',
    },
    assign: {
      assignedTo: 'Назначено: {name}',
      unassigned: 'Не назначен',
      claim: 'Назначить на себя',
      unassign: 'Снять назначение',
      transfer: 'Передать…',
      toMe: 'Назначены мне',
      cannotInterfere: 'Назначено: {name}',
      transferredTo: 'Передано: {name}',
      claimed: 'Чат назначен на вас',
      unassignedToast: 'Назначение снято',
    },
    autoReturn: {
      title: 'Автовозврат',
      warn: 'Через 60 сек управление вернётся агенту',
      cancel: 'Отмена',
      returned: 'Управление возвращено агенту',
    },
    tokens: {
      quota: 'Токены',
      usedOf: '{used} из {included}',
      left: 'осталось {left}',
      purchase: 'Купить токены',
      purchased: 'Куплено {count} токенов',
      estimate: '\u2248 {count} ток',
      messageUsed: '{count} ток',
      periodResets: 'Сброс {date}',
      analytics: 'Аналитика расхода',
      byChat: 'По чатам',
      byAgent: 'По агентам',
      total: 'Итого',
      avgPerMsg: 'Средн. / сообщение',
    },
    presence: {
      participants: 'Участники',
      more: '+{count}',
    },
    // ...добавьте другие русские ключи
  }
}

// helper
export function t(lang, key) {
  return messages[lang][key] ?? messages.en[key] ?? key;
}
