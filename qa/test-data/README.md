# QA test fixtures

Playwright and Selenium reset data before each case. Jest starts with an empty database so each case can create the data it needs. To load all fixtures in Jest, call `global.qaTestDatabase.reset()`.

## Choose fixtures for a case

| Fixture | Test values |
| --- | --- |
| Accounts | Administrator, shopper, and second shopper. Emails use `role+runId@example.test`. |
| QA Cotton Shirt | ID 50101, VND 200,000, White. Stock for sizes S/M/L is 4/5/3. |
| QA Trousers | ID 50102, VND 300,000, stock 6. |
| QA Unavailable Shirt | ID 50103, inactive, stock 0. |
| Example orders | One processing and one delivered order, each totaling VND 230,000. |
| Closet and outfits | The shopper has a size M shirt in the closet. |
| Try-on session | Size M shirt. The creation time is refreshed so the session is active when the test starts. |
| Banner and newsletter | One record each. Coupon `NEWS10QA` belongs to the shopper. |

Fixture orders are historical records with `inventoryReserved=false`. Orders created through the API deduct inventory within a transaction. The 3D assets come from `client/public/` and include the avatar plus shirts and trousers in sizes S/M/L. [Fixture catalog](catalog.json).

## Reset test data

Use the reset and clear methods in the [QA database helper](../../server/test-support/owned-database.js). It verifies the connection, database name, and ownership marker before deleting data. Reset between cases because the suite shares an environment.

Passwords are generated at startup and reused across resets. The local manifest contains test accounts and an expired JWT for session checks. The launcher removes these values on shutdown. Keep the manifest under `.runtime/qa/` on the local machine.
