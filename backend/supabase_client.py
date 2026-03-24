"""
Supabase Client for DNA Crypto
Handles storage, retrieval, auth, and history
"""

import os
from supabase import create_client, Client
from datetime import datetime
import hashlib

# Supabase client (initialized later)
supabase: Client = None

def init_supabase():
    """Initialize Supabase client"""
    global supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
    
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            return True
        except Exception as e:
            print(f"Failed to initialize Supabase: {e}")
            return False
    return False


# ── Authentication ─────────────────────────────────────────────────────────

def signup_user(email: str, password: str, name: str, role: str) -> dict:
    """Sign up a user using Supabase Auth + insert into public.users table."""
    if not supabase:
        raise Exception("Supabase not initialized.")
    
    try:
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        if auth_response.user is None:
            raise Exception("Signup failed - no user returned")
        
        user_id = auth_response.user.id
        
        # Insert into public.users table
        try:
            supabase.table('users').insert({
                'id': user_id,
                'email': email,
                'name': name,
                'role': role
            }).execute()
        except Exception as e:
            print(f"Warning: Could not insert into users table: {e}")
        
        return {
            'id': user_id,
            'email': email,
            'name': name,
            'role': role
        }
    except Exception as e:
        error_msg = str(e)
        if 'already registered' in error_msg.lower() or 'already been registered' in error_msg.lower():
            raise Exception("Email already registered")
        raise Exception(f"Signup failed: {error_msg}")


def login_user(email: str, password: str) -> dict:
    """Log in a user using Supabase Auth."""
    if not supabase:
        raise Exception("Supabase not initialized.")
    
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if auth_response.user is None:
            raise Exception("Invalid email or password")
        
        user_id = auth_response.user.id
        
        # Get user profile from public.users table
        try:
            profile = supabase.table('users') \
                .select('*') \
                .eq('id', user_id) \
                .single() \
                .execute()
            
            if profile.data:
                return {
                    'id': user_id,
                    'email': profile.data['email'],
                    'name': profile.data['name'],
                    'role': profile.data['role']
                }
        except Exception as e:
            print(f"Warning: Could not fetch user profile: {e}")
        
        # Fallback if profile table doesn't have the user
        return {
            'id': user_id,
            'email': email,
            'name': email.split('@')[0],
            'role': 'patient'
        }
    except Exception as e:
        error_msg = str(e)
        if 'invalid' in error_msg.lower() or 'credentials' in error_msg.lower():
            raise Exception("Invalid email or password")
        raise Exception(f"Login failed: {error_msg}")


# ── Encryption ID ──────────────────────────────────────────────────────────

def generate_encryption_id(master_key: str) -> str:
    """Generate a unique ID from master key for retrieval."""
    hash_obj = hashlib.sha256(master_key.encode())
    return hash_obj.hexdigest()[:12]


# ── Encrypted Data Storage ─────────────────────────────────────────────────

def save_encrypted_data(encrypted_data: dict, master_key: str, data_type: str) -> dict:
    """Save encrypted data to Supabase."""
    if not supabase:
        raise Exception("Supabase not initialized.")
    
    encryption_id = generate_encryption_id(master_key)
    
    record = {
        'encryption_id': encryption_id,
        'data_type': data_type,
        'encrypted_data': encrypted_data,
        'created_at': datetime.utcnow().isoformat(),
        'expires_at': None
    }
    
    try:
        supabase.table('encrypted_data').upsert(record).execute()
        return {
            'success': True,
            'encryption_id': encryption_id,
            'message': 'Data saved to cloud storage'
        }
    except Exception as e:
        raise Exception(f"Failed to save to Supabase: {str(e)}")


def retrieve_encrypted_data(master_key: str) -> dict:
    """Retrieve encrypted data from Supabase using master key."""
    if not supabase:
        raise Exception("Supabase not initialized.")
    
    encryption_id = generate_encryption_id(master_key)
    
    try:
        response = supabase.table('encrypted_data') \
            .select('*') \
            .eq('encryption_id', encryption_id) \
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise Exception("No encrypted data found for this key")
        
        record = response.data[0]
        return {
            'success': True,
            'encrypted_data': record['encrypted_data'],
            'data_type': record['data_type'],
            'created_at': record['created_at']
        }
    except Exception as e:
        raise Exception(f"Failed to retrieve from Supabase: {str(e)}")


def delete_encrypted_data(master_key: str) -> dict:
    """Delete encrypted data from Supabase."""
    if not supabase:
        raise Exception("Supabase not initialized.")
    
    encryption_id = generate_encryption_id(master_key)
    
    try:
        supabase.table('encrypted_data') \
            .delete() \
            .eq('encryption_id', encryption_id) \
            .execute()
        return {
            'success': True,
            'message': 'Data deleted from cloud storage'
        }
    except Exception as e:
        raise Exception(f"Failed to delete from Supabase: {str(e)}")


# ── Encryption History ─────────────────────────────────────────────────────

def save_encryption_history(doctor_id: str, patient_name: str, patient_email: str, 
                            report_type: str, encryption_type: str, master_key: str, 
                            encryption_id: str) -> dict:
    """Save encryption history record to Supabase."""
    if not supabase:
        raise Exception("Supabase not initialized.")
    
    try:
        record = {
            'doctor_id': doctor_id,
            'patient_name': patient_name,
            'patient_email': patient_email,
            'report_type': report_type,
            'encryption_type': encryption_type,
            'master_key': master_key,
            'encryption_id': encryption_id
        }
        
        supabase.table('encryption_history').insert(record).execute()
        return {
            'success': True,
            'message': 'History saved successfully'
        }
    except Exception as e:
        raise Exception(f"Failed to save history: {str(e)}")


def get_encryption_history(doctor_id: str) -> list:
    """Get encryption history for a doctor."""
    if not supabase:
        raise Exception("Supabase not initialized.")
    
    try:
        response = supabase.table('encryption_history') \
            .select('*') \
            .eq('doctor_id', doctor_id) \
            .order('created_at', desc=True) \
            .execute()
        
        return response.data
    except Exception as e:
        raise Exception(f"Failed to retrieve history: {str(e)}")
