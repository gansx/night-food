# E2E Regression

This project has a full browser regression for the family workflow:

- owner registration
- household creation and family code extraction
- menu category and menu item creation
- member registration and family-code join
- member order submission and cancellation
- owner task assignment
- member task submission
- owner task approval

Run against the deployed Workers:

```powershell
$env:PLAYWRIGHT_BASE_URL = "https://night-food-web.798622053.workers.dev"
$env:PLAYWRIGHT_ADMIN_BASE_URL = "https://night-food-admin.798622053.workers.dev"
pnpm test:e2e
```

Run only the test discovery check:

```powershell
pnpm test:e2e:list
```

The full regression intentionally creates unique test accounts and household data. If the two URL variables are not set, the test is skipped so local build checks do not accidentally hit production.
