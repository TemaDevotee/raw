# Agent Providers

The mock backend ships with pluggable providers used by the agent runner.  By default the lightweight **Mock** provider is used.  When an `OPENAI_API_KEY` is present the **OpenAI** provider can be selected per chat.

## Environment variables

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | enables the OpenAI provider |
| `OPENAI_MODEL` | chat model (default `gpt-4o-mini`) |
| `OPENAI_MODEL_DEFAULT` | default model when saving settings |
| `OPENAI_BASE_URL` | optional API base |
| `PROVIDER_TIMEOUT_MS` | request timeout (default 60000) |

## Token accounting

Both providers return usage counters (`prompt` and `completion` tokens).  The runner deducts their sum from the tenant's billing quota and writes a `agent_usage` ledger entry.  A `usage` SSE event delivers `{inputTokens, outputTokens, totalTokens, estimated?}` after each run.

## Troubleshooting

- `quota_exceeded` – tenant has no remaining tokens; top up in the Billing tab.
- `provider_error` – the upstream provider failed; retry or check credentials. The Mock provider can simulate this by including `[[FAIL]]` in the system prompt.
- `cancelled` – generation was aborted via the Abort button.
