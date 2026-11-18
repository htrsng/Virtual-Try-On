# VFitAI API testing

The suite uses Jest 30, Supertest 7, and `mongodb-memory-server` 11. Tests call the Express API and check responses and MongoDB state for operations that write data.

| Risk | Representative test |
| --- | --- |
| Incorrect access or exposure of account data | [Admin permissions](permissions.test.js) · [Response fields and account restrictions](security.test.js) |
| Incorrect pricing, coupons, or inventory | [Checkout and concurrent purchases of the last unit](checkout.test.js#L58) |
| Access to another account’s data | [Shipping address ownership](addresses.test.js#L43) |

## Run the tests

Use Node.js 22 and npm. Run from the repository root.

```sh
npm ci --prefix server
npm --prefix server test
npm --prefix server test -- --coverage
```

Jest starts a temporary MongoDB replica set and clears test data after each case. The first run may download MongoDB. To use an existing compatible binary, set `MONGOMS_SYSTEM_BINARY` as described in the [environment guide](../../qa/docs/environment-setup.md). The test configuration runs independently of Atlas and live accounts.

## Results and limitations

Files named `*.test.js` group cases by feature. `setup.js` manages the database lifecycle, and `helpers.js` creates test data. On November 18, 2026, all 134 local cases passed. Coverage HTML is written to `.runtime/coverage/backend/`. [Test report and CI links](../../qa/docs/test-summary.md).

Chat and product recommendation tests exercise internal APIs. The suite has yet to verify the outfit endpoint against live Gemini or verify email delivery. Online payment tests cover the behavior when the provider is unconfigured. [API inventory](../../qa/docs/api-inventory.md).
