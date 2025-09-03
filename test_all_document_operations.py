#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test All Document Operations
Comprehensive test of upload, edit, download, view, delete operations
"""

import sys
sys.path.append('.')
sys.path.append('utils')

from app import app
from io import BytesIO
import json

def setup_test_session(sess):
    """Setup authenticated session for testing"""
    sess['is_authenticated'] = True
    sess['user_id'] = 'admin'
    sess['username'] = 'admin'
    sess['login_time'] = '2025-09-03T08:00:00'

def get_csrf_token(client):
    """Get CSRF token for requests"""
    response = client.get('/api/csrf-token')
    if response.status_code == 200:
        data = response.get_json()
        return data.get('csrf_token')
    return None

def create_test_pdf():
    """Create test PDF content"""
    return b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\n0000000000 65535 f \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF'

def test_document_upload(client, csrf_token):
    """Test document upload"""
    print("\n=== Testing Document Upload ===")
    
    data = {
        'file': (BytesIO(create_test_pdf()), 'test_license.pdf', 'application/pdf'),
        'display_name': 'Test Driver License',
        'entity_type': 'driver',
        'entity_id': 'd002',
        'category': 'license',
        'notes': 'Test document upload'
    }
    
    headers = {'X-CSRFToken': csrf_token}
    
    response = client.post('/api/documents/upload',
                         data=data,
                         headers=headers,
                         content_type='multipart/form-data')
    
    print(f"Upload Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.get_json()
        doc_id = result.get('document', {}).get('id')
        print(f"Upload Success: Document ID {doc_id}")
        return doc_id
    else:
        print(f"Upload Failed: {response.get_json()}")
        return None

def test_document_list(client):
    """Test document list"""
    print("\n=== Testing Document List ===")
    
    response = client.get('/api/documents')
    print(f"List Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.get_json()
        documents = result.get('documents', [])
        print(f"Found {len(documents)} documents")
        return True
    else:
        print(f"List Failed: {response.get_json()}")
        return False

def test_document_update(client, doc_id):
    """Test document update"""
    print(f"\n=== Testing Document Update (ID: {doc_id}) ===")
    
    if not doc_id:
        print("No document ID provided")
        return False
    
    update_data = {
        'display_name': 'Updated Test License',
        'notes': 'Updated via test suite'
    }
    
    response = client.put(f'/api/documents/{doc_id}',
                        json=update_data,
                        content_type='application/json')
    
    print(f"Update Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.get_json()
        print(f"Update Success: {result.get('success')}")
        return True
    else:
        print(f"Update Failed: {response.get_json()}")
        return False

def test_document_info(client, doc_id):
    """Test document info retrieval"""
    print(f"\n=== Testing Document Info (ID: {doc_id}) ===")
    
    if not doc_id:
        print("No document ID provided")
        return False
    
    response = client.get(f'/api/documents/{doc_id}/info')
    
    print(f"Info Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.get_json()
        print(f"Document info retrieved successfully")
        return True
    else:
        print(f"Info Failed: {response.get_json()}")
        return False

def test_document_download(client, doc_id):
    """Test document download"""
    print(f"\n=== Testing Document Download (ID: {doc_id}) ===")
    
    if not doc_id:
        print("No document ID provided")
        return False
    
    response = client.get(f'/api/documents/download/{doc_id}')
    
    print(f"Download Status: {response.status_code}")
    print(f"Content Type: {response.content_type}")
    print(f"Content Length: {len(response.data)}")
    
    return response.status_code == 200

def test_document_preview(client, doc_id):
    """Test document preview"""
    print(f"\n=== Testing Document Preview (ID: {doc_id}) ===")
    
    if not doc_id:
        print("No document ID provided")
        return False
    
    response = client.get(f'/api/documents/preview/{doc_id}')
    
    print(f"Preview Status: {response.status_code}")
    
    return response.status_code == 200

def test_document_delete(client, doc_id, csrf_token):
    """Test document delete"""
    print(f"\n=== Testing Document Delete (ID: {doc_id}) ===")
    
    if not doc_id:
        print("No document ID provided")
        return False
    
    headers = {'X-CSRFToken': csrf_token}
    
    response = client.delete(f'/api/documents/{doc_id}', headers=headers)
    
    print(f"Delete Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.get_json()
        print(f"Delete Success: {result.get('success')}")
        return True
    else:
        print(f"Delete Failed: {response.get_json()}")
        return False

def main():
    """Run comprehensive document operation tests"""
    print("Starting Comprehensive Document Operations Test")
    print("=" * 60)
    
    with app.test_client() as client:
        # Setup session
        with client.session_transaction() as sess:
            setup_test_session(sess)
        
        # Get CSRF token
        csrf_token = get_csrf_token(client)
        if not csrf_token:
            print("Failed to get CSRF token")
            return
        
        print(f"CSRF Token: {csrf_token[:20]}...")
        
        results = {}
        
        # Test 1: List documents (baseline)
        results['list'] = test_document_list(client)
        
        # Test 2: Upload document
        doc_id = test_document_upload(client, csrf_token)
        results['upload'] = doc_id is not None
        
        if doc_id:
            # Test 3: Document info
            results['info'] = test_document_info(client, doc_id)
            
            # Test 4: Update document
            results['update'] = test_document_update(client, doc_id)
            
            # Test 5: Download document
            results['download'] = test_document_download(client, doc_id)
            
            # Test 6: Preview document
            results['preview'] = test_document_preview(client, doc_id)
            
            # Test 7: Delete document (cleanup)
            results['delete'] = test_document_delete(client, doc_id, csrf_token)
        else:
            print("\nSkipping other tests due to upload failure")
            results.update({
                'info': False,
                'update': False,
                'download': False,
                'preview': False,
                'delete': False
            })
    
    # Summary
    print("\n" + "=" * 60)
    print("COMPREHENSIVE TEST RESULTS:")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        print(f"  {test_name.upper():<12}: {status}")
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    
    print(f"\nOverall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL DOCUMENT OPERATIONS WORKING PERFECTLY!")
        print("The document management system is fully functional.")
    elif passed >= total * 0.8:
        print("\n✅ Most document operations working well!")
        print("Minor issues detected but system is largely functional.")
    else:
        print("\n⚠️  Some document operations need attention.")
        print("Critical issues detected that need fixing.")
    
    print("\nComprehensive Document Operations Test Complete")

if __name__ == '__main__':
    main()