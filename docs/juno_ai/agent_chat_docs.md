# Agent Chat Module

## Scope

The Agent Chat module owns free-form conversational turns, live app context,
Gemini tool execution, and the Server-Sent Events contract used by clients.

Implementation:

- `agent_core/routers/chat.py`
- `agent_core/schemas/chat.py`
- `agent_core/schemas/context.py`
- `agent_core/services/context_assembler.py`
- `agent_core/gemini/`
- `agent_core/services/tools_exec.py`

## Endpoint

### `POST /agent/chat`

Starts one streaming assistant turn. The response content type is
`text/event-stream`.

```json
{
  "user_id": "usr_123",
  "session_id": "sess_abc",
  "request_id": "optional-client-id",
  "message": "Is this available in medium?",
  "history": [
    {"role": "user", "content": "Show me dresses under 5000"},
    {"role": "assistant", "content": "Here are a few options."}
  ],
  "context": {
    "module_id": "product",
    "layer": "consideration",
    "last_action": "open_product",
    "focus_product_id": "prod_123",
    "session_state": {
      "cart_count": 1,
      "dwell_seconds": 12,
      "recent_interactions": []
    }
  }
}
```

Limits enforced by the request schema:

- message: 1–4000 characters;
- history: at most 20 messages;
- history content: 1–4000 characters each;
- user, session, and request ids: at most 128 characters.

## Shared app context

`module_id` identifies the visible client module: `feed`, `product`, `cart`,
`checkout`, `closet`, `orders`, `assistant`, `taste_portrait`, `brand`,
`onboarding`, `search`, or `unknown`.

`layer` identifies the customer journey stage: `onboarding`, `discovery`,
`consideration`, `purchase`, `experience`, `advocacy`, or `identity`.

The client should include focused product, brand, or order ids when present and
send only a compact recent interaction window. Durable history remains owned by
Recsys/Juno API.

## SSE events and client behavior

| Event | Payload/use |
| --- | --- |
| `meta` | `{request_id, model, provider}`; initialize the turn. |
| `text` | `{request_id, delta}`; append text to the assistant message. |
| `tool_status` | Tool name and state; show optional progress. |
| `candidates` | Grounded products; render native product cards. |
| `action` | A staged action; render a confirmation card. |
| `navigate` | Navigate to a supported client module. |
| `render_widget` | Open a supported native widget. |
| `prefill` | Prefill a client-owned field. |
| `highlight` | Highlight a native UI target. |
| `select_option` | Select a verified native option. |
| `suggestion` | Render one optional tappable reply chip. |
| `error` | Recoverable error with a stable code and message. |
| `done` | Close the loading state for the turn. |

SSE frames can split across network reads. Buffer bytes until the blank-line
frame boundary before parsing `data` as JSON. Unknown event types must be
ignored safely.

## Server execution

1. Middleware validates body size and HTTP limits.
2. Budget and per-user LLM limits are checked.
3. Dynamic screen, journey, user, and Recsys context is assembled outside the
   Gemini cache envelope.
4. Stable prompt/catalog context uses the explicit cache when enabled.
5. Gemini may request server-side tools. Tools are scoped to the request user.
6. Read results, product candidates, staged actions, and UI directives stream
   to the client.
7. The model never directly performs a transaction mutation.

## Tool contract

Read tools cover catalog search, recommendations, product insights, sizing,
cart, closet, offers, shipping, orders, spending summaries, and profile facts.
Write-capable tools return staged actions or use supported non-commerce service
operations. All upstream Juno API calls are made server-side; blocking client
calls run through `asyncio.to_thread`.

## Failure behavior

- `budget_blocked`: daily cost guard denied the call.
- `rate_limited`: request or user limit exceeded; may include retry seconds.
- `agent_not_configured`: Gemini is disabled or has no API key.
- `empty_response`: Gemini completed without user-visible text.
- `agent_failure`: the turn failed; the stream still ends with `done`.
- HTTP `413`: request body exceeded `AGENT_MAX_REQUEST_BYTES`.

## Configuration

Primary variables are `AGENT_ENABLED`, `GEMINI_API_KEY`, `CHAT_MODEL`,
`GEMINI_USE_EXPLICIT_CACHE`, `CHAT_MAX_OUTPUT_TOKENS`,
`GEMINI_THINKING_BUDGET`, `AGENT_MAX_TOOL_ITERATIONS`, and the `AGENT_*` budget
and rate-limit variables defined in `agent_core/config.py`.

Update this file whenever the chat request, context shape, SSE protocol, tool
surface, cache behavior, or client rendering contract changes.
