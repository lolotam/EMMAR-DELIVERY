#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Document Upload with CSRF Token
"""

import sys
sys.path.append('.')
sys.path.append('utils')

from app import app
from io import BytesIO
import json

def test_upload_with_csrf():
    """Test upload with proper CSRF token"""
    print("Testing upload with CSRF token...")
    
    with app.test_client() as client:
        # Step 1: Authenticate
        with client.session_transaction() as sess:
            sess['is_authenticated'] = True
            sess['user_id'] = 'admin'
            sess['username'] = 'admin'
            sess['login_time'] = '2025-09-03T08:00:00'
        
        # Step 2: Get CSRF token
        csrf_response = client.get('/api/csrf-token')
        print(f"CSRF token response status: {csrf_response.status_code}")
        
        if csrf_response.status_code != 200:
            print("Failed to get CSRF token")
            return False
        
        csrf_data = csrf_response.get_json()
        csrf_token = csrf_data.get('csrf_token')
        print(f"CSRF token: {csrf_token}")
        
        if not csrf_token:
            print("No CSRF token in response")
            return False
        
        # Step 3: Upload with CSRF token
        pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\n0000000000 65535 f \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF'
        
        data = {
            'file': (BytesIO(pdf_content), 'test.pdf', 'application/pdf'),
            'display_name': 'Test Document with CSRF',
            'entity_type': 'driver', 
            'entity_id': 'd002',
            'category': 'license',
            'notes': 'Test upload with CSRF',
            'csrf_token': csrf_token  # Include CSRF token in form data
        }
        
        # Also include CSRF token in headers
        headers = {
            'X-CSRFToken': csrf_token
        }
        
        print("Sending upload request with CSRF token...")
        response = client.post('/api/documents/upload',
                             data=data,
                             headers=headers,
                             content_type='multipart/form-data')
        
        print(f"Upload Status Code: {response.status_code}")
        print(f"Content Type: {response.content_type}")
        
        if response.status_code == 200:
            result = response.get_json()
            print(f"Upload Success: {result.get('success')}")
            doc_id = result.get('document', {}).get('id')
            print(f"Document ID: {doc_id}")
            return doc_id
        else:
            print(f"Upload failed with status {response.status_code}")
            if response.content_type == 'application/json':
                try:
                    error_data = response.get_json()
                    print(f"Error JSON: {error_data}")
                except:
                    pass
            else:
                try:
                    text_data = response.data.decode('utf-8')
                    print(f"Error Text: {text_data[:500]}...")
                except:
                    print(f"Raw error data: {response.data[:200]}")
            return None

def main():
    print("Starting CSRF Upload Test")
    print("=" * 40)
    
    doc_id = test_upload_with_csrf()
    
    if doc_id:
        print(f"\nSUCCESS: Document uploaded with ID {doc_id}")
        
        # Clean up - delete the test document
        try:
            from utils.json_store import json_store
            from app import get_document_file_path
            import os
            
            document = json_store.find_by_id('documents', doc_id)
            if document:
                file_path = get_document_file_path(document)
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"Deleted test file: {file_path}")
                
                json_store.delete('documents', doc_id)
                print(f"Deleted document record: {doc_id}")
        except Exception as e:
            print(f"Cleanup error: {e}")
    else:
        print("\nFAILED: Document upload failed")
    
    print("\nCSRF Upload Test Complete")

if __name__ == '__main__':
    main()