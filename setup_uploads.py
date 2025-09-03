#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup Upload Directory Structure for Documents Management
إعداد هيكل مجلدات الرفع لإدارة الوثائق
"""

import os
import stat

def setup_upload_directories():
    """Create upload directory structure with proper permissions"""
    
    # Base upload directory
    base_upload_dir = "uploads"
    documents_dir = os.path.join(base_upload_dir, "documents")
    
    # Subdirectories for different entity types
    subdirs = [
        os.path.join(documents_dir, "drivers"),
        os.path.join(documents_dir, "vehicles"), 
        os.path.join(documents_dir, "other")
    ]
    
    try:
        # Create base directories
        for directory in [base_upload_dir, documents_dir] + subdirs:
            if not os.path.exists(directory):
                os.makedirs(directory, mode=0o755)
                print(f"✅ Created directory: {directory}")
            else:
                print(f"📁 Directory already exists: {directory}")
        
        # Set proper permissions (755 for directories)
        for directory in [base_upload_dir, documents_dir] + subdirs:
            try:
                os.chmod(directory, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
                print(f"🔒 Set permissions for: {directory}")
            except Exception as e:
                print(f"⚠️ Could not set permissions for {directory}: {e}")
        
        # Create .gitkeep files to ensure directories are tracked in git
        for directory in subdirs:
            gitkeep_path = os.path.join(directory, ".gitkeep")
            if not os.path.exists(gitkeep_path):
                with open(gitkeep_path, 'w') as f:
                    f.write("# Keep this directory in git\n")
                print(f"📝 Created .gitkeep in: {directory}")
        
        print("\n🎉 Upload directory structure created successfully!")
        print("\nDirectory structure:")
        print("uploads/")
        print("└── documents/")
        print("    ├── drivers/")
        print("    ├── vehicles/")
        print("    └── other/")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating upload directories: {e}")
        return False

if __name__ == "__main__":
    setup_upload_directories()
