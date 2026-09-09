# Agent Assist Module

## Scope

The Agent Assist module owns ambient suggestions, contextual guided-action
discovery, and guided actions that reuse the Agent Chat stream.

Implementation:

- `agent_core/routers/suggest.py`
- `agent_core/routers/assist.py`
- `agent_core/schemas/suggest.py`
- `agent_core/schemas/assist.py`
- `agent_core/services/journey.py`

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /agent/suggest` | Return one optional contextual suggestion. |
| `POST /agent/assist/actions` | Return ranked guided actions for the current screen. |
| `POST /agent/assist` | Execute one guided action as an SSE chat turn. |

## `POST /agent/suggest`

```json
{
  "user_id": "usr_123",
  "request_id": "optional-client-id",
  "allow_llm": true,
  "context": {
    "module_id": "product",
    "layer": "consideration",
    "last_action": "dwell",
    "focus_product_id": "prod_123",
    "session_state": {"dwell_seconds": 15}
  }
}
```

```json
{
  "request_id": "req_123",
  "source": "playbook",
  "suggestion": {
    "id": "pb_consideration_product",
    "text": "Want help choosing the right size?",
    "target_module": "product",
    "tier": 1,
    "is_care": false
  }
}
```

The deterministic journey playbook runs first. Gemini is considered only when
`allow_llm` is true, no playbook suggestion exists, the moment is high-value,
and budget/rate limits allow it. `suggestion: null` is the normal silence case.

Client rules:

- poll only after a useful idle pause, dwell spike, module transition, or
  completed action;
- render nothing for a null suggestion;
- dedupe by suggestion id for the current module visit;
- keep suggestion text to one line;
- treat HTTP `429` as a retryable LLM limit, not a page failure.

## `POST /agent/assist/actions`

```json
{
  "user_id": "usr_123",
  "context": {
    "module_id": "product",
    "layer": "consideration",
    "focus_product_id": "prod_123"
  }
}
```

The response contains `primary_action_id` and ranked `actions`. Each action has
an id, label, description, icon, rank, input widget, and focus-product
requirement. Render the primary action as the main CTA and the remainder in a
compact action sheet.

Supported input widgets are `none`, `occasion`, `budget`, `product_picker`,
`order_picker`, `personalisation_quiz`, `style_existing`, `mood`,
`budget_target`, `delivery_date`, `style_twins`, `return_exchange`, `reorder`,
`fit_feedback`, `negotiation`, and `text`.

## `POST /agent/assist`

```json
{
  "action_id": "build_outfit",
  "values": {"occasion": "dinner", "budget": 12000},
  "user_id": "usr_123",
  "session_id": "sess_abc",
  "context": {
    "module_id": "product",
    "layer": "consideration",
    "focus_product_id": "prod_123"
  }
}
```

The endpoint converts the selected action and values into a grounded chat turn,
then emits the Agent Chat SSE protocol. The client uses the same parser and
renderers as `/agent/chat`.

Validation rules:

- product actions marked `requires_focus_product` need
  `context.focus_product_id`;
- `find_for_event` needs `values.occasion`;
- `compare_products` needs 2–4 product ids;
- `personalisation_quiz` needs at least one supplied value;
- budget, arrival, style-twin, order, return, reorder, and fit actions require
  their matching value declared in `agent_core/routers/assist.py`.

## Action families

- Discovery: pick for me, event search, similar items, outfit building, cheaper
  alternatives, mood, and comparison.
- Product: sizing, product insights, offers, and price paths.
- Cart/checkout: complete purchase, complete outfit, trim budget, free shipping,
  and arrival checks.
- Closet/profile: style owned items, organize saves, personalization, style
  twins, and spending summaries.
- Orders/care: tracking, late-order support, return/exchange, reorder, and fit
  feedback.

Update this file whenever suggestions, action ids, required values, widgets,
ranking by module, or guided-action rendering changes.
