# Agent Runner

The mock backend includes a lightweight agent runner that generates draft replies for new user messages.

## Flow

1. When a user message arrives the runner emits `agent:state` and `agent:typing` events.
2. A mock provider generates text and stores it as a draft rather than publishing immediately.
3. When finished the runner emits `draft:created` and returns to `idle`.

## Controls

Simulator Studio exposes **Generate draft**, **Pause**, and **Resume** buttons on the Chat Console.  These call:

- `POST /admin/agents/:id/generate`
- `POST /admin/agents/:id/pause`
- `POST /admin/agents/:id/resume`

## Providers

The default provider is deterministic and emits a `Mock reply: <text>` draft.  Real providers can implement the same interface and be plugged in later.

## SSE Events

- `agent:state` `{ chatId, state }`
- `agent:typing` `{ chatId, step: 'start'|'stop' }`
- existing `draft:created` and `draft:removed` events notify clients of draft changes.

