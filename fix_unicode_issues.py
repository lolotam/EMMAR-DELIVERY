#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix Unicode Issues in app.py
Remove or replace Unicode emojis that cause encoding errors
"""

import re

def fix_unicode_in_file(filename):
    """Fix Unicode emojis in print statements"""
    
    # Unicode emoji replacements
    replacements = {
        '✅': '[SUCCESS]',
        '🗑️': '[DELETE]',
        '⚠️': '[WARNING]',
        '🔍': '[DEBUG]',
        '❌': '[ERROR]',
        '📋': '[INFO]',
        '🔥': '[DEBUG]',
        '🚀': '[START]',
        '📁': '[FOLDER]',
        '💾': '[SAVE]',
        '🔒': '[SECURE]',
        '🔓': '[UNLOCK]',
        '📄': '[FILE]',
        '📎': '[ATTACH]',
        '🆔': '[ID]'
    }
    
    print(f"Fixing Unicode issues in {filename}...")
    
    try:
        # Read the file
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count issues
        total_replacements = 0
        
        # Apply replacements
        for emoji, replacement in replacements.items():
            count = content.count(emoji)
            if count > 0:
                content = content.replace(emoji, replacement)
                total_replacements += count
                print(f"  Replaced {count} instances of '{emoji}' with '{replacement}'")
        
        # Additional pattern-based fixes for complex emojis
        patterns = [
            (r'🗑️\ufe0f', '[DELETE]'),
            (r'⚠️\ufe0f', '[WARNING]'), 
            (r'\U0001f5d1\ufe0f', '[DELETE]'),
            (r'\u2705', '[SUCCESS]'),
            (r'\u274c', '[ERROR]'),
            (r'\u26a0\ufe0f', '[WARNING]')
        ]
        
        for pattern, replacement in patterns:
            matches = len(re.findall(pattern, content))
            if matches > 0:
                content = re.sub(pattern, replacement, content)
                total_replacements += matches
                print(f"  Fixed {matches} instances of pattern '{pattern}'")
        
        if total_replacements > 0:
            # Write the fixed content back
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Fixed {total_replacements} Unicode issues in {filename}")
        else:
            print(f"No Unicode issues found in {filename}")
            
        return total_replacements > 0
        
    except Exception as e:
        print(f"Error fixing {filename}: {e}")
        return False

def main():
    """Fix Unicode issues in app.py"""
    print("Starting Unicode Fix Process")
    print("=" * 40)
    
    fixed = fix_unicode_in_file('app.py')
    
    if fixed:
        print("Unicode issues have been fixed!")
        print("You can now test the upload functionality.")
    else:
        print("No issues found or fix failed.")
    
    print("Unicode Fix Process Complete")

if __name__ == '__main__':
    main()