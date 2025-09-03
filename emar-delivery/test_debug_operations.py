#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug Document Operations Issues
Focus on update and delete problems
"""

import sys
sys.path.append('.')
sys.path.append('utils')

from app import app
from io import BytesIO

def setup_test_session(sess):
    """Setup authenticated session for testing"""
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

def create_test_document(client, csrf_token):
    """Create a test document for operations"""
    pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj'
    
    data = {
        'file': (BytesIO(pdf_content), 'test.pdf', 'application/pdf'),
        'display_name': 'Debug Test Document',
        'entity_type': 'driver',
        'entity_id': 'd002',
        'category': 'license',
        'notes': 'Debug test'
    }
    
    response = client.post('/api/documents/upload',
                         data=data,
                         headers={'X-CSRFToken': csrf_token},
                         content_type='multipart/form-data')
    
    if response.status_code == 200:
        result = response.get_json()
        return result.get('document', {}).get('id')
    return None

def debug_update_operation(client, doc_id):
    """Debug update operation"""
    print(f"\\n=== Debugging Update Operation (ID: {doc_id}) ===")
    
    update_data = {
        'display_name': 'Updated Test Name',
        'notes': 'Updated notes'
    }
    
    response = client.put(f'/api/documents/{doc_id}',
                        json=update_data,
                        content_type='application/json')
    
    print(f"Update Status: {response.status_code}")
    print(f"Content Type: {response.content_type}")
    
    if response.content_type == 'application/json':
        try:
            data = response.get_json()
            if data:
                # Safely handle potential Arabic text
                error_key = list(data.keys())[0] if data else 'unknown'
                print(f"Response has key: {error_key}")
            else:
                print("Empty JSON response")
        except Exception as e:
            print(f"Failed to parse JSON: {e}")
    else:
        # Handle HTML error responses
        text = response.data.decode('utf-8', errors='replace')[:200]
        print(f"HTML Response: {text}...")
    
    return response.status_code == 200

def debug_delete_operation(client, doc_id, csrf_token):
    """Debug delete operation"""
    print(f"\\n=== Debugging Delete Operation (ID: {doc_id}) ===")
    
    headers = {'X-CSRFToken': csrf_token}
    
    response = client.delete(f'/api/documents/{doc_id}', headers=headers)
    
    print(f"Delete Status: {response.status_code}")
    print(f"Content Type: {response.content_type}")
    
    if response.content_type == 'application/json':
        try:
            data = response.get_json()
            if data:
                # Safely handle potential Arabic text
                success = data.get('success', False)
                print(f"Success: {success}")
                if not success and 'error' in data:
                    print("Error present in response")
            else:
                print("Empty JSON response")
        except Exception as e:
            print(f"Failed to parse JSON: {e}")
    else:
        # Handle HTML error responses
        text = response.data.decode('utf-8', errors='replace')[:200]
        print(f"HTML Response: {text}...")
    
    return response.status_code == 200

def main():
    """Debug document operations"""
    print("Starting Document Operations Debug")
    print("=" * 50)
    
    with app.test_client() as client:
        with client.session_transaction() as sess:
            setup_test_session(sess)
        
        csrf_token = get_csrf_token(client)
        if not csrf_token:
            print("Failed to get CSRF token")
            return
        
        # Create test document
        doc_id = create_test_document(client, csrf_token)
        if not doc_id:
            print("Failed to create test document")
            return
        
        print(f"Created test document: {doc_id}")
        
        # Debug update
        update_success = debug_update_operation(client, doc_id)
        print(f"Update Result: {'SUCCESS' if update_success else 'FAILED'}")
        
        # Debug delete
        delete_success = debug_delete_operation(client, doc_id, csrf_token)
        print(f"Delete Result: {'SUCCESS' if delete_success else 'FAILED'}")
        
        # If delete failed, try to clean up manually
        if not delete_success:
            print("\\nAttempting manual cleanup...")
            try:
                from utils.json_store import json_store
                from app import get_document_file_path
                import os
                
                document = json_store.find_by_id('documents', doc_id)
                if document:
                    file_path = get_document_file_path(document)
                    if file_path and os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"Removed file: {file_path}")
                    
                    json_store.delete('documents', doc_id)
                    print(f"Removed record: {doc_id}")
            except Exception as e:
                print(f"Manual cleanup failed: {e}")
    
    print("\\nDocument Operations Debug Complete")

if __name__ == '__main__':
    main()