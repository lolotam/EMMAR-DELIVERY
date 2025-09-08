#!/usr/bin/env python3
"""
Test script to manually test the password change functionality
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:1111"
LOGIN_URL = f"{BASE_URL}/api/login"
PASSWORD_CHANGE_URL = f"{BASE_URL}/api/admin/change-password"

def test_password_change():
    """Test the password change functionality"""
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    print("🔐 Testing Admin Password Change Functionality")
    print("=" * 50)
    
    # Step 1: Login with current credentials
    print("1. Logging in with current credentials...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        login_response = session.post(LOGIN_URL, json=login_data)
        print(f"   Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            print("   ✅ Login successful")
            login_result = login_response.json()
            print(f"   User: {login_result.get('user', {}).get('username')}")
        else:
            print("   ❌ Login failed")
            print(f"   Error: {login_response.text}")
            return
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return
    
    # Step 2: Attempt password change
    print("\n2. Attempting password change...")
    password_change_data = {
        "current_password": "admin123",
        "new_password": "TestNewPass123!",
        "confirm_password": "TestNewPass123!"
    }
    
    try:
        change_response = session.post(PASSWORD_CHANGE_URL, json=password_change_data)
        print(f"   Password Change Status: {change_response.status_code}")
        
        if change_response.status_code == 200:
            print("   ✅ Password change successful")
            change_result = change_response.json()
            print(f"   Message: {change_result.get('message')}")
        else:
            print("   ❌ Password change failed")
            print(f"   Error: {change_response.text}")
            
    except Exception as e:
        print(f"   ❌ Password change error: {e}")
    
    # Step 3: Test login with old password (should fail)
    print("\n3. Testing login with OLD password (should fail)...")
    old_login_data = {
        "username": "admin", 
        "password": "admin123"
    }
    
    try:
        old_session = requests.Session()
        old_response = old_session.post(LOGIN_URL, json=old_login_data)
        print(f"   Old Password Login Status: {old_response.status_code}")
        
        if old_response.status_code == 200:
            print("   ❌ OLD password still works! (This is the bug)")
        else:
            print("   ✅ OLD password correctly rejected")
            
    except Exception as e:
        print(f"   ❌ Old password test error: {e}")
    
    # Step 4: Test login with new password (should succeed)
    print("\n4. Testing login with NEW password (should succeed)...")
    new_login_data = {
        "username": "admin",
        "password": "TestNewPass123!"
    }
    
    try:
        new_session = requests.Session()
        new_response = new_session.post(LOGIN_URL, json=new_login_data)
        print(f"   New Password Login Status: {new_response.status_code}")
        
        if new_response.status_code == 200:
            print("   ✅ NEW password works correctly")
        else:
            print("   ❌ NEW password rejected (This indicates the bug)")
            print(f"   Error: {new_response.text}")
            
    except Exception as e:
        print(f"   ❌ New password test error: {e}")
    
    print("\n" + "=" * 50)
    print("🔍 Check the application logs for debug output")

if __name__ == "__main__":
    test_password_change()
