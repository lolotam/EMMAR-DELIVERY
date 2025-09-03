#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive Document Function Tests
Test upload, edit, download, view, delete operations
"""

import os
import sys
import json
import tempfile
from io import BytesIO

# Add paths
sys.path.append('.')
sys.path.append('utils')

from app import app
from utils.json_store import json_store

def create_test_file():
    """Create a test PDF file for upload"""
    content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF'
    return BytesIO(content)

def test_document_upload():
    """Test document upload functionality"""
    print("\n=== Testing Document Upload ===")
    
    with app.test_client() as client:
        # Login first
        with client.session_transaction() as sess:
            sess['user'] = {'username': 'admin', 'role': 'admin'}
        
        # Test 1: Upload document for existing driver
        test_file = create_test_file()
        data = {
            'file': (test_file, 'test_driver_license.pdf'),
            'entity_type': 'driver',
            'entity_id': 'd002',  # Existing driver from drivers.json
            'display_name': 'رخصة القيادة - اختبار',
            'category': 'license',
            'notes': 'ملف اختبار للنظام'
        }
        
        response = client.post('/api/documents/upload', 
                             data=data, 
                             content_type='multipart/form-data')
        
        print(f"Upload Response Status: {response.status_code}")
        print(f"Upload Response Data: {response.get_json()}")
        
        if response.status_code == 200:
            upload_result = response.get_json()
            return upload_result.get('document', {}).get('id')
        else:
            print("❌ Upload failed")
            return None

def test_document_edit(document_id):
    """Test document edit functionality"""
    print(f"\n=== Testing Document Edit (ID: {document_id}) ===")
    
    if not document_id:
        print("No document ID provided for edit test")
        return False
    
    with app.test_client() as client:
        # Login
        with client.session_transaction() as sess:
            sess['user'] = {'username': 'admin', 'role': 'admin'}
        
        # Test update
        update_data = {
            'display_name': 'رخصة القيادة - محدثة',
            'category': 'license',
            'notes': 'تم تحديث الملاحظات'
        }
        
        response = client.put(f'/api/documents/{document_id}',
                            json=update_data,
                            content_type='application/json')
        
        print(f"Edit Response Status: {response.status_code}")
        print(f"Edit Response Data: {response.get_json()}")
        
        return response.status_code == 200

def test_document_download(document_id):
    """Test document download functionality"""
    print(f"\n=== Testing Document Download (ID: {document_id}) ===")
    
    if not document_id:
        print("No document ID provided for download test")
        return False
    
    with app.test_client() as client:
        # Login
        with client.session_transaction() as sess:
            sess['user'] = {'username': 'admin', 'role': 'admin'}
        
        response = client.get(f'/api/documents/download/{document_id}')
        
        print(f"Download Response Status: {response.status_code}")
        print(f"Download Content Type: {response.content_type}")
        print(f"Download Content Length: {len(response.data)}")
        
        return response.status_code == 200

def test_document_preview(document_id):
    """Test document preview functionality"""
    print(f"\n=== Testing Document Preview (ID: {document_id}) ===")
    
    if not document_id:
        print("No document ID provided for preview test")
        return False
    
    with app.test_client() as client:
        # Login
        with client.session_transaction() as sess:
            sess['user'] = {'username': 'admin', 'role': 'admin'}
        
        response = client.get(f'/api/documents/preview/{document_id}')
        
        print(f"Preview Response Status: {response.status_code}")
        print(f"Preview Content Type: {response.content_type}")
        
        return response.status_code == 200

def test_document_delete(document_id):
    """Test document delete functionality"""
    print(f"\n=== Testing Document Delete (ID: {document_id}) ===")
    
    if not document_id:
        print("No document ID provided for delete test")
        return False
    
    with app.test_client() as client:
        # Login
        with client.session_transaction() as sess:
            sess['user'] = {'username': 'admin', 'role': 'admin'}
        
        # Get CSRF token
        response = client.get('/documents')  # Get a page to get CSRF token
        csrf_token = None
        # For testing, we'll skip CSRF validation by modifying headers
        
        response = client.delete(f'/api/documents/{document_id}',
                               headers={'X-CSRFToken': 'test-token'})
        
        print(f"Delete Response Status: {response.status_code}")
        print(f"Delete Response Data: {response.get_json()}")
        
        return response.status_code == 200

def test_document_list():
    """Test document listing functionality"""
    print("\n=== Testing Document List ===")
    
    with app.test_client() as client:
        # Login
        with client.session_transaction() as sess:
            sess['user'] = {'username': 'admin', 'role': 'admin'}
        
        response = client.get('/api/documents')
        
        print(f"List Response Status: {response.status_code}")
        if response.status_code == 200:
            documents = response.get_json()
            print(f"Number of documents: {len(documents.get('documents', []))}")
            return documents.get('documents', [])
        else:
            print(f"List Response Error: {response.get_json()}")
            return []

def main():
    """Run all document function tests"""
    print("Starting Document Function Tests")
    print("=" * 50)
    
    # Test 1: List existing documents
    existing_docs = test_document_list()
    
    # Test 2: Upload new document
    uploaded_doc_id = test_document_upload()
    
    if uploaded_doc_id:
        print(f"Successfully uploaded document with ID: {uploaded_doc_id}")
        
        # Test 3: Edit document
        edit_success = test_document_edit(uploaded_doc_id)
        print(f"Edit test result: {'SUCCESS' if edit_success else 'FAILED'}")
        
        # Test 4: Download document  
        download_success = test_document_download(uploaded_doc_id)
        print(f"Download test result: {'SUCCESS' if download_success else 'FAILED'}")
        
        # Test 5: Preview document
        preview_success = test_document_preview(uploaded_doc_id)
        print(f"Preview test result: {'SUCCESS' if preview_success else 'FAILED'}")
        
        # Test 6: Delete document (last test)
        delete_success = test_document_delete(uploaded_doc_id)
        print(f"Delete test result: {'SUCCESS' if delete_success else 'FAILED'}")
    else:
        print("Upload failed, cannot test other operations")
    
    print("\n" + "=" * 50)
    print("Document Function Tests Complete")

if __name__ == '__main__':
    main()