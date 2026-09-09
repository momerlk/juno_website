# Agent Actions Module

## Scope

The Agent Actions module owns deterministic execution after a user explicitly
confirms a staged commerce mutation.

Implementation:

- `agent_core/routers/actions.py`
- staging and upstream helpers in `agent_core/services/tools_exec.py`

## Endpoint

### `POST /agent/actions/confirm`

Requires the current user JWT:

```http
Authorization: Bearer <user-jwt>
Content-Type: application/json
```

```json
{
  "kind": "add_to_cart",
  "user_id": "usr_123",
  "payload": {
    "product_id": "prod_123",
    "variant_id": "var_456",
    "quantity": 1
  }
}
```

Supported actions:

| Kind | Required payload |
| --- | --- |
| `add_to_cart` | `product_id`, `variant_id` or `variant`, quantity 1–20. |
| `checkout` | Verified `address_id` and `payment_method: "cod"`. |
| `apply_offer` | `offer_id`, `offer_code`, or `code`. |
| `save_to_closet` | `product_id`. |

## Security and execution

1. Validate the bearer token against the upstream Juno API `/me` endpoint.
2. Reject a payload user id that differs from the authenticated user.
3. Validate the action payload with Pydantic.
4. For cart operations, reload the product and variant from the catalog.
5. Recheck availability, inventory, quantity, and current price.
6. Execute the matching Juno API mutation.

The staged card is display data, not authority. The model cannot directly call
this endpoint or approve its own action.

## Client contract

- Render the staged `action` SSE event as a native confirmation card.
- Show the exact product, variant, quantity, price, address, offer, or payment
  choice being confirmed.
- Call the endpoint only after an explicit user tap.
- Send the current JWT, not an agent service token.
- Disable repeated confirmation while one request is in flight.
- Refresh the cart/product after success.

## Failure behavior

| Status | Meaning/client response |
| --- | --- |
| `400` | Invalid or unavailable product/variant; return to selection. |
| `401` | Missing, expired, or invalid user token; reauthenticate. |
| `403` | Payload user differs from authenticated user; stop. |
| `409` | Stock, availability, or price changed; refresh the card/cart. |
| `422` | Request shape failed validation; fix the client payload. |
| `502` | Upstream Juno API failed in production; offer retry. |

`DEMO_MODE=true` permits documented mock fallbacks for development. Production
must set `DEMO_MODE=false` so auth and upstream failures are loud.

Update this file whenever a staged kind, confirmation payload, upstream target,
auth rule, inventory check, or client confirmation behavior changes.
