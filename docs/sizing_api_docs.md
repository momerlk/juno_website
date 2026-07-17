# Sizing module

The sizing module owns customer-facing access to approved normalized size charts and
the deterministic `size-match-v1` recommendation. It never invokes AI at request
time and never exposes raw source image or HTML evidence.

## Routes

### `GET /api/v2/sizing/products/{productID}`

Returns the approved normalized chart, taxonomy-selected chart section, available
variants, and the product's questionnaire. If no customer-safe chart exists, it
returns `availability` (`needs_manual_review`, `not_found`, or `not_required`) and
no chart or quiz.

### `GET /api/v2/sizing/products/{productID}/quiz`

Returns the generated questionnaire only. Profiles are `tops`, `bottoms`, and
`full_body`; optional chest, waist, and hip questions are included only when the
selected chart section supports them.

### `POST /api/v2/sizing/products/{productID}/recommend`

Accepts a deterministic recommendation request:

```json
{
  "usual_size": "M",
  "fit": "regular",
  "measurements": {"chest": 40}
}
```

Only available variants can be returned. Measurements score the closest chart row;
usual size is the fallback, and fit only breaks an exact adjacent tie. The response
contains `recommended_size`, `variant_id`, `confidence`, `alternative_size`, and
`algorithm_version`.

### `GET /api/v2/sizing/charts/{chartID}`

Returns one approved shared normalized chart by ID. This supports chart rendering
when a product response has already supplied the chart ID.

## Storage

- `size_charts`: per-product source link and normalization state.
- `normalized_size_charts`: shared approved chart, keyed by its normalized chart ID.

The existing catalog sizing URLs remain compatibility endpoints. New clients should
use this module's `/api/v2/sizing/...` routes.
