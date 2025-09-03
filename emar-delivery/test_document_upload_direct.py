#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Direct Document Upload Test
Test document upload without HTTP layer
"""

import os
import sys
import tempfile
from io import BytesIO

# Add paths
sys.path.append('.')
sys.path.append('utils')

def create_test_pdf():
    """Create a simple test PDF"""
    content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\n0000000000 65535 f \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF'
    return BytesIO(content)

def test_upload_process():
    """Test the document upload process step by step"""
    print("=== Testing Document Upload Process ===")
    
    try:
        from app import (validate_file_upload_enhanced, sanitize_and_generate_filename, 
                        get_storage_path, extract_file_metadata, scan_file_for_threats)
        from utils.json_store import json_store
        
        # Step 1: Create test file
        print("Step 1: Creating test file...")
        test_file = create_test_pdf()
        test_file.filename = 'driver_license_test.pdf'
        test_file.content_type = 'application/pdf'
        print("Test file created successfully")
        
        # Step 2: Validate file
        print("Step 2: Validating file...")
        validation_errors = validate_file_upload_enhanced(test_file, 'driver', 'd002')
        if validation_errors:
            print(f"Validation errors: {validation_errors}")
            return False
        print("File validation passed")
        
        # Step 3: Scan for threats
        print("Step 3: Scanning for threats...")
        threats = scan_file_for_threats(test_file, test_file.filename)
        if threats:
            print(f"Threats detected: {threats}")
            return False
        print("Threat scan passed")
        
        # Step 4: Generate secure filename
        print("Step 4: Generating secure filename...")
        secure_name, file_uuid = sanitize_and_generate_filename(test_file.filename)
        print(f"Secure filename: {secure_name}")
        
        # Step 5: Get storage path
        print("Step 5: Getting storage path...")
        file_path = get_storage_path('driver', 'd002', secure_name)
        print(f"Storage path: {file_path}")
        
        # Step 6: Extract metadata
        print("Step 6: Extracting metadata...")
        metadata = extract_file_metadata(test_file, test_file.filename, file_path)
        print(f"Metadata: {metadata}")
        
        # Step 7: Ensure directory exists
        print("Step 7: Creating directory...")
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Step 8: Save file
        print("Step 8: Saving file...")
        with open(file_path, 'wb') as f:
            test_file.seek(0)  # Reset file pointer
            f.write(test_file.read())
        print(f"File saved to: {file_path}")
        
        # Step 9: Create document record
        print("Step 9: Creating document record...")
        document_data = {
            'entity_type': 'driver',
            'entity_id': 'd002',
            'display_name': 'Test Driver License',
            'original_filename': test_file.filename,
            'stored_filename': secure_name,
            'mime_type': metadata['mime_type'],
            'size_bytes': metadata['size_bytes'],
            'uploaded_by': 'admin',
            'tags': [],
            'category': 'license',
            'notes': 'Test upload document',
            'expiry_date': None,
            'status': 'active'
        }
        
        document = json_store.create('documents', document_data)
        print(f"Document created with ID: {document['id']}")
        
        # Step 10: Verify file exists
        print("Step 10: Verifying file exists...")
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"File exists with size: {file_size} bytes")
        else:
            print("ERROR: File does not exist after save")
            return False
        
        print("Upload process completed successfully!")
        return document['id']
        
    except Exception as e:
        print(f"Upload process failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_document_operations(doc_id):
    """Test document operations"""
    if not doc_id:
        print("No document ID to test operations")
        return
    
    print(f"\n=== Testing Document Operations (ID: {doc_id}) ===")
    
    try:
        from utils.json_store import json_store
        from app import get_document_file_path, check_document_permission
        
        # Test 1: Read document
        print("Test 1: Reading document...")
        document = json_store.find_by_id('documents', doc_id)
        if document:
            print("Document found in database")
        else:
            print("ERROR: Document not found in database")
            return False
        
        # Test 2: Check file path
        print("Test 2: Checking file path...")
        file_path = get_document_file_path(document)
        if file_path and os.path.exists(file_path):
            print(f"File exists at: {file_path}")
        else:
            print("ERROR: Document file not found")
            return False
        
        # Test 3: Check permissions
        print("Test 3: Checking permissions...")
        admin_user = {'username': 'admin', 'role': 'admin'}
        has_permission = check_document_permission(document, admin_user)
        print(f"Admin has permission: {has_permission}")
        
        # Test 4: Update document
        print("Test 4: Updating document...")
        updates = {'notes': 'Updated test notes'}
        updated_doc = json_store.update('documents', doc_id, updates)
        if updated_doc:
            print("Document updated successfully")
        else:
            print("ERROR: Document update failed")
            return False
        
        print("All document operations passed!")
        return True
        
    except Exception as e:
        print(f"Document operations test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def cleanup_test_document(doc_id):
    """Clean up test document"""
    if not doc_id:
        return
    
    print(f"\n=== Cleaning up test document {doc_id} ===")
    
    try:
        from utils.json_store import json_store
        from app import get_document_file_path
        
        # Get document
        document = json_store.find_by_id('documents', doc_id)
        if not document:
            print("Document already deleted or not found")
            return
        
        # Get file path
        file_path = get_document_file_path(document)
        
        # Delete file
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted file: {file_path}")
            
            # Remove empty directories
            dir_path = os.path.dirname(file_path)
            try:
                os.rmdir(dir_path)  # Only removes if empty
                print(f"Removed empty directory: {dir_path}")
            except OSError:
                pass  # Directory not empty
        
        # Delete database record
        deleted = json_store.delete('documents', doc_id)
        if deleted:
            print("Document record deleted from database")
        else:
            print("ERROR: Failed to delete document record")
        
    except Exception as e:
        print(f"Cleanup failed: {e}")

def main():
    """Run direct upload test"""
    print("Starting Direct Document Upload Test")
    print("=" * 50)
    
    # Test upload process
    doc_id = test_upload_process()
    
    if doc_id:
        # Test document operations
        operations_success = test_document_operations(doc_id)
        
        # Cleanup
        cleanup_test_document(doc_id)
        
        if operations_success:
            print("\nALL TESTS PASSED!")
        else:
            print("\nSome tests failed")
    else:
        print("\nUpload test failed - cannot proceed")
    
    print("Direct Document Upload Test Complete")

if __name__ == '__main__':
    main()