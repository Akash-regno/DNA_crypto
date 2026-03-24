"""
DNA-based Cryptographic System - Core Engine
============================================
Implements:
  - SHA-256 seeded PRNG-shuffled DNA mapping (per chunk)
  - DNA XOR with dynamic key
  - DNA Complement
  - DNA Permutation
  - Full encryption / decryption for text & images
"""

import hashlib
import random
import numpy as np
from PIL import Image
import io
import base64

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASES = ['A', 'T', 'C', 'G']
BINARY_PAIRS = ['00', '01', '10', '11']

# Default (canonical) encoding: 00→A  01→T  10→C  11→G
DEFAULT_ENCODING = {'00': 'A', '01': 'T', '10': 'C', '11': 'G'}
DEFAULT_DECODING = {v: k for k, v in DEFAULT_ENCODING.items()}

# DNA XOR table  (base1 XOR base2 → result)
# Defined as: each base is a 2-bit value; XOR the 2-bit values; map back.
# A=00, T=01, C=10, G=11
BASE_TO_BITS_FIXED = {'A': '00', 'T': '01', 'C': '10', 'G': '11'}
BITS_TO_BASE_FIXED = {v: k for k, v in BASE_TO_BITS_FIXED.items()}

# Complement rule: A↔T, C↔G
COMPLEMENT = {'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C'}

CHUNK_SIZE = 64   # bits per chunk (32 DNA bases per chunk)


# ---------------------------------------------------------------------------
# Helper – SHA-256 derived seed
# ---------------------------------------------------------------------------

def _derive_seed(master_key: str, chunk_index: int) -> int:
    """Return a deterministic integer seed from master_key + chunk_index."""
    data = f"{master_key}:{chunk_index}".encode()
    digest = hashlib.sha256(data).hexdigest()
    return int(digest, 16) % (2 ** 32)


# ---------------------------------------------------------------------------
# Dynamic DNA encoding / decoding (per chunk)
# ---------------------------------------------------------------------------

def _get_dynamic_mapping(master_key: str, chunk_index: int):
    """
    Shuffle the 4 DNA bases using a seeded PRNG to produce a unique
    binary-pair → DNA-base mapping for this chunk.
    Returns (encoding_dict, decoding_dict).
    """
    seed = _derive_seed(master_key, chunk_index)
    rng = random.Random(seed)
    shuffled_bases = BASES[:]
    rng.shuffle(shuffled_bases)
    encoding = {pair: base for pair, base in zip(BINARY_PAIRS, shuffled_bases)}
    decoding = {v: k for k, v in encoding.items()}
    return encoding, decoding


# ---------------------------------------------------------------------------
# Binary ↔ DNA encoding
# ---------------------------------------------------------------------------

def _bits_to_dna(bits: str, encoding: dict) -> str:
    """Convert a binary string (length multiple of 2) to a DNA string."""
    if len(bits) % 2 != 0:
        bits = bits + '0'          # pad if needed (only happens at edge)
    dna = []
    for i in range(0, len(bits), 2):
        pair = bits[i:i+2]
        dna.append(encoding[pair])
    return ''.join(dna)


def _dna_to_bits(dna: str, decoding: dict) -> str:
    """Convert a DNA string back to binary."""
    return ''.join(decoding[b] for b in dna)


# ---------------------------------------------------------------------------
# DNA XOR
# ---------------------------------------------------------------------------

def _dna_xor_base(b1: str, b2: str) -> str:
    bits1 = BASE_TO_BITS_FIXED[b1]
    bits2 = BASE_TO_BITS_FIXED[b2]
    xor_bits = format(int(bits1, 2) ^ int(bits2, 2), '02b')
    return BITS_TO_BASE_FIXED[xor_bits]


def _dna_xor(seq: str, key_seq: str) -> str:
    return ''.join(_dna_xor_base(s, k) for s, k in zip(seq, key_seq))


def _generate_dna_key(length: int, master_key: str, chunk_index: int) -> str:
    """Generate a pseudo-random DNA key of given length for a chunk."""
    seed = _derive_seed(master_key, chunk_index + 1_000_000)  # offset to separate seeds
    rng = random.Random(seed)
    return ''.join(rng.choice(BASES) for _ in range(length))


# ---------------------------------------------------------------------------
# DNA Complement
# ---------------------------------------------------------------------------

def _dna_complement(seq: str) -> str:
    return ''.join(COMPLEMENT[b] for b in seq)


# ---------------------------------------------------------------------------
# DNA Permutation
# ---------------------------------------------------------------------------

def _dna_permute(seq: str, master_key: str, chunk_index: int) -> (str, list):
    """Permute DNA sequence; return permuted sequence and the permutation index."""
    seed = _derive_seed(master_key, chunk_index + 2_000_000)
    rng = random.Random(seed)
    indices = list(range(len(seq)))
    rng.shuffle(indices)
    permuted = ''.join(seq[i] for i in indices)
    return permuted, indices


def _dna_inverse_permute(seq: str, indices: list) -> str:
    """Inverse permutation."""
    result = [''] * len(seq)
    for new_pos, old_pos in enumerate(indices):
        result[old_pos] = seq[new_pos]
    return ''.join(result)


# ---------------------------------------------------------------------------
# Chunk-level Encrypt / Decrypt
# ---------------------------------------------------------------------------

def _encrypt_chunk(bits: str, master_key: str, chunk_index: int):
    """Encrypt a single bit-string chunk. Returns (dna_encrypted, perm_indices)."""
    encoding, _ = _get_dynamic_mapping(master_key, chunk_index)

    # Step 1 – DNA encode
    dna = _bits_to_dna(bits, encoding)

    # Step 2 – DNA XOR with dynamic key
    key_seq = _generate_dna_key(len(dna), master_key, chunk_index)
    dna = _dna_xor(dna, key_seq)

    # Step 3 – DNA Complement
    dna = _dna_complement(dna)

    # Step 4 – DNA Permutation
    dna, perm_indices = _dna_permute(dna, master_key, chunk_index)

    return dna, perm_indices


def _decrypt_chunk(dna: str, master_key: str, chunk_index: int, perm_indices: list) -> str:
    """Decrypt a single DNA-chunk back to bit-string."""
    _, decoding = _get_dynamic_mapping(master_key, chunk_index)

    # Step 4 inverse – Inverse Permutation
    dna = _dna_inverse_permute(dna, perm_indices)

    # Step 3 inverse – Complement (self-inverse)
    dna = _dna_complement(dna)

    # Step 2 inverse – DNA XOR with same key (XOR is self-inverse)
    key_seq = _generate_dna_key(len(dna), master_key, chunk_index)
    dna = _dna_xor(dna, key_seq)

    # Step 1 inverse – DNA decode
    bits = _dna_to_bits(dna, decoding)
    return bits


# ---------------------------------------------------------------------------
# TEXT Encryption / Decryption
# ---------------------------------------------------------------------------

def encrypt_text(plaintext: str, master_key: str) -> dict:
    """
    Encrypt a plaintext string.
    Returns a dict with:
      - 'dna_sequence': the full encrypted DNA string
      - 'original_bit_length': so decryption can truncate correctly
      - 'num_chunks': number of chunks
    
    NOTE: Permutation indices are NOT sent - they are regenerated from the key during decryption.
    """
    # Convert text → binary bit-string
    bits = ''.join(format(ord(c), '08b') for c in plaintext)
    original_bit_length = len(bits)

    # Pad to multiple of CHUNK_SIZE
    pad_len = (CHUNK_SIZE - len(bits) % CHUNK_SIZE) % CHUNK_SIZE
    bits = bits + '0' * pad_len

    chunks = [bits[i:i+CHUNK_SIZE] for i in range(0, len(bits), CHUNK_SIZE)]

    encrypted_dna = []

    for idx, chunk in enumerate(chunks):
        enc_dna, _ = _encrypt_chunk(chunk, master_key, idx)
        encrypted_dna.append(enc_dna)

    return {
        'dna_sequence': ''.join(encrypted_dna),
        'original_bit_length': original_bit_length,
        'num_chunks': len(chunks),
        'chunk_size_dna': CHUNK_SIZE // 2,   # bits/2 = DNA bases per chunk
    }


def decrypt_text(encrypted_data: dict, master_key: str) -> str:
    """
    Decrypt the output of encrypt_text.
    Permutation indices are regenerated from the master_key, not from stored data.
    """
    dna_sequence = encrypted_data['dna_sequence']
    original_bit_length = encrypted_data['original_bit_length']
    chunk_size_dna = encrypted_data['chunk_size_dna']

    # Split DNA back into chunks
    dna_chunks = [dna_sequence[i:i+chunk_size_dna]
                  for i in range(0, len(dna_sequence), chunk_size_dna)]

    bits = ''
    for idx, dna_chunk in enumerate(dna_chunks):
        # Regenerate permutation indices from key (not from stored data)
        _, perm_idx = _dna_permute('', master_key, idx)  # Get indices only
        # Actually, we need to regenerate properly - let's fix this
        # We need the permutation that was used, so regenerate it
        seed = _derive_seed(master_key, idx + 2_000_000)
        rng = random.Random(seed)
        perm_idx = list(range(len(dna_chunk)))
        rng.shuffle(perm_idx)
        
        bits += _decrypt_chunk(dna_chunk, master_key, idx, perm_idx)

    # Trim to original length
    bits = bits[:original_bit_length]

    # Convert bits → text
    chars = []
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        if len(byte) == 8:
            chars.append(chr(int(byte, 2)))
    return ''.join(chars)


