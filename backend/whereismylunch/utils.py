__author__ = 'Tomasz Iwanek'

import hashlib
import uuid


_SALT = "pBom4w5T8VIRZUFvs0Iq8pFZ4OPw5mht"


def encode_password(password):
    return hashlib.sha256(password.encode('utf-8') + _SALT.encode('utf-8')).hexdigest()


def create_session_token():
    return str(uuid.uuid4())
