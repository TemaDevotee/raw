import { reactive } from 'vue';

export const messages = {
  en: {
    name: 'Name',
    email: 'Email',
    plan: 'Plan',
    tokens: 'Tokens',
    workspaces: 'Workspaces',
    agents: 'Agents',
    knowledge: 'Knowledge',
    chats: 'Chats'
  },
  ru: {
    name: 'Имя',
    email: 'Email',
    plan: 'План',
    tokens: 'Токены',
    workspaces: 'Воркспейсы',
    agents: 'Агенты',
    knowledge: 'Знания',
    chats: 'Чаты'
  }
};

export const lang = reactive({ value: 'en' });
export const t = (k) => messages[lang.value][k] || k;
