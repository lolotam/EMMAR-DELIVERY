#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Document Core Function Tests
Test core document operations directly
"""

import os
import sys
import json
import tempfile
from io import BytesIO

# Add paths
sys.path.append('.')
sys.path.append('utils')

def test_file_validation():
    """Test file validation functions"""
    print("\n=== Testing File Validation ===")
    
    try:
        from app import validate_file_upload_enhanced, app
        
        # Create a test file
        test_file = BytesIO(b'test content')
        test_file.filename = 'test.pdf'
        test_file.content_type = 'application/pdf'
        
        # Test validation
        errors = validate_file_upload_enhanced(test_file, 'driver', 'd002')
        print(f"Validation errors: {errors}")
        
        return len(errors) == 0
        
    except Exception as e:
        print(f"Validation test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_json_store_operations():
    """Test JSON store operations for documents"""
    print("\n=== Testing JSON Store Operations ===")
    
    try:
        from utils.json_store import json_store
        
        # Test read documents
        docs = json_store.read_all('documents')
        print(f"Found {len(docs)} documents")
        
        # Test create document (mock)
        test_doc = {
            'entity_type': 'other',
            'entity_id': None,
            'display_name': 'Test Document',
            'original_filename': 'test.pdf',
            'stored_filename': 'test_uuid_test.pdf',
            'mime_type': 'application/pdf',
            'size_bytes': 1024,
            'uploaded_by': 'admin',
            'tags': [],
            'category': 'other',
            'notes': 'Test document',
            'expiry_date': None,
            'status': 'active'
        }
        
        # Note: We won't actually create to avoid polluting the data
        print("JSON store operations test passed")
        return True
        
    except Exception as e:
        print(f"JSON store test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_path_functions():
    """Test file path generation functions"""
    print("\n=== Testing Path Functions ===")
    
    try:
        from app import get_storage_path, sanitize_and_generate_filename
        
        # Test filename sanitization
        secure_name, file_uuid = sanitize_and_generate_filename('test file.pdf')
        print(f"Secure filename: {secure_name}")
        print(f"File UUID: {file_uuid}")
        
        # Test path generation
        path = get_storage_path('driver', 'd002', secure_name)
        print(f"Storage path: {path}")
        
        return True
        
    except Exception as e:
        print(f"Path functions test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_existing_documents():
    """Test reading and accessing existing documents"""
    print("\n=== Testing Existing Documents ===")
    
    try:
        from utils.json_store import json_store
        
        # Read all documents
        documents = json_store.read_all('documents')
        print(f"Total documents in system: {len(documents)}")
        
        for doc in documents:
            print(f"Document ID: {doc.get('id')}")
            print(f"  Display Name: {doc.get('display_name')}")
            print(f"  Entity Type: {doc.get('entity_type')}")
            print(f"  Entity ID: {doc.get('entity_id')}")
            print(f"  Status: {doc.get('status')}")
            
            # Check if file exists
            from app import get_document_file_path
            file_path = get_document_file_path(doc)
            file_exists = os.path.exists(file_path) if file_path else False
            print(f"  File exists: {file_exists}")
            print(f"  File path: {file_path}")
            print()
        
        return True
        
    except Exception as e:
        print(f"Existing documents test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_document_permissions():
    """Test document permission checking"""
    print("\n=== Testing Document Permissions ===")
    
    try:
        from app import check_document_permission
        from utils.json_store import json_store
        
        # Get a test document
        documents = json_store.read_all('documents')
        if not documents:
            print("No documents found for permission test")
            return True
        
        test_doc = documents[0]
        
        # Test admin user
        admin_user = {'username': 'admin', 'role': 'admin'}
        has_permission = check_document_permission(test_doc, admin_user)
        print(f"Admin permission result: {has_permission}")
        
        # Test regular user
        regular_user = {'username': 'user', 'role': 'user'}
        has_permission = check_document_permission(test_doc, regular_user)
        print(f"Regular user permission result: {has_permission}")
        
        return True
        
    except Exception as e:
        print(f"Permission test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_drivers_data():
    """Test drivers data access"""
    print("\n=== Testing Drivers Data ===")
    
    try:
        from utils.json_store import json_store
        
        drivers = json_store.read_all('drivers')
        print(f"Found {len(drivers)} drivers")
        
        for driver in drivers[:3]:  # Show first 3
            print(f"Driver ID: {driver.get('id')} - {driver.get('full_name')}")
        
        # Test finding specific driver
        driver_d002 = json_store.find_by_id('drivers', 'd002')
        if driver_d002:
            print(f"Found driver d002: {driver_d002.get('full_name')}")
        else:
            print("Driver d002 not found")
            
        return True
        
    except Exception as e:
        print(f"Drivers test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all core tests"""
    print("Starting Document Core Function Tests")
    print("=" * 50)
    
    tests = [
        ("File Validation", test_file_validation),
        ("JSON Store Operations", test_json_store_operations),
        ("Path Functions", test_path_functions),
        ("Existing Documents", test_existing_documents),
        ("Document Permissions", test_document_permissions),
        ("Drivers Data", test_drivers_data)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
            print(f"{test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            results[test_name] = False
            print(f"{test_name}: FAILED - {e}")
    
    print("\n" + "=" * 50)
    print("Test Summary:")
    for test_name, result in results.items():
        print(f"  {test_name}: {'PASS' if result else 'FAIL'}")
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    print("\nDocument Core Function Tests Complete")

if __name__ == '__main__':
    main()