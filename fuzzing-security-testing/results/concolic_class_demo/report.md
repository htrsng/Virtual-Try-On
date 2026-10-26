# Whitebox concolic có giới hạn

POST /api/orders → OrderModel.save → castNumberOrThrow(totalAmount)

| Input | Nguồn | HTTP | Vi phạm | Tái hiện response/trace |
|---|---|---|---|---|
| number | valid_seed | 200 | Không quan sát | None |
| null | solver_generated | 500 | APPLICATION_HTTP_ERROR | True |
| numeric_string | solver_generated | 200 | INVALID_NUMERIC_TYPE_ACCEPTED | True |
| boolean | solver_generated | 200 | INVALID_NUMERIC_TYPE_ACCEPTED | True |
| object | solver_generated | 500 | APPLICATION_HTTP_ERROR | True |

## Điều kiện đường đi và solver

- Phủ định `order.total.required`: **sat**; model `[total_kind = 4]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Or(total_kind == 4, total_kind == 5)]
```
- Phủ định `cast.empty`: **unsat**; model ``.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5)),
 Or(total_kind == 4, total_kind == 5)]
```
- Phủ định `cast.number`: **sat**; model `[total_kind = 1]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(total_kind == 0)]
```
- Phủ định `order.total.required`: **sat**; model `[total_kind = 0]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5))]
```
- Phủ định `cast.number`: **sat**; model `[total_kind = 0]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(Or(total_kind == 4, total_kind == 5)),
 total_kind == 0]
```
- Phủ định `cast.boolean`: **sat**; model `[total_kind = 6]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(total_kind == 0),
 total_kind == 6]
```
- Phủ định `cast.invalid`: **sat**; model `[total_kind = 3]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(total_kind == 0),
 Not(total_kind == 6),
 Or(total_kind == 2, total_kind == 3, total_kind == 7)]
```
- Phủ định `cast.boolean`: **sat**; model `[total_kind = 1]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(total_kind == 0),
 Not(total_kind == 6)]
```
- Phủ định `cast.invalid`: **sat**; model `[total_kind = 1]`.
```text
[total_kind >= 0,
 total_kind < 8,
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(Or(total_kind == 4, total_kind == 5)),
 Not(total_kind == 0),
 Not(total_kind == 6),
 Not(Or(total_kind == 2, total_kind == 3, total_kind == 7))]
```

## Giới hạn

- Manual symbolic model of selected guards, not automatic symbolic execution of JavaScript.
- Eight JSON representatives only; not complete numeric/string coverage.
- Other fields fixed to valid seed; simulated datastore, not MongoDB or production.
- No added fault branch; findings belong to existing harness behavior.
- UNSAT holds only for the encoded prefix and representative domain.
- Line coverage includes setup; not branch/edge coverage of the whole app.
- Repeated status/path is not stack-trace deduplication or a count of unique bugs.
- No sanitizer: HTTP 5xx is not a confirmed memory error or process crash.
- Targeted concolic campaign, not an automatic plateau-triggered hybrid engine.
