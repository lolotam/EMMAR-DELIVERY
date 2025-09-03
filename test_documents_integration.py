#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Documents Integration with JSON Store
اختبار تكامل الوثائق مع مخزن JSON
"""

import sys
import os

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from json_store import json_store

def test_documents_integration():
    """Test documents.json integration with json_store"""
    
    print("🧪 Testing Documents Integration with JSON Store...")
    
    try:
        # Test 1: Read empty documents collection
        print("\n1️⃣ Testing read empty documents collection...")
        documents = json_store.read_all('documents')
        print(f"✅ Read documents: {len(documents)} records")
        assert isinstance(documents, list), "Documents should be a list"
        
        # Test 2: Create a test document record
        print("\n2️⃣ Testing create document record...")
        test_document = {
            "entity_type": "driver",
            "entity_id": "test_driver_001",
            "display_name": "نسخة الهوية المدنية - اختبار",
            "original_filename": "test_civil_id.pdf",
            "stored_filename": "uuid123__test_civil_id.pdf",
            "mime_type": "application/pdf",
            "size_bytes": 1048576,
            "uploaded_by": "admin",
            "tags": ["هوية", "اختبار"],
            "category": "id_copy",
            "notes": "ملف اختبار للتكامل",
            "expiry_date": "2026-12-31",
            "status": "active"
        }
        
        created_doc = json_store.create('documents', test_document)
        print(f"✅ Created document: {created_doc['id']}")
        assert 'id' in created_doc, "Document should have an ID"
        assert 'created_at' in created_doc, "Document should have created_at timestamp"
        assert 'updated_at' in created_doc, "Document should have updated_at timestamp"
        
        # Test 3: Read the created document
        print("\n3️⃣ Testing read created document...")
        found_doc = json_store.find_by_id('documents', created_doc['id'])
        print(f"✅ Found document: {found_doc['display_name']}")
        assert found_doc is not None, "Document should be found"
        assert found_doc['entity_type'] == 'driver', "Entity type should match"
        
        # Test 4: Update the document
        print("\n4️⃣ Testing update document...")
        updates = {
            "notes": "ملف اختبار محدث للتكامل",
            "status": "verified"
        }
        updated_doc = json_store.update('documents', created_doc['id'], updates)
        print(f"✅ Updated document: {updated_doc['notes']}")
        assert updated_doc['status'] == 'verified', "Status should be updated"
        assert updated_doc['notes'] == updates['notes'], "Notes should be updated"
        
        # Test 5: Filter documents
        print("\n5️⃣ Testing filter documents...")
        driver_docs = json_store.filter_records('documents', {'entity_type': 'driver'})
        print(f"✅ Found {len(driver_docs)} driver documents")
        assert len(driver_docs) >= 1, "Should find at least one driver document"
        
        # Test 6: Count documents
        print("\n6️⃣ Testing count documents...")
        total_count = json_store.count('documents')
        driver_count = json_store.count('documents', {'entity_type': 'driver'})
        print(f"✅ Total documents: {total_count}, Driver documents: {driver_count}")
        assert total_count >= 1, "Should have at least one document"
        assert driver_count >= 1, "Should have at least one driver document"
        
        # Test 7: Delete the test document
        print("\n7️⃣ Testing delete document...")
        deleted = json_store.delete('documents', created_doc['id'])
        print(f"✅ Deleted document: {deleted}")
        assert deleted == True, "Document should be deleted successfully"
        
        # Test 8: Verify deletion
        print("\n8️⃣ Testing verify deletion...")
        deleted_doc = json_store.find_by_id('documents', created_doc['id'])
        print(f"✅ Document after deletion: {deleted_doc}")
        assert deleted_doc is None, "Document should not be found after deletion"
        
        print("\n🎉 All tests passed! Documents integration is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_documents_integration()
    if success:
        print("\n✅ Documents integration test completed successfully!")
    else:
        print("\n❌ Documents integration test failed!")
        sys.exit(1)
