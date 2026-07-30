# Sizing module

The sizing module is the single client contract for approved normalized charts,
the renderable fit quiz, and deterministic `size-match-v2` recommendations. It
does not call AI at request time and never returns source chart HTML or images.

New web and mobile clients should use `/api/v2/sizing/...`; catalog sizing routes
remain legacy compatibility endpoints.

## Routes

### `GET /api/v2/sizing/products/{productID}`

Returns `availability`, the approved chart, selected chart section, available
variants, and `quiz`. If no approved chart exists, chart and quiz are omitted.

### `GET /api/v2/sizing/products/{productID}/quiz`

Returns the complete, client-renderable quiz contract. Visual questions include
one `illustrations` entry per applicable gender, each with `light_url` and
`dark_url`. The image is a three-choice panel in the same order as `options`.

- Tops and outerwear: shoulder width, then chest/waist shape.
- Bottoms: waist/hip shape.
- Dresses and one-pieces: both upper questions and waist/hip shape.
- Unisex products start with the `gender` question; clients then select that
  gender's illustration URL.

`height_inches` is required (integer inches, 36–96); clients can use feet/inches
controls and submit the converted total. It affects fit only where the chart
supports length, inseam, or outseam. `usual_size` contains distinct size labels
only—never colour/size variant titles. Labels are matched case-insensitively as
`size` or `sizes`; if neither an approved chart row nor one of those option values
exists, no customer quiz is returned.

Every generated non-optional question must be returned in `answers` when using
the quiz flow. `visual_single_select` answers use the option `value`; the panel
is displayed once above its three options. A top quiz therefore sends
`usual_size`, `usual_size_consistency`, `upper_shoulders`, `upper_torso`,
`height_inches`, and `fit` (plus `gender` for unisex products). A bottom quiz
uses `lower_waist_hips` instead of the two upper-body answers.

### `POST /api/v2/sizing/products/{productID}/recommend`

Submit either the legacy top-level `usual_size` and `fit` fields or the generated
quiz's `answers` map. Measurements are optional but materially improve accuracy.

```json
{
  "answers": {
    "usual_size": "M",
    "usual_size_consistency": "always",
    "upper_shoulders": "average",
    "upper_torso": "round",
    "height_inches": "68",
    "fit": "regular"
  },
  "measurements": {"chest": 92},
  "measurement_unit": "cm"
}
```

`measurement_unit` accepts `cm` or `inches`; when omitted, values are interpreted
in the chart unit for backward compatibility. Measurement matching is rejected if
the approved chart does not specify a usable unit, basis (`body` or `garment`), and
method (`circumference` or `flat_width`). Flat-width garment chest, waist, and hip
values are converted to circumference before comparison.

Only available variants are candidates. Measurements still take priority when
provided. Otherwise, the quiz starts from usual size and applies small, explainable
shape pressure (for example, broad shoulders plus a round torso can move one
available size up). It never invents body centimetres. Sets and ethnic/formal
products score all applicable sections. The response is:

```json
{
  "recommended_size": "M",
  "variant_id": "variant_123",
  "confidence": {"level": "high", "score": 0.88},
  "alternative": {"size": "L", "reason": "Next closest available size"},
  "fit_analysis": {"chest": "comfortable"},
  "reason": "Closest available match to your supplied measurements",
  "warnings": [],
  "chart_id": "chart_123",
  "algorithm_version": "size-match-v2"
}
```

`fit_analysis` uses `comfortable`, `roomy`, `close`, or `too_small`. Warnings mean
no available variant fully meets a supplied primary measurement; clients should
show them rather than silently overstating confidence.

### `GET /api/v2/sizing/charts/{chartID}`

Returns one approved shared normalized chart by ID.

## Storage

- `size_charts`: per-product source link and normalization state.
- `normalized_size_charts`: shared, approved customer-safe chart keyed by ID.
