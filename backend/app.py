"""
DNA Crypto – Flask Backend API
==============================
Endpoints:
  POST /api/encrypt/text    – { text, key }           → { dna_sequence, encryption_id, … }
  POST /api/decrypt/text    – { key } or { encrypted_data, key } → { plaintext }
  POST /api/encrypt/image   – multipart: file, key    → { encrypted_image_b64, encryption_id, … }
  POST /api/decrypt/image   – { key } or { encrypted_data, key } → PNG bytes (base64 JSON)
  GET  /api/retrieve/:key   – retrieve encrypted data from Supabase
  GET  /api/health          – health check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import base64
import traceback
from dotenv import load_dotenv
import os

from dna_crypto import encrypt_text, decrypt_text, encrypt_image, decrypt_image
from supabase_client import (
    init_supabase, 
    save_encrypted_data, 
    retrieve_encrypted_data,
    save_encryption_history,
    get_encryption_history,
    signup_user,
    login_user
)
import hashlib
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins="*")

# Initialize Supabase
supabase_enabled = init_supabase()
if supabase_enabled:
    print("Supabase connected successfully")
else:
    print("Supabase not configured - cloud storage disabled")


# ── Health ─────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'DNA Crypto API',
        'supabase_enabled': supabase_enabled
    })


# ── Authentication ──────────────────────────────────────────────────────────

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        body = request.get_json(force=True)
        name = body.get('name', '')
        email = body.get('email', '')
        password = body.get('password', '')
        role = body.get('role', 'patient')
        
        if not name or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400
        
        if not supabase_enabled:
            return jsonify({'error': 'Supabase not configured'}), 503
        
        user = signup_user(email, password, name, role)
        
        return jsonify({
            'success': True,
            'user': user
        })
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        status = 400 if 'already registered' in error_msg.lower() else 500
        return jsonify({'success': False, 'error': error_msg}), status


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        body = request.get_json(force=True)
        email = body.get('email', '')
        password = body.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not supabase_enabled:
            return jsonify({'error': 'Supabase not configured'}), 503
        
        user = login_user(email, password)
        
        return jsonify({
            'success': True,
            'user': user
        })
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        status = 401 if 'invalid' in error_msg.lower() else 500
        return jsonify({'success': False, 'error': error_msg}), status


# ── Text Encryption ─────────────────────────────────────────────────────────

@app.route('/api/encrypt/text', methods=['POST'])
def api_encrypt_text():
    try:
        body = request.get_json(force=True)
        plaintext = body.get('text', '')
        master_key = body.get('key', '')
        
        # Optional metadata for history
        doctor_id = body.get('doctor_id')
        patient_name = body.get('patient_name', '')
        patient_email = body.get('patient_email', '')
        report_type = body.get('report_type', 'Medical Report')

        if not plaintext:
            return jsonify({'error': 'text is required'}), 400
        if not master_key:
            return jsonify({'error': 'key is required'}), 400

        result = encrypt_text(plaintext, master_key)
        
        # Save to Supabase if enabled
        encryption_id = None
        if supabase_enabled:
            try:
                save_result = save_encrypted_data(result, master_key, 'text')
                encryption_id = save_result['encryption_id']
                
                # Save history if doctor_id provided
                if doctor_id and patient_name:
                    save_encryption_history(
                        doctor_id=doctor_id,
                        patient_name=patient_name,
                        patient_email=patient_email,
                        report_type=report_type,
                        encryption_type='text',
                        master_key=master_key,
                        encryption_id=encryption_id
                    )
            except Exception as e:
                print(f"Supabase save failed: {e}")
        
        return jsonify({
            'success': True,
            'data': result,
            'encryption_id': encryption_id,
            'cloud_saved': encryption_id is not None
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/decrypt/text', methods=['POST'])
def api_decrypt_text():
    try:
        body = request.get_json(force=True)
        master_key = body.get('key', '')

        if not master_key:
            return jsonify({'error': 'key is required'}), 400

        # Try to get encrypted_data from request, or retrieve from Supabase
        encrypted_data = body.get('encrypted_data')
        
        if not encrypted_data and supabase_enabled:
            # Retrieve from Supabase using master key
            try:
                retrieve_result = retrieve_encrypted_data(master_key)
                encrypted_data = retrieve_result['encrypted_data']
            except Exception as e:
                return jsonify({'error': f'Failed to retrieve data: {str(e)}'}), 404
        
        if not encrypted_data:
            return jsonify({'error': 'encrypted_data is required or not found in cloud'}), 400

        plaintext = decrypt_text(encrypted_data, master_key)
        return jsonify({'success': True, 'plaintext': plaintext})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ── Image Encryption ────────────────────────────────────────────────────────

@app.route('/api/encrypt/image', methods=['POST'])
def api_encrypt_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'file is required'}), 400
        master_key = request.form.get('key', '')
        if not master_key:
            return jsonify({'error': 'key is required'}), 400
        
        # Optional metadata for history
        doctor_id = request.form.get('doctor_id')
        patient_name = request.form.get('patient_name', '')
        patient_email = request.form.get('patient_email', '')
        report_type = request.form.get('report_type', 'Medical Report')

        file = request.files['file']
        image_bytes = file.read()

        result = encrypt_image(image_bytes, master_key)
        
        # Save to Supabase if enabled
        encryption_id = None
        if supabase_enabled:
            try:
                save_result = save_encrypted_data(result, master_key, 'image')
                encryption_id = save_result['encryption_id']
                
                # Save history if doctor_id provided
                if doctor_id and patient_name:
                    save_encryption_history(
                        doctor_id=doctor_id,
                        patient_name=patient_name,
                        patient_email=patient_email,
                        report_type=report_type,
                        encryption_type='image',
                        master_key=master_key,
                        encryption_id=encryption_id
                    )
            except Exception as e:
                print(f"Supabase save failed: {e}")
        
        return jsonify({
            'success': True,
            'data': result,
            'encryption_id': encryption_id,
            'cloud_saved': encryption_id is not None
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/decrypt/image', methods=['POST'])
def api_decrypt_image():
    try:
        body = request.get_json(force=True)
        master_key = body.get('key', '')

        if not master_key:
            return jsonify({'error': 'key is required'}), 400

        # Try to get encrypted_data from request, or retrieve from Supabase
        encrypted_data = body.get('encrypted_data')
        
        if not encrypted_data and supabase_enabled:
            # Retrieve from Supabase using master key
            try:
                retrieve_result = retrieve_encrypted_data(master_key)
                encrypted_data = retrieve_result['encrypted_data']
            except Exception as e:
                return jsonify({'error': f'Failed to retrieve data: {str(e)}'}), 404
        
        if not encrypted_data:
            return jsonify({'error': 'encrypted_data is required or not found in cloud'}), 400

        png_bytes = decrypt_image(encrypted_data, master_key)
        b64 = base64.b64encode(png_bytes).decode()
        return jsonify({'success': True, 'decrypted_image_b64': b64})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ── Retrieve Data ───────────────────────────────────────────────────────────

@app.route('/api/retrieve/<key>', methods=['GET'])
def api_retrieve_data(key):
    """Retrieve encrypted data from Supabase using master key"""
    if not supabase_enabled:
        return jsonify({'error': 'Cloud storage not enabled'}), 503
    
    try:
        result = retrieve_encrypted_data(key)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 404


# ── Encryption History ──────────────────────────────────────────────────────

@app.route('/api/history/<doctor_id>', methods=['GET'])
def api_get_history(doctor_id):
    """Get encryption history for a doctor"""
    if not supabase_enabled:
        return jsonify({'error': 'Cloud storage not enabled'}), 503
    
    try:
        history = get_encryption_history(doctor_id)
        return jsonify({
            'success': True,
            'history': history
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ── Entry Point ─────────────────────────────────────────────────────────────

@app.route('/api/test-history', methods=['POST'])
def test_history_save():
    """Test endpoint to verify history saving works"""
    try:
        body = request.get_json(force=True)
        doctor_id = body.get('doctor_id', 'test-doctor-id')
        
        if not supabase_enabled:
            return jsonify({'error': 'Supabase not enabled'}), 503
        
        # Try to save a test history record
        save_encryption_history(
            doctor_id=doctor_id,
            patient_name='Test Patient',
            patient_email='test@example.com',
            report_type='Test Report',
            encryption_type='text',
            master_key='test-key-123',
            encryption_id='test-enc-123'
        )
        
        return jsonify({
            'success': True,
            'message': 'Test history saved successfully'
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    print("🧬 DNA Crypto API running on http://localhost:5000")
    app.run(debug=True, port=5000)