# ---------------------------------------------------------------------------
# IMAGE Encryption / Decryption
# ---------------------------------------------------------------------------

def encrypt_image(image_bytes: bytes, master_key: str) -> dict:
    """
    Encrypt an image.
    Returns a dict with:
      - 'encrypted_image_b64': base64-encoded encrypted pixel array (PNG) for visualization
      - 'dna_sequence': encrypted DNA sequence
      - 'original_bit_length': total bits
      - 'image_shape': (height, width, channels) or (height, width)
      - 'mode': image mode string
    
    NOTE: Permutation indices are NOT sent - they are regenerated from the key during decryption.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    arr = np.array(img, dtype=np.uint8)
    shape = arr.shape
    mode = 'RGB'

    # Flatten pixel values → bit string
    flat = arr.flatten()
    bits = ''.join(format(int(v), '08b') for v in flat)
    original_bit_length = len(bits)

    pad_len = (CHUNK_SIZE - len(bits) % CHUNK_SIZE) % CHUNK_SIZE
    bits = bits + '0' * pad_len

    chunks = [bits[i:i+CHUNK_SIZE] for i in range(0, len(bits), CHUNK_SIZE)]

    encrypted_dna = []

    for idx, chunk in enumerate(chunks):
        enc_dna, _ = _encrypt_chunk(chunk, master_key, idx)
        encrypted_dna.append(enc_dna)

    # Convert encrypted DNA back to pixel values for visual representation
    full_dna = ''.join(encrypted_dna)
    # Decode DNA to bits using default (fixed) encoding for storage
    enc_bits = ''.join(BASE_TO_BITS_FIXED[b] for b in full_dna)
    enc_bits = enc_bits[:original_bit_length]

    # Reconstruct pixel array
    enc_flat = []
    for i in range(0, len(enc_bits), 8):
        byte = enc_bits[i:i+8]
        if len(byte) == 8:
            enc_flat.append(int(byte, 2))

    # Pad if needed
    needed = flat.shape[0]
    while len(enc_flat) < needed:
        enc_flat.append(0)
    enc_flat = enc_flat[:needed]

    enc_arr = np.array(enc_flat, dtype=np.uint8).reshape(shape)
    enc_img = Image.fromarray(enc_arr, mode)

    buf = io.BytesIO()
    enc_img.save(buf, format='PNG')
    enc_img_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        'encrypted_image_b64': enc_img_b64,
        'dna_sequence': full_dna,
        'original_bit_length': original_bit_length,
        'image_shape': list(shape),
        'mode': mode,
        'num_chunks': len(chunks),
        'chunk_size_dna': CHUNK_SIZE // 2,
    }


def decrypt_image(encrypted_data: dict, master_key: str) -> bytes:
    """
    Decrypt the output of encrypt_image.
    Returns raw PNG bytes of the decrypted image.
    Permutation indices are regenerated from the master_key, not from stored data.
    """
    dna_sequence = encrypted_data['dna_sequence']
    original_bit_length = encrypted_data['original_bit_length']
    shape = tuple(encrypted_data['image_shape'])
    mode = encrypted_data['mode']
    chunk_size_dna = encrypted_data['chunk_size_dna']

    dna_chunks = [dna_sequence[i:i+chunk_size_dna]
                  for i in range(0, len(dna_sequence), chunk_size_dna)]

    bits = ''
    for idx, dna_chunk in enumerate(dna_chunks):
        # Regenerate permutation indices from key (not from stored data)
        seed = _derive_seed(master_key, idx + 2_000_000)
        rng = random.Random(seed)
        perm_idx = list(range(len(dna_chunk)))
        rng.shuffle(perm_idx)
        
        bits += _decrypt_chunk(dna_chunk, master_key, idx, perm_idx)

    bits = bits[:original_bit_length]

    flat = []
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        if len(byte) == 8:
            flat.append(int(byte, 2))

    needed = 1
    for s in shape:
        needed *= s
    while len(flat) < needed:
        flat.append(0)
    flat = flat[:needed]

    arr = np.array(flat, dtype=np.uint8).reshape(shape)
    img = Image.fromarray(arr, mode)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()
