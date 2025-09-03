"""
Event Logging System for Emar Delivery Management
Logs key user actions with timestamps for audit and monitoring
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from json_store import json_store


class EventLogger:
    """Lightweight event logging system"""
    
    def __init__(self, log_file: str = None):
        if log_file is None:
            self.log_file = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'data', 
                'event_log.json'
            )
        else:
            self.log_file = log_file
        
        # Ensure log file exists
        if not os.path.exists(self.log_file):
            self._initialize_log_file()
    
    def _initialize_log_file(self):
        """Initialize empty log file"""
        try:
            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error initializing log file: {e}")
    
    def log_event(self, 
                  action: str, 
                  entity_type: str = None, 
                  entity_id: str = None, 
                  user: str = "admin", 
                  details: Dict[str, Any] = None,
                  ip_address: str = None) -> bool:
        """
        Log an event
        
        Args:
            action: Action performed (e.g., 'create', 'update', 'delete', 'view')
            entity_type: Type of entity (e.g., 'driver', 'vehicle', 'order', 'advance')
            entity_id: ID of the entity affected
            user: Username performing the action
            details: Additional details about the action
            ip_address: IP address of the user
        
        Returns:
            bool: True if logged successfully
        """
        try:
            event = {
                'id': self._generate_event_id(),
                'timestamp': datetime.now().isoformat(),
                'action': action,
                'entity_type': entity_type,
                'entity_id': entity_id,
                'user': user,
                'ip_address': ip_address,
                'details': details or {},
                'session_id': self._get_session_id()
            }
            
            # Read existing logs
            logs = self._read_logs()
            
            # Add new event
            logs.append(event)
            
            # Keep only last 10000 events to prevent file from growing too large
            if len(logs) > 10000:
                logs = logs[-10000:]
            
            # Write back to file
            return self._write_logs(logs)
            
        except Exception as e:
            print(f"Error logging event: {e}")
            return False
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        import uuid
        return str(uuid.uuid4())[:8]
    
    def _get_session_id(self) -> str:
        """Get current session ID (simplified)"""
        return "web_session"
    
    def _read_logs(self) -> List[Dict]:
        """Read logs from file"""
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _write_logs(self, logs: List[Dict]) -> bool:
        """Write logs to file"""
        try:
            # Create backup before writing
            json_store._create_daily_backup(self.log_file)
            
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(logs, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error writing logs: {e}")
            return False
    
    def get_recent_events(self, limit: int = 50, 
                         entity_type: str = None,
                         action: str = None,
                         user: str = None) -> List[Dict]:
        """
        Get recent events with optional filtering
        
        Args:
            limit: Maximum number of events to return
            entity_type: Filter by entity type
            action: Filter by action
            user: Filter by user
        
        Returns:
            List of events
        """
        try:
            logs = self._read_logs()
            
            # Apply filters
            if entity_type:
                logs = [log for log in logs if log.get('entity_type') == entity_type]
            if action:
                logs = [log for log in logs if log.get('action') == action]
            if user:
                logs = [log for log in logs if log.get('user') == user]
            
            # Sort by timestamp (newest first) and limit
            logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return logs[:limit]
            
        except Exception as e:
            print(f"Error getting recent events: {e}")
            return []
    
    def get_event_stats(self, days: int = 7) -> Dict[str, Any]:
        """
        Get event statistics for the last N days
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Dictionary with statistics
        """
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.now() - timedelta(days=days)
            logs = self._read_logs()
            
            # Filter events within date range
            recent_logs = []
            for log in logs:
                try:
                    event_date = datetime.fromisoformat(log.get('timestamp', ''))
                    if event_date >= cutoff_date:
                        recent_logs.append(log)
                except ValueError:
                    continue
            
            # Calculate statistics
            stats = {
                'total_events': len(recent_logs),
                'actions': {},
                'entity_types': {},
                'users': {},
                'daily_counts': {},
                'period_days': days
            }
            
            for log in recent_logs:
                # Count by action
                action = log.get('action', 'unknown')
                stats['actions'][action] = stats['actions'].get(action, 0) + 1
                
                # Count by entity type
                entity_type = log.get('entity_type', 'unknown')
                stats['entity_types'][entity_type] = stats['entity_types'].get(entity_type, 0) + 1
                
                # Count by user
                user = log.get('user', 'unknown')
                stats['users'][user] = stats['users'].get(user, 0) + 1
                
                # Count by day
                try:
                    event_date = datetime.fromisoformat(log.get('timestamp', ''))
                    day_key = event_date.strftime('%Y-%m-%d')
                    stats['daily_counts'][day_key] = stats['daily_counts'].get(day_key, 0) + 1
                except ValueError:
                    continue
            
            return stats
            
        except Exception as e:
            print(f"Error getting event stats: {e}")
            return {'total_events': 0, 'actions': {}, 'entity_types': {}, 'users': {}, 'daily_counts': {}, 'period_days': days}
    
    def clear_old_events(self, days_to_keep: int = 90) -> int:
        """
        Clear events older than specified days
        
        Args:
            days_to_keep: Number of days to keep
        
        Returns:
            Number of events removed
        """
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            logs = self._read_logs()
            
            # Filter events to keep
            filtered_logs = []
            removed_count = 0
            
            for log in logs:
                try:
                    event_date = datetime.fromisoformat(log.get('timestamp', ''))
                    if event_date >= cutoff_date:
                        filtered_logs.append(log)
                    else:
                        removed_count += 1
                except ValueError:
                    # Keep events with invalid timestamps
                    filtered_logs.append(log)
            
            # Write filtered logs back
            if removed_count > 0:
                self._write_logs(filtered_logs)
            
            return removed_count
            
        except Exception as e:
            print(f"Error clearing old events: {e}")
            return 0


# Global instance
event_logger = EventLogger()


# Convenience functions for common actions
def log_create(entity_type: str, entity_id: str, details: Dict = None, user: str = "admin"):
    """Log creation of an entity"""
    return event_logger.log_event('create', entity_type, entity_id, user, details)

def log_update(entity_type: str, entity_id: str, details: Dict = None, user: str = "admin"):
    """Log update of an entity"""
    return event_logger.log_event('update', entity_type, entity_id, user, details)

def log_delete(entity_type: str, entity_id: str, details: Dict = None, user: str = "admin"):
    """Log deletion of an entity"""
    return event_logger.log_event('delete', entity_type, entity_id, user, details)

def log_view(entity_type: str, entity_id: str = None, details: Dict = None, user: str = "admin"):
    """Log viewing of an entity or list"""
    return event_logger.log_event('view', entity_type, entity_id, user, details)

def log_action(action: str, entity_type: str = None, entity_id: str = None, details: Dict = None, user: str = "admin"):
    """Log custom action"""
    return event_logger.log_event(action, entity_type, entity_id, user, details)
