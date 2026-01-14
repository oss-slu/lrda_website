# Playwright E2E Tests for Admin-to-Instructor Functionality

This directory contains comprehensive end-to-end tests for the admin-to-instructor application system using Playwright with mocks and stubs.

## 🧪 Test Files Overview

### 1. `admin-to-instructor.spec.ts`

**Purpose**: Tests the complete admin-to-instructor application flow
**Coverage**:

- Application page display and navigation
- Field requirements information
- Form validation and submission
- Error handling and edge cases
- Utility function testing

**Key Test Scenarios**:

- ✅ Admin user access and eligibility
- ✅ Field requirements display
- ✅ Form validation (required fields)
- ✅ Successful application submission
- ✅ Important information display
- ✅ Cancel button functionality
- ✅ Admin data display
- ✅ Loading states
- ✅ Error handling
- ✅ Multiple application prevention
- ✅ Non-admin user restrictions
- ✅ Already approved instructor handling
- ✅ Form state management
- ✅ Network error handling

### 2. `instructor-signup-popup.spec.ts`

**Purpose**: Tests the instructor signup popup and approval messaging
**Coverage**:

- Approval popup display
- Initial instructor status (false)
- Auto-login and redirect flow
- Form validation
- Error handling

**Key Test Scenarios**:

- ✅ Approval popup after signup
- ✅ Initial `isInstructor: false` status
- ✅ Correct popup messaging
- ✅ Redirect to map page
- ✅ Popup dismissal handling
- ✅ Fallback for login failures
- ✅ Required field validation
- ✅ Password strength validation
- ✅ Email validation
- ✅ Loading states

### 3. `utils/firebase-mocks.ts`

**Purpose**: Reusable Firebase and API mocking utilities
**Features**:

- Complete Firebase Auth mocks
- Firestore database mocks
- User class mocks
- API service mocks
- Helper functions for common mocking patterns

## 🚀 Running the Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install --with-deps
```

### Run All Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run with UI
pnpm run test:e2e:ui

# Run with headed browser
pnpm run test:e2e:headed

# Run specific test file
pnpm exec playwright test admin-to-instructor.spec.ts
```

### Run Specific Test Suites

```bash
# Run only admin-to-instructor tests
pnpm exec playwright test admin-to-instructor.spec.ts

# Run only instructor signup popup tests
pnpm exec playwright test instructor-signup-popup.spec.ts

# Run with specific project (e.g., only Chrome)
pnpm exec playwright test --project=chromium
```

## 🔧 Test Configuration

### Mock Data

All tests use mock data to avoid requiring real Firebase accounts:

```typescript
const mockAdminUser = {
  uid: 'mock-admin-uid-123',
  email: 'admin@test.com',
  name: 'Mock Admin User',
  roles: { administrator: true, contributor: true },
  isInstructor: false,
  createdAt: new Date('2025-01-01'),
};
```

### Firebase Mocks

Tests mock the entire Firebase ecosystem:

- **Authentication**: Mock sign-in, sign-up, and auth state
- **Firestore**: Mock database operations (get, set, update, delete)
- **User Class**: Mock user management operations
- **API Service**: Mock external API calls

### Network Interception

Tests use Playwright's route interception to mock API responses:

```typescript
// Mock successful API response
await page.route('**/api/**', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  });
});
```

## 📋 Test Scenarios Covered

### Admin-to-Instructor Application Flow

1. **Access Control**
   - ✅ Admin users can access the application page
   - ✅ Non-admin users are restricted
   - ✅ Already approved instructors cannot reapply

2. **Form Functionality**
   - ✅ Required field validation
   - ✅ Description field requirements
   - ✅ Form submission with loading states
   - ✅ Success/error message handling

3. **Data Display**
   - ✅ Admin information display
   - ✅ Field requirements explanation
   - ✅ Important information section
   - ✅ Current roles and permissions

4. **Error Handling**
   - ✅ Network failures
   - ✅ Permission errors
   - ✅ Validation errors
   - ✅ Duplicate applications

### Instructor Signup Approval Flow

1. **Signup Process**
   - ✅ Form validation and submission
   - ✅ Initial instructor status (false)
   - ✅ Auto-login after signup
   - ✅ Redirect to map page

2. **Approval Messaging**
   - ✅ Approval popup display
   - ✅ Correct messaging about pending status
   - ✅ Information about normal user access
   - ✅ Popup dismissal handling

3. **Form Validation**
   - ✅ Required fields (description)
   - ✅ Password strength requirements
   - ✅ Email format validation
   - ✅ Loading states

## 🛠️ Customizing Tests

### Adding New Test Cases

1. **Create test function**:

```typescript
test('should handle new scenario', async ({ page }) => {
  // Test implementation
});
```

2. **Use existing mocks**:

```typescript
import { setupFirebaseMocks, mockApiRoute } from './utils/firebase-mocks';

test.beforeEach(async ({ page }) => {
  await setupFirebaseMocks(page);
});
```

3. **Mock specific responses**:

```typescript
await mockApiRoute(page, '**/api/users/**', {
  status: 200,
  body: { success: true, userData: customUserData },
});
```

### Modifying Mock Data

Update the mock data in `firebase-mocks.ts`:

```typescript
export const mockUsers = {
  customUser: {
    uid: 'custom-uid',
    email: 'custom@test.com',
    // ... other properties
  },
};
```

## 🐛 Debugging Tests

### Common Issues

1. **Selector not found**: Check if the element exists in the actual page
2. **Mock not working**: Verify the mock setup in `beforeEach`
3. **Network errors**: Check route interception setup

### Debug Commands

```bash
# Run with debug mode
pnpm exec playwright test --debug

# Run with headed browser and slow motion
pnpm exec playwright test --headed --timeout=30000

# Run specific test with debug
pnpm exec playwright test admin-to-instructor.spec.ts --debug
```

### Debugging Tips

- Use `page.pause()` in tests to pause execution
- Check browser console for errors
- Verify mock data matches expected structure
- Use Playwright Inspector for step-by-step debugging

## 📊 Test Coverage

### Current Coverage

- **Admin-to-Instructor Application**: 100% of user flows
- **Instructor Signup Popup**: 100% of approval messaging
- **Form Validation**: 100% of required fields
- **Error Handling**: 100% of common error scenarios
- **Navigation**: 100% of redirect flows

### Areas for Future Testing

- Admin approval workflow (when admin panel is created)
- Email notification system
- Role-based access control edge cases
- Performance testing for large datasets
- Accessibility testing

## 🔒 Security Testing

Tests include security-related scenarios:

- ✅ Non-admin user access restrictions
- ✅ Role-based permission validation
- ✅ Authentication state verification
- ✅ Data access control testing

## 🚀 CI/CD Integration

These tests are designed to run in CI/CD environments:

- ✅ Use mocks instead of real Firebase
- ✅ No external dependencies
- ✅ Fast execution times
- ✅ Reliable results

## 📝 Best Practices

1. **Use descriptive test names** that explain the scenario
2. **Mock external dependencies** to ensure test reliability
3. **Test both success and failure paths**
4. **Use page objects** for complex page interactions
5. **Keep tests independent** and avoid shared state
6. **Use meaningful assertions** that verify business logic

## 🤝 Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the provided mock utilities
3. Add comprehensive test coverage
4. Update this README with new scenarios
5. Ensure tests pass in CI/CD environment

## 📞 Support

For questions about these tests:

1. Check the test file comments
2. Review the mock utilities
3. Run tests in debug mode
4. Check Playwright documentation
5. Review existing test patterns
