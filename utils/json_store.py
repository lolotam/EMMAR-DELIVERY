#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JSON Storage Utility with File Locking
مساعد تخزين البيانات JSON مع قفل الملفات
"""

import json
import os
import time
import platform
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid

# Import file locking based on platform
try:
    if platform.system() == 'Windows':
        import msvcrt
        HAS_FCNTL = False
        HAS_MSVCRT = True
    else:
        import fcntl
        HAS_FCNTL = True
        HAS_MSVCRT = False
except ImportError as e:
    HAS_FCNTL = False
    HAS_MSVCRT = False
    print(f"Warning: File locking not available: {e}")

class JSONStore:
    """JSON file storage with file locking for concurrent access"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        else:
            self.data_dir = data_dir

        # Setup backup directory
        self.backup_root = os.path.join(os.path.dirname(self.data_dir), 'data', 'backup')

        # Ensure directories exist
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        if not os.path.exists(self.backup_root):
            os.makedirs(self.backup_root)
    
    def _get_file_path(self, filename: str) -> str:
        """Get full path for data file"""
        if not filename.endswith('.json'):
            filename += '.json'
        return os.path.join(self.data_dir, filename)
    
    def _read_with_lock(self, file_path: str) -> List[Dict]:
        """Read JSON file with file locking"""
        if not os.path.exists(file_path):
            return []

        max_retries = 5
        retry_delay = 0.1

        for attempt in range(max_retries):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    if HAS_FCNTL:
                        fcntl.flock(f.fileno(), fcntl.LOCK_SH)  # Shared lock for reading
                    elif platform.system() == 'Windows':
                        # Windows file locking
                        try:
                            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
                        except IOError:
                            # File is locked, retry
                            if attempt < max_retries - 1:
                                time.sleep(retry_delay * (2 ** attempt))
                                continue
                            raise

                    try:
                        data = json.load(f)
                        return data if isinstance(data, list) else []
                    except json.JSONDecodeError:
                        return []
                    finally:
                        if HAS_FCNTL:
                            fcntl.flock(f.fileno(), fcntl.LOCK_UN)  # Unlock
                        elif platform.system() == 'Windows':
                            try:
                                msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
                            except IOError:
                                pass  # Ignore unlock errors

            except (IOError, OSError) as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                # For Windows, if locking fails, try without locking
                if platform.system() == 'Windows':
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            return data if isinstance(data, list) else []
                    except json.JSONDecodeError:
                        return []
                raise e

        return []
    
    def _write_with_lock(self, file_path: str, data: List[Dict]) -> bool:
        """Write JSON file with file locking"""
        max_retries = 5
        retry_delay = 0.1

        for attempt in range(max_retries):
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    if HAS_FCNTL:
                        fcntl.flock(f.fileno(), fcntl.LOCK_EX)  # Exclusive lock for writing
                    elif platform.system() == 'Windows':
                        # Windows file locking
                        try:
                            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
                        except IOError:
                            # File is locked, retry
                            if attempt < max_retries - 1:
                                time.sleep(retry_delay * (2 ** attempt))
                                continue
                            raise

                    try:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                        f.flush()
                        os.fsync(f.fileno())  # Force write to disk
                        return True
                    finally:
                        if HAS_FCNTL:
                            fcntl.flock(f.fileno(), fcntl.LOCK_UN)  # Unlock
                        elif platform.system() == 'Windows':
                            try:
                                msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
                            except IOError:
                                pass  # Ignore unlock errors

            except (IOError, OSError) as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                # For Windows, if locking fails, try without locking
                if platform.system() == 'Windows':
                    try:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            json.dump(data, f, ensure_ascii=False, indent=2)
                            f.flush()
                            os.fsync(f.fileno())
                            return True
                    except Exception:
                        pass
                raise e

        return False

    def _create_daily_backup(self, file_path: str) -> bool:
        """Create daily backup of a JSON file"""
        try:
            if not os.path.exists(file_path):
                return True  # No file to backup

            # Get today's date for backup directory
            today = datetime.now().strftime('%Y-%m-%d')
            backup_dir = os.path.join(self.backup_root, today)

            # Create backup directory if it doesn't exist
            if not os.path.exists(backup_dir):
                os.makedirs(backup_dir)

            # Get filename
            filename = os.path.basename(file_path)
            backup_path = os.path.join(backup_dir, filename)

            # Only create backup if it doesn't exist for today
            if not os.path.exists(backup_path):
                shutil.copy2(file_path, backup_path)
                print(f"[SUCCESS] Daily backup created: {backup_path}")

            return True
        except Exception as e:
            print(f"[WARNING] Backup failed for {file_path}: {e}")
            return False

    def _cleanup_old_backups(self, days_to_keep: int = 30) -> None:
        """Clean up backups older than specified days"""
        try:
            if not os.path.exists(self.backup_root):
                return

            cutoff_date = datetime.now().timestamp() - (days_to_keep * 24 * 60 * 60)

            for backup_dir in os.listdir(self.backup_root):
                backup_path = os.path.join(self.backup_root, backup_dir)
                if os.path.isdir(backup_path):
                    # Check if directory is older than cutoff
                    if os.path.getctime(backup_path) < cutoff_date:
                        shutil.rmtree(backup_path)
                        print(f"[CLEANUP] Cleaned up old backup: {backup_dir}")
        except Exception as e:
            print(f"[WARNING] Backup cleanup failed: {e}")

    def create_full_backup(self) -> str:
        """Create a full backup of all data files"""
        try:
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            backup_dir = os.path.join(self.backup_root, f"full_backup_{timestamp}")
            os.makedirs(backup_dir)

            # Copy all JSON files
            backup_count = 0
            for filename in os.listdir(self.data_dir):
                if filename.endswith('.json'):
                    source_path = os.path.join(self.data_dir, filename)
                    dest_path = os.path.join(backup_dir, filename)
                    shutil.copy2(source_path, dest_path)
                    backup_count += 1

            print(f"[SUCCESS] Full backup created: {backup_dir} ({backup_count} files)")
            return backup_dir
        except Exception as e:
            print(f"[ERROR] Full backup failed: {e}")
            raise e

    def read_all(self, collection: str) -> List[Dict]:
        """Read all records from a collection"""
        file_path = self._get_file_path(collection)
        return self._read_with_lock(file_path)
    
    def find_by_id(self, collection: str, record_id: str) -> Optional[Dict]:
        """Find a record by ID"""
        data = self.read_all(collection)
        for record in data:
            if record.get('id') == record_id:
                return record
        return None
    
    def create(self, collection: str, record: Dict) -> Dict:
        """Create a new record"""
        file_path = self._get_file_path(collection)

        # Create daily backup before writing
        self._create_daily_backup(file_path)

        data = self._read_with_lock(file_path)

        # Generate ID if not provided
        if 'id' not in record:
            record['id'] = str(uuid.uuid4())[:8]

        # Add timestamps
        record['created_at'] = datetime.now().isoformat()
        record['updated_at'] = datetime.now().isoformat()

        data.append(record)

        if self._write_with_lock(file_path, data):
            return record
        else:
            raise Exception("فشل في حفظ البيانات")
    
    def update(self, collection: str, record_id: str, updates: Dict) -> Optional[Dict]:
        """Update a record by ID"""
        file_path = self._get_file_path(collection)

        # Create daily backup before writing
        self._create_daily_backup(file_path)

        data = self._read_with_lock(file_path)

        for i, record in enumerate(data):
            if record.get('id') == record_id:
                # Update fields
                data[i].update(updates)
                data[i]['updated_at'] = datetime.now().isoformat()

                if self._write_with_lock(file_path, data):
                    return data[i]
                else:
                    raise Exception("فشل في تحديث البيانات")

        return None
    
    def delete(self, collection: str, record_id: str) -> bool:
        """Delete a record by ID"""
        file_path = self._get_file_path(collection)

        # Create daily backup before writing
        self._create_daily_backup(file_path)

        data = self._read_with_lock(file_path)

        original_length = len(data)
        data = [record for record in data if record.get('id') != record_id]

        if len(data) < original_length:
            return self._write_with_lock(file_path, data)

        return False
    
    def filter_records(self, collection: str, filters: Dict) -> List[Dict]:
        """Filter records by criteria"""
        data = self.read_all(collection)
        filtered_data = []
        
        for record in data:
            match = True
            for key, value in filters.items():
                if key not in record or record[key] != value:
                    match = False
                    break
            if match:
                filtered_data.append(record)
        
        return filtered_data
    
    def count(self, collection: str, filters: Dict = None) -> int:
        """Count records with optional filters"""
        if filters:
            return len(self.filter_records(collection, filters))
        else:
            return len(self.read_all(collection))

    def initialize_backup_system(self) -> None:
        """Initialize the backup system and perform maintenance"""
        try:
            # Clean up old backups (keep 30 days)
            self._cleanup_old_backups(30)

            # Create initial backup of all files if no backup exists for today
            today = datetime.now().strftime('%Y-%m-%d')
            today_backup_dir = os.path.join(self.backup_root, today)

            if not os.path.exists(today_backup_dir):
                print("[INFO] Creating initial daily backup...")
                for filename in os.listdir(self.data_dir):
                    if filename.endswith('.json'):
                        file_path = os.path.join(self.data_dir, filename)
                        self._create_daily_backup(file_path)
                print("[SUCCESS] Initial daily backup completed")

        except Exception as e:
            print(f"[WARNING] Backup system initialization failed: {e}")

# Global instance
json_store = JSONStore()

# Initialize backup system on import
json_store.initialize_backup_system()
