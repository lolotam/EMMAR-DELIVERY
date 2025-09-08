# Admin Password Change Feature - Test Plan

## Overview
This document outlines the comprehensive testing plan for the newly implemented admin password change feature in the EMAR-DELIVERY application.

## Feature Summary
- **Location**: Settings page → Security Settings section
- **Endpoint**: `/api/admin/change-password`
- **Authentication**: Admin privileges required
- **Security**: bcrypt password hashing, rate limiting, comprehensive validation

## Test Environment
- **Application URL**: http://localhost:1111
- **Default Admin Credentials**: 
  - Username: `admin`
  - Password: `admin123`

## Manual Testing Checklist

### 1. Access Control Tests
- [ ] **Test 1.1**: Verify password change form is only visible to authenticated admin users
- [ ] **Test 1.2**: Confirm unauthenticated users cannot access `/api/admin/change-password`
- [ ] **Test 1.3**: Verify rate limiting (3 attempts per minute) is enforced

### 2. UI/UX Tests
- [ ] **Test 2.1**: Navigate to Settings page and locate "إعدادات الأمان" section
- [ ] **Test 2.2**: Verify all form fields are present:
  - Current password field with toggle visibility
  - New password field with toggle visibility  
  - Confirm password field with toggle visibility
  - Password strength indicator
- [ ] **Test 2.3**: Test password visibility toggles work correctly
- [ ] **Test 2.4**: Verify Arabic RTL layout and text display correctly

### 3. Password Strength Validation Tests
- [ ] **Test 3.1**: Enter weak password (e.g., "123") - should show red strength indicator
- [ ] **Test 3.2**: Enter medium password (e.g., "Password1") - should show yellow/orange indicator
- [ ] **Test 3.3**: Enter strong password (e.g., "MyStr0ng!Pass") - should show green indicator
- [ ] **Test 3.4**: Verify real-time strength updates as user types

### 4. Form Validation Tests
- [ ] **Test 4.1**: Submit form with empty fields - should show validation errors
- [ ] **Test 4.2**: Enter mismatched new password and confirmation - should show error
- [ ] **Test 4.3**: Enter same password as current - should show error
- [ ] **Test 4.4**: Enter password shorter than 8 characters - should show error
- [ ] **Test 4.5**: Enter password without uppercase letter - should show error
- [ ] **Test 4.6**: Enter password without lowercase letter - should show error
- [ ] **Test 4.7**: Enter password without number - should show error
- [ ] **Test 4.8**: Enter password without special character - should show error

### 5. Functional Tests
- [ ] **Test 5.1**: Successfully change password with valid inputs
- [ ] **Test 5.2**: Verify success message appears in Arabic
- [ ] **Test 5.3**: Confirm automatic logout after 5 seconds
- [ ] **Test 5.4**: Login with new password - should succeed
- [ ] **Test 5.5**: Try to login with old password - should fail

### 6. Backend Integration Tests
- [ ] **Test 6.1**: Verify password is hashed with bcrypt in config.json
- [ ] **Test 6.2**: Confirm plain text password is removed from config
- [ ] **Test 6.3**: Check that last_update timestamp is updated
- [ ] **Test 6.4**: Verify password change event is logged

### 7. Security Tests
- [ ] **Test 7.1**: Verify current password verification before change
- [ ] **Test 7.2**: Test rate limiting with multiple rapid requests
- [ ] **Test 7.3**: Confirm CSRF protection is active
- [ ] **Test 7.4**: Verify session invalidation after password change

## Test Execution Steps

### Step 1: Initial Setup
1. Open browser and navigate to http://localhost:1111
2. Login with default credentials (admin/admin123)
3. Navigate to Settings page (الإعدادات)
4. Scroll down to Security Settings section (إعدادات الأمان)

### Step 2: UI Verification
1. Locate the password change form in the yellow-bordered card
2. Verify all form fields are present and properly labeled in Arabic
3. Test password visibility toggles by clicking the eye icons
4. Confirm form layout is RTL and properly aligned

### Step 3: Password Strength Testing
1. Click in the "New Password" field
2. Type progressively stronger passwords:
   - "123" (should be red/weak)
   - "password" (should be red/weak)
   - "Password1" (should be yellow/medium)
   - "MyStr0ng!Pass" (should be green/strong)
3. Verify strength indicator updates in real-time

### Step 4: Validation Testing
1. Try submitting with empty fields
2. Enter mismatched passwords in new/confirm fields
3. Enter current password as new password
4. Test various invalid password formats

### Step 5: Successful Password Change
1. Enter current password: `admin123`
2. Enter new strong password: `NewStr0ng!Pass2025`
3. Confirm the new password
4. Click "تغيير كلمة المرور" button
5. Verify success message appears
6. Wait for automatic logout
7. Login with new password

### Step 6: Backend Verification
1. Check `data/config.json` file
2. Verify `password_hash` field exists under admin
3. Confirm `password` field is removed
4. Check `last_update` timestamp

## Expected Results

### Successful Password Change Flow:
1. Form validates all inputs correctly
2. Success message: "تم تغيير كلمة المرور بنجاح!"
3. Notification: "سيتم تسجيل خروجك خلال 5 ثوانٍ..."
4. Automatic logout after 5 seconds
5. Login with new password succeeds
6. Config file updated with bcrypt hash

### Error Scenarios:
- Invalid current password: "كلمة المرور الحالية غير صحيحة"
- Weak password: "كلمة المرور ضعيفة جداً..."
- Mismatched passwords: "كلمة المرور الجديدة وتأكيدها غير متطابقتين"
- Same as current: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية"

## Test Status
- **Implementation**: ✅ Complete
- **Manual Testing**: 🔄 Ready for execution
- **Automated Testing**: ⏳ Pending (Playwright setup required)

## Notes
- All error messages are displayed in Arabic
- Password strength indicator provides real-time feedback
- Security best practices implemented (bcrypt, rate limiting, validation)
- Automatic logout ensures session security after password change
