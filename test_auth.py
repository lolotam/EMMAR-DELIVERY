import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))
from auth import AuthManager

auth = AuthManager()
result = auth.validate_credentials('admin', 'admin123')
print('Testing admin/admin123:', result)

# Try to understand why it's failing
config = auth.load_config()
admin_config = config.get('admin', {})
print('Has admin key:', 'admin' in config)
print('Admin username:', admin_config.get('username'))
print('Admin password exists:', 'password' in admin_config)
if 'password' in admin_config:
    print('Admin password value:', admin_config.get('password'))
    print('Password matches admin123:', admin_config.get('password') == 'admin123')