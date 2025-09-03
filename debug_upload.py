#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug Upload Issues
"""

import sys
sys.path.append('.')
sys.path.append('utils')

from app import app
from io import BytesIO
import json

# Test the upload with detailed debugging
with app.test_client() as client:
    with client.session_transaction() as sess:
        sess['is_authenticated'] = True
        sess['user_id'] = 'admin'
        sess['username'] = 'admin'
        sess['login_time'] = '2025-09-03T08:00:00'

    # Create test file
    pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\n0000000000 65535 f \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF'
    
    data = {
        'file': (BytesIO(pdf_content), 'test.pdf', 'application/pdf'),
        'display_name': 'Test Document',
        'entity_type': 'driver', 
        'entity_id': 'd002',
        'category': 'license',
        'notes': 'Test upload'
    }
    
    print("Sending upload request...")
    response = client.post('/api/documents/upload',
                         data=data,
                         content_type='multipart/form-data')
    
    print(f"Status Code: {response.status_code}")
    print(f"Content Type: {response.content_type}")
    print(f"Response Data: {response.data}")
    
    if response.content_type == 'application/json':
        try:
            json_data = response.get_json()
            print(f"JSON Response: {json_data}")
        except Exception as e:
            print(f"Failed to parse JSON: {e}")
    else:
        try:
            text_data = response.data.decode('utf-8')
            print(f"Text Response: {text_data}")
        except Exception as e:
            print(f"Failed to decode text: {e}")