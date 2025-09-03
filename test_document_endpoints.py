#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Document Endpoints Test
Test HTTP endpoints for document operations
"""

import os
import sys
import json
from io import BytesIO

# Add paths
sys.path.append('.')
sys.path.append('utils')

from app import app

class MockFile:
    """Mock file object for testing"""
    def __init__(self, content, filename, content_type):
        self.stream = BytesIO(content)
        self.filename = filename
        self.content_type = content_type
        self._size = len(content)
    
    def read(self, size=-1):
        return self.stream.read(size)
    
    def seek(self, pos):
        return self.stream.seek(pos)
    
    def save(self, path):
        self.seek(0)
        with open(path, 'wb') as f:
            f.write(self.read())

def create_test_pdf_content():
    """Create test PDF content"""
    return b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\n0000000000 65535 f \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF'

def test_document_upload_endpoint():
    """Test the document upload HTTP endpoint"""
    print("\n=== Testing Document Upload Endpoint ===")
    
    with app.test_client() as client:
        # Set up session (simulate login)
        with client.session_transaction() as sess:
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['user'] = {'username': 'admin', 'role': 'admin', 'is_admin': True}
        
        # Create test file
        pdf_content = create_test_pdf_content()
        
        # Test data
        data = {
            'file': (BytesIO(pdf_content), 'test_license.pdf', 'application/pdf'),
            'entity_type': 'driver',
            'entity_id': 'd002',
            'display_name': 'Test Driver License Upload',
            'category': 'license',
            'notes': 'Test upload via HTTP endpoint'
        }
        
        try:
            response = client.post('/api/documents/upload', 
                                 data=data, 
                                 content_type='multipart/form-data')
            
            print(f"Upload Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.get_json()
                print(f"Upload Success: {result.get('success')}")
                print(f"Document ID: {result.get('document', {}).get('id')}")
                return result.get('document', {}).get('id')
            else:
                error_data = response.get_json()
                print(f"Upload Failed: {error_data}")
                return None
                
        except Exception as e:
            print(f"Upload endpoint test failed: {e}")
            import traceback
            traceback.print_exc()
            return None

def test_document_list_endpoint():
    """Test the document list HTTP endpoint"""
    print("\n=== Testing Document List Endpoint ===")
    
    with app.test_client() as client:
        # Set up session
        with client.session_transaction() as sess:
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['user'] = {'username': 'admin', 'role': 'admin', 'is_admin': True}
        
        try:
            response = client.get('/api/documents')
            
            print(f"List Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.get_json()
                documents = result.get('documents', [])
                print(f"Found {len(documents)} documents")
                return True
            else:
                error_data = response.get_json()
                print(f"List Failed: {error_data}")
                return False
                
        except Exception as e:
            print(f"List endpoint test failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def test_document_update_endpoint(document_id):
    """Test the document update HTTP endpoint"""
    print(f"\n=== Testing Document Update Endpoint (ID: {document_id}) ===")
    
    if not document_id:
        print("No document ID provided")
        return False
    
    with app.test_client() as client:
        # Set up session
        with client.session_transaction() as sess:
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['user'] = {'username': 'admin', 'role': 'admin', 'is_admin': True}
        
        # Update data
        update_data = {
            'display_name': 'Updated Test License',
            'notes': 'Updated via HTTP endpoint test'
        }
        
        try:
            response = client.put(f'/api/documents/{document_id}',
                                json=update_data,
                                content_type='application/json')
            
            print(f"Update Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.get_json()
                print(f"Update Success: {result.get('success')}")
                return True
            else:
                error_data = response.get_json()
                print(f"Update Failed: {error_data}")
                return False
                
        except Exception as e:
            print(f"Update endpoint test failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def test_document_download_endpoint(document_id):
    """Test the document download HTTP endpoint"""
    print(f"\n=== Testing Document Download Endpoint (ID: {document_id}) ===")
    
    if not document_id:
        print("No document ID provided")
        return False
    
    with app.test_client() as client:
        # Set up session
        with client.session_transaction() as sess:
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['user'] = {'username': 'admin', 'role': 'admin', 'is_admin': True}
        
        try:
            response = client.get(f'/api/documents/download/{document_id}')
            
            print(f"Download Response Status: {response.status_code}")
            print(f"Content Type: {response.content_type}")
            print(f"Content Length: {len(response.data)}")
            
            return response.status_code == 200
                
        except Exception as e:
            print(f"Download endpoint test failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def test_document_delete_endpoint(document_id):
    """Test the document delete HTTP endpoint"""
    print(f"\n=== Testing Document Delete Endpoint (ID: {document_id}) ===")
    
    if not document_id:
        print("No document ID provided")
        return False
    
    with app.test_client() as client:
        # Set up session
        with client.session_transaction() as sess:
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
            sess['user'] = {'username': 'admin', 'role': 'admin', 'is_admin': True}
        
        try:
            # Note: Delete requires CSRF token, but we'll try without for testing
            response = client.delete(f'/api/documents/{document_id}',
                                   headers={'X-CSRFToken': 'test-token-bypass'})
            
            print(f"Delete Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.get_json()
                print(f"Delete Success: {result.get('success')}")
                return True
            else:
                error_data = response.get_json()
                print(f"Delete Failed: {error_data}")
                return False
                
        except Exception as e:
            print(f"Delete endpoint test failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Run all endpoint tests"""
    print("Starting Document Endpoints Test")
    print("=" * 50)
    
    results = {}
    
    # Test 1: List documents
    results['list'] = test_document_list_endpoint()
    
    # Test 2: Upload document
    document_id = test_document_upload_endpoint()
    results['upload'] = document_id is not None
    
    if document_id:
        # Test 3: Update document
        results['update'] = test_document_update_endpoint(document_id)
        
        # Test 4: Download document  
        results['download'] = test_document_download_endpoint(document_id)
        
        # Test 5: Delete document (last)
        results['delete'] = test_document_delete_endpoint(document_id)
    else:
        print("Skipping other tests due to upload failure")
        results['update'] = False
        results['download'] = False
        results['delete'] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary:")
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        print(f"  {test_name.upper()}: {status}")
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("ALL DOCUMENT ENDPOINTS WORKING!")
    else:
        print("Some endpoints have issues")
    
    print("Document Endpoints Test Complete")

if __name__ == '__main__':
    main()