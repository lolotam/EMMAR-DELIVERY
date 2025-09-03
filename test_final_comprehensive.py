#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final Comprehensive Document Operations Test
Tests all operations with proper CSRF handling
"""

import sys
sys.path.append('.')
sys.path.append('utils')

from app import app
from io import BytesIO

def setup_test_session(sess):
    """Setup authenticated session"""
    sess['is_authenticated'] = True
    sess['user_id'] = 'admin'
    sess['username'] = 'admin'
    sess['login_time'] = '2025-09-03T08:00:00'

def get_csrf_token(client):
    """Get CSRF token"""
    response = client.get('/api/csrf-token')
    if response.status_code == 200:
        return response.get_json().get('csrf_token')
    return None

def test_comprehensive_operations():
    """Test all document operations comprehensively"""
    results = {}
    
    with app.test_client() as client:
        # Setup session
        with client.session_transaction() as sess:
            setup_test_session(sess)
        
        # Get CSRF token
        csrf_token = get_csrf_token(client)
        if not csrf_token:
            print("FAILED: Could not get CSRF token")
            return
        
        print(f"CSRF Token obtained: {csrf_token[:20]}...")
        
        # Test 1: List documents
        print("\\n1. Testing document list...")
        response = client.get('/api/documents')
        results['list'] = response.status_code == 200
        print(f"   Status: {response.status_code} - {'PASS' if results['list'] else 'FAIL'}")
        
        # Test 2: Upload document
        print("\\n2. Testing document upload...")
        pdf_content = b'%PDF-1.4\\n1 0 obj\\n<< /Type /Catalog >>\\nendobj'
        data = {
            'file': (BytesIO(pdf_content), 'final_test.pdf', 'application/pdf'),
            'display_name': 'Final Test Document',
            'entity_type': 'driver',
            'entity_id': 'd002',
            'category': 'license',
            'notes': 'Final comprehensive test'
        }
        
        response = client.post('/api/documents/upload',
                             data=data,
                             headers={'X-CSRFToken': csrf_token},
                             content_type='multipart/form-data')
        
        results['upload'] = response.status_code == 200
        doc_id = None
        if results['upload']:
            doc_data = response.get_json()
            doc_id = doc_data.get('document', {}).get('id')
        
        print(f"   Status: {response.status_code} - {'PASS' if results['upload'] else 'FAIL'}")
        if doc_id:
            print(f"   Document ID: {doc_id}")
        
        if not doc_id:
            print("Cannot continue without document ID")
            return results
        
        # Test 3: Document info
        print("\\n3. Testing document info...")
        response = client.get(f'/api/documents/{doc_id}/info')
        results['info'] = response.status_code == 200
        print(f"   Status: {response.status_code} - {'PASS' if results['info'] else 'FAIL'}")
        
        # Test 4: Update document (WITH CSRF)
        print("\\n4. Testing document update with CSRF...")
        update_data = {
            'display_name': 'Updated Final Test Document',
            'notes': 'Updated in comprehensive test'
        }
        
        # Include CSRF in headers for PUT request
        response = client.put(f'/api/documents/{doc_id}',
                            json=update_data,
                            headers={'X-CSRFToken': csrf_token},
                            content_type='application/json')
        
        results['update'] = response.status_code == 200
        print(f"   Status: {response.status_code} - {'PASS' if results['update'] else 'FAIL'}")
        if not results['update']:
            print(f"   Error details: {response.data}")
        
        # Test 5: Download document
        print("\\n5. Testing document download...")
        response = client.get(f'/api/documents/download/{doc_id}')
        results['download'] = response.status_code == 200
        print(f"   Status: {response.status_code} - {'PASS' if results['download'] else 'FAIL'}")
        if results['download']:
            print(f"   Content-Type: {response.content_type}")
            print(f"   Content-Length: {len(response.data)}")
        
        # Test 6: Preview document
        print("\\n6. Testing document preview...")
        response = client.get(f'/api/documents/preview/{doc_id}')
        results['preview'] = response.status_code == 200
        print(f"   Status: {response.status_code} - {'PASS' if results['preview'] else 'FAIL'}")
        
        # Test 7: Delete document (WITH CSRF)
        print("\\n7. Testing document delete...")
        response = client.delete(f'/api/documents/{doc_id}',
                               headers={'X-CSRFToken': csrf_token})
        
        results['delete'] = response.status_code == 200
        print(f"   Status: {response.status_code} - {'PASS' if results['delete'] else 'FAIL'}")
        if not results['delete']:
            # Try to get error details safely
            try:
                if response.content_type == 'application/json':
                    error_data = response.get_json()
                    print(f"   Error: Operation failed with JSON response")
                else:
                    print(f"   Error: Non-JSON response")
            except:
                print(f"   Error: Could not parse error response")
            
            # Manual cleanup if delete failed
            print("   Attempting manual cleanup...")
            try:
                from utils.json_store import json_store
                from app import get_document_file_path
                import os
                
                document = json_store.find_by_id('documents', doc_id)
                if document:
                    file_path = get_document_file_path(document)
                    if file_path and os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"   Cleaned up file: {file_path}")
                    
                    json_store.delete('documents', doc_id)
                    print(f"   Cleaned up record: {doc_id}")
            except Exception as e:
                print(f"   Cleanup failed: {e}")
    
    return results

def main():
    """Run final comprehensive test"""
    print("FINAL COMPREHENSIVE DOCUMENT OPERATIONS TEST")
    print("=" * 60)
    print("Testing all document operations with proper authentication and CSRF")
    print("=" * 60)
    
    results = test_comprehensive_operations()
    
    if not results:
        print("Test failed to run properly")
        return
    
    # Generate report
    print("\\n" + "=" * 60)
    print("FINAL TEST RESULTS")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for operation, success in results.items():
        status = "PASS" if success else "FAIL"
        print(f"{operation.upper():<12}: {status}")
        if success:
            passed += 1
    
    print("-" * 30)
    print(f"TOTAL PASSED: {passed}/{total}")
    
    percentage = (passed / total) * 100 if total > 0 else 0
    
    print("\\n" + "=" * 60)
    if passed == total:
        print("PERFECT! ALL DOCUMENT OPERATIONS WORKING!")
        print("The document management system is fully functional.")
        print("Upload, view, edit, download, and delete all work correctly.")
    elif percentage >= 85:
        print("EXCELLENT! Most operations working correctly.")
        print(f"Success rate: {percentage:.1f}%")
        print("Minor issues detected but system is highly functional.")
    elif percentage >= 70:
        print("GOOD! Core operations working.")
        print(f"Success rate: {percentage:.1f}%")
        print("Some issues detected but system is largely functional.")
    else:
        print("NEEDS ATTENTION! Multiple operations failing.")
        print(f"Success rate: {percentage:.1f}%")
        print("Critical issues detected that need immediate fixing.")
    
    print("=" * 60)
    print("FINAL COMPREHENSIVE TEST COMPLETE")

if __name__ == '__main__':
    main()