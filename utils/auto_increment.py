#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Utility for managing auto-incrementing row numbers in JSON data
"""

def get_next_row_number(data):
    """Get the next available row number for a list of records"""
    if not data:
        return 1
    
    # Find the maximum row_number in the existing data
    max_row = 0
    for item in data:
        if isinstance(item, dict) and 'row_number' in item:
            max_row = max(max_row, item.get('row_number', 0))
    
    return max_row + 1

def add_row_number(record, data):
    """Add row_number to a new record"""
    if 'row_number' not in record:
        record['row_number'] = get_next_row_number(data)
    return record

def ensure_row_numbers(data):
    """Ensure all records have row numbers, add if missing"""
    if not data:
        return data
    
    for i, record in enumerate(data, start=1):
        if isinstance(record, dict) and 'row_number' not in record:
            record['row_number'] = i
    
    return data

def reindex_row_numbers(data):
    """Reindex row numbers to ensure they are sequential starting from 1"""
    if not data:
        return data
    
    for i, record in enumerate(data, start=1):
        if isinstance(record, dict):
            record['row_number'] = i
    
    return data