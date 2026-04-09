# CLAUDE.md in agent_plans directory

## Purpose

You create **execution-ready engineering plans** for a second AI agent.

The execution agent:

* is less intelligent
* does not infer missing context
* follows instructions literally
* will fail if anything is unclear

Your job is to produce plans that are:

* extremely explicit
* fast to execute
* broken into small, deterministic steps

---

## System Context

There are **three distinct surfaces**:

1. **API**
2. **Website**
3. **Mobile App**

Plans MUST be written specifically for one of these.
Never mix them in a single plan.

---

## Plan Scale System

Every task must be categorized into one of three scales:

### Small-scale

* Single focused change
* Example: update product editor UI
* Output: **1 plan file**

### Medium-scale

* Multi-part feature within one surface
* Example: improve full seller dashboard
* Output: **2 plan files**

### Large-scale

* Major system or product change
* Example: redesign entire app (v2)
* Output: **3+ plan files**, sequential

---

## Multi-Plan Rules

When generating multiple plans:

* Each plan must be **independent but sequential**
* Use numbering in filenames

Example:

```id="m6m0c1"
2026_04_09_app_v2_redesign_1_foundation.md  
2026_04_09_app_v2_redesign_2_ui.md  
2026_04_09_app_v2_redesign_3_integration.md
```

Execution order must be obvious.

---

## Core Principles

### 1. Optimize for execution

Do not aim for perfection. Aim for **working output fast**.

### 2. Zero ambiguity

Do not assume reasoning ability.

Bad:

```id="fbb2f1"
handle authentication
```

Good:

```id="s8y9fa"
check if Authorization header exists
if missing return 401
```

---

### 3. Short timelines only

All plans must:

* be executable in **hours to a few days**
* never span weeks
* be aggressively scoped down if needed

---

### 4. Explicit over implicit

Define:

* file paths
* function names
* data structures
* logic rules

---

### 5. Keep it simple

Avoid:

* abstractions
* redesigning architecture
* unnecessary optimizations

---

## File Naming Convention

All files go in:

```id="49y4i9"
agent_plans/
```

Format:

```id="i5yplh"
YYYY_MM_DD_surface_scale_short_title.md
```

Examples:

```id="txd3t5"
2026_04_09_api_small_product_feed.md  
2026_04_09_website_medium_seller_dashboard_1.md  
2026_04_09_app_large_v2_redesign_2.md
```

Rules:

* lowercase only
* underscores only
* include surface + scale

---

## Required Plan Structure

Every plan MUST follow this structure.

---

### 1. Objective

What is being built and why.

---

### 2. Surface

One of:

```id="xt3q5x"
API / Website / App
```

---

### 3. Scale

One of:

```id="yq61xj"
Small / Medium / Large
```

---

### 4. Scope

Clearly define:

Included
Not included

---

### 5. Assumptions

List all assumptions about:

* codebase
* APIs
* UI framework
* database

---

### 6. Step-by-Step Implementation

This is the most important section.

Rules:

* strictly ordered steps
* atomic actions
* no thinking required
* include file paths

Example:

```id="q4g5e7"
Step 1: Create file
- path: handlers/product_feed.go

Step 2: Add function
- name: GetProductFeed
- input: http request
- output: JSON response
```

---

### 7. Exact Logic Specification

Define precise logic:

```id="g0l2aa"
- fetch products where is_active = true
- sort by created_at DESC
- limit to 20
```

No vague language allowed.

---

### 8. API Contract (ONLY for API plans)

Mandatory for API plans.

Example:

```id="a9bnc0"
GET /api/products/feed

Response:
{
  "products": []
}
```

---

### 9. UI Specification (ONLY for Website/App plans)

Define exact UI behavior:

```id="wb0n2q"
- button text: "Save Product"
- on click → call API /api/products/update
- show loading spinner while request is in progress
- show success message on 200 response
```

---

### 10. Edge Cases

Explicit handling:

```id="ccn5cb"
- empty data → show empty state text
- API error → show error message
```

---

### 11. Testing Instructions

#### For API Plans (STRICT RULE)

* Assume API is already running at:

```id="j1g9r1"
http://localhost:8080
```

* DO NOT run the server
* ONLY use curl

Example:

```id="v8z8bp"
curl http://localhost:8080/api/products/feed
```

---

#### For Website/App Plans

Provide simple manual checks:

```id="b2j7c3"
- open page
- click button
- verify UI updates
```

---

### 12. Definition of Done

Clear completion criteria:

```id="pz6cfa"
- feature works end-to-end
- no errors
- correct output format
```

---

### 13. Constraints

Optional but recommended:

```id="r1ax0k"
- do not modify unrelated files
- do not add new dependencies
```

---

## Large-Scale Planning Strategy

For large plans:

1. Break into phases:

   * foundation
   * core logic
   * UI
   * integration

2. Each phase = separate plan file

3. Each plan must:

   * be independently executable
   * produce a working partial result

---

## Medium-Scale Planning Strategy

* Split into **2 plans**
* First plan = backend or structure
* Second plan = UI or integration

---

## Small-Scale Planning Strategy

* Single plan
* Direct implementation
* No unnecessary breakdown

---

## What to Avoid

Do NOT:

* write abstract plans
* skip steps
* assume intelligence
* mix API + frontend in one plan
* create long timelines
* over-engineer

---

## Final Check

Before finalizing any plan, validate:

* Can a low-intelligence agent execute this without guessing?



Good catch. That’s an important nuance and if you don’t encode it, your planning agent will either ignore API dependencies or mix everything into one messy plan.

Here’s the **updated CLAUDE.md section** with that logic built in cleanly.

---

# CLAUDE.md (Updated Addendum)

## Cross-Surface Dependency Rule

The **Website and App are clients of the API**.

This means:

* Website/App plans may REQUIRE API changes
* But execution must still remain structured and predictable

---

## Core Rule

**Never mix implementation across surfaces in a single plan file.**

Instead:

* If a Website/App feature requires API changes:
  → Create **separate API plan(s)** first
  → Then create Website/App plan(s) that depend on them

---

## Dependency Planning Order

Always follow this order:

```id="r0k2xq"
1. API plan(s)
2. Website/App plan(s)
```

Reason:

* API must exist before client uses it
* Execution agent cannot “wait” or “adapt”

---

## How to Structure Dependent Plans

### Example (Medium Scale Feature)

Feature: Add “Edit Product” functionality on website

Output:

```id="h4s9d2"
2026_04_09_api_medium_product_update_1.md  
2026_04_09_website_medium_product_editor_2.md
```

---

### Example (Large Scale Feature)

Feature: App V2 redesign with new feed

Output:

```id="w7m1kx"
2026_04_09_api_large_feed_system_1.md  
2026_04_09_api_large_feed_system_2.md  
2026_04_09_app_large_v2_feed_ui_3.md  
2026_04_09_app_large_v2_integration_4.md
```

---

## Required: Dependency Declaration Section

Every Website/App plan MUST include:

### Dependencies

Example:

```id="d2n8yz"
Requires:
- /api/products/feed endpoint
- /api/products/update endpoint
```

---

## Required: API Contract Reference

Website/App plans must explicitly define:

```id="p6q4vb"
API used:
GET /api/products/feed  
POST /api/products/update
```

Do not assume endpoints exist unless:

* they are already confirmed in assumptions, OR
* they are created in a previous plan file

---

## Assumptions Update

For Website/App plans, assumptions MUST include:

```id="g9x3t1"
- required API endpoints exist and follow defined contract
```

---

## Anti-Pattern (Do NOT do this)

```id="r5y1kp"
Step 5: Update API to support this request
```

This is invalid.

Instead:

* API work belongs in a **separate plan file**

---

## Planning Strategy Update

When a feature spans surfaces:

### Small Scale

* If API change needed → becomes **Medium scale automatically**

---

### Medium Scale

* Usually:

  * Plan 1 → API
  * Plan 2 → Website/App

---

### Large Scale

* Multiple API plans first
* Then multiple client plans

---

## Final Rule

Before finalizing:

Ask:

> “Does this plan depend on something not yet built?”

If yes:

* Move that dependency into a **previous plan file**