#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Authentication Logic
منطق المصادقة
"""

import json
import os
import bcrypt
from functools import wraps
from flask import session, request, jsonify
from datetime import datetime, timedelta

class AuthManager:
    """Authentication manager for the application"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        else:
            self.data_dir = data_dir
        
        self.config_file = os.path.join(self.data_dir, 'config.json')
    
    def load_config(self):
        """Load configuration from environment variables and config.json"""
        # First try to load from environment variables
        admin_username = os.getenv('ADMIN_USERNAME')
        admin_password_hash = os.getenv('ADMIN_PASSWORD_HASH')

        if admin_username and admin_password_hash:
            return {
                'admin': {
                    'username': admin_username,
                    'password_hash': admin_password_hash
                }
            }

        # Fallback to config.json
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Return default config if file doesn't exist or is invalid
            return {
                'admin': {
                    'username': 'admin',
                    'password': '@Xx123456789xX@'
                }
            }
    
    def validate_credentials(self, username: str, password: str) -> bool:
        """Validate user credentials using bcrypt hashing"""
        config = self.load_config()
        admin_config = config.get('admin', {})

        # Check username first
        if username != admin_config.get('username'):
            return False

        # Check if we have a hashed password (new method)
        password_hash = admin_config.get('password_hash')
        if password_hash:
            try:
                return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
            except Exception as e:
                print(f"Error verifying password hash: {e}")
                return False

        # Fallback to plain text password (legacy method)
        plain_password = admin_config.get('password')
        if plain_password:
            return password == plain_password

        return False
    
    def create_session(self, username: str) -> dict:
        """Create a new user session"""
        session_data = {
            'user_id': 'admin',
            'username': username,
            'login_time': datetime.now().isoformat(),
            'is_authenticated': True
        }
        
        # Store in Flask session
        for key, value in session_data.items():
            session[key] = value
        
        return session_data
    
    def destroy_session(self):
        """Destroy current session"""
        session.clear()
    
    def is_authenticated(self) -> bool:
        """Check if current session is authenticated"""
        return session.get('is_authenticated', False)
    
    def get_current_user(self) -> dict:
        """Get current user information"""
        if not self.is_authenticated():
            return None

        return {
            'user_id': session.get('user_id'),
            'username': session.get('username'),
            'login_time': session.get('login_time'),
            'role': 'admin'  # Default role for authenticated users
        }

# Global instance
auth_manager = AuthManager()

def login_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not auth_manager.is_authenticated():
            return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not auth_manager.is_authenticated():
            return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
        
        user = auth_manager.get_current_user()
        if not user or user.get('user_id') != 'admin':
            return jsonify({'error': 'صلاحيات المدير مطلوبة'}), 403
        
        return f(*args, **kwargs)
    return decorated_function
