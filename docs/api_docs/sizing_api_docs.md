# Sizing module

The sizing module is the single client contract for approved normalized charts,
the renderable fit quiz, and deterministic `size-match-v3` recommendations. It
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
`dark_url`. Each visual question returns six neutral options labelled `1`
through `6`; its image panel must show six numbered silhouettes in the same
order. The API deliberately does not attach descriptive body labels. Where the
approved chart provides the relevant measurement, each option also includes a
product-and-brand-specific `measurement_band` with `measurement`, `min`, `max`,
and `unit: "inches"`. The six contiguous bands span that product's normalized
chart; garment charts are converted from flat width and regular ease first.
Bands are omitted when unit, measurement basis, or method is unknown rather than
presenting fabricated inches; those charts retain the lower-confidence visual
fallback until their metadata is repaired.

Reference panels for visual QA are stored at
`docs/assets/sizing/body-profiles-women-v3.png` and
`docs/assets/sizing/body-profiles-men-v3.png`. They are review assets, not public
storage URLs. Production panels must preserve the equal-step ordering and be
reviewed against the returned bands before replacing existing storage objects.

Visual panels must:

- use faceless technical line art with no realistic skin, hair, facial features,
  anatomical detail, texture, gradients, shadows, or 3D rendering;
- retain fitted athletic clothing so the shoulder, chest, waist, and hip outer
  contours remain measurable; clothing looseness must not create the apparent
  difference between profiles;
- keep height, pose, head size, and limb length constant across all six figures;
- progress from `1` (narrowest) to `6` (widest) in controlled, near-equal steps,
  with every adjacent pair visibly distinct and no abrupt jump; and
- keep shoulder selection (`upper_shoulders`) separate from chest/waist selection
  (`upper_torso`), and keep both separate from waist/hip selection
  (`lower_waist_hips`).

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
is displayed once above its six options. A top quiz therefore sends
`usual_size`, `usual_size_consistency`, `upper_shoulders`, `upper_torso`,
`height_inches`, and `fit` (plus `gender` for unisex products). A bottom quiz
uses `lower_waist_hips` instead of the two upper-body answers.

### `POST /api/v2/sizing/products/{productID}/progress`

Records server-owned step progress. Send `X-Juno-Journey-Id` with the anonymous
UUID used through checkout and `{"step_id":"upper_torso","step_index":3}`.
The API accepts it only when the ID and zero-based index match the current quiz.
It stores no answer, body measurement, or customer contact data.

### `POST /api/v2/sizing/products/{productID}/recommend`

Submit either the legacy top-level `usual_size` and `fit` fields or the generated
quiz's `answers` map. Measurements are optional but materially improve accuracy.
Explicit customer measurements always take priority. Without them, available
visual bands become inferred inch measurements matched against the approved
product chart; inferred selections cannot receive high confidence.

```json
{
  "answers": {
    "usual_size": "M",
    "usual_size_consistency": "always",
    "upper_shoulders": "3",
    "upper_torso": "5",
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
shape pressure from the numbered visual selections; `1` is the smallest profile
shown and `6` the largest. It never invents body centimetres. Sets and ethnic/formal
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
  "algorithm_version": "size-match-v3"
}
```

`fit_analysis` uses `comfortable`, `roomy`, `close`, or `too_small`. Warnings mean
no available variant fully meets a supplied primary measurement; clients should
show them rather than silently overstating confidence.

No fixed accuracy percentage is returned. Accuracy is measured from completed
recommendations that convert and later reach a final order outcome; it must not
be claimed until the sample is meaningful across sellers and product groups.

### `GET /api/v2/sizing/charts/{chartID}`

Returns one approved shared normalized chart by ID.

## Storage

- `size_charts`: per-product source link and normalization state.
- `normalized_size_charts`: shared, approved customer-safe chart keyed by ID.
