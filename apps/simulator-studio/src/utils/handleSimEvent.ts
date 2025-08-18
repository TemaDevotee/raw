import { SimEvent } from '@/stores/simulatorStore';
import { useChatsStore } from '@/stores/chats';

export default function handleSimEvent(evt: SimEvent) {
  const chats = useChatsStore();
  switch (evt.type) {
    case 'presence.join': {
      const chat = chats.byId[evt.payload.chatId];
      if (chat && !chat.presence.operators.includes(evt.payload.userId)) {
        chat.presence.operators.push(evt.payload.userId);
      }
      break;
    }
    case 'presence.leave': {
      const chat = chats.byId[evt.payload.chatId];
      if (chat) {
        chat.presence.operators = chat.presence.operators.filter((o) => o !== evt.payload.userId);
      }
      break;
    }
    case 'chat.message':
    case 'chat.message.draft': {
      const m = evt.payload;
      const t = chats.transcript[m.chatId] || { items: [], lastCursor: null };
      const idx = t.items.findIndex((x) => x.id === m.id);
      if (idx === -1) t.items.push(m);
      else t.items[idx] = m;
      t.lastCursor = m.cursor;
      t.items.sort((a, b) => a.ts - b.ts);
      chats.transcript[m.chatId] = t;
      break;
    }
    case 'chat.status.update': {
      const chat = chats.byId[evt.payload.chatId];
      if (chat) chat.status = evt.payload.status;
      const idx = chats.list.findIndex((c) => c.id === evt.payload.chatId);
      if (idx !== -1) chats.list[idx].status = evt.payload.status;
      break;
    }
    case 'chat.control': {
      const chat = chats.byId[evt.payload.chatId];
      if (chat) chat.control = evt.payload.control;
      const idx = chats.list.findIndex((c) => c.id === evt.payload.chatId);
      if (idx !== -1) chats.list[idx].control = evt.payload.control;
      break;
    }
    default:
      break;
  }
}
