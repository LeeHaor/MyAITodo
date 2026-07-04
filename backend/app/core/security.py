import hashlib
import hmac
import secrets
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.core.config import settings

PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 390000
HASH_PREFIX = "pbkdf2_sha256"


def _b64encode(value: bytes) -> str:
    return urlsafe_b64encode(value).decode("utf-8")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        prefix, iterations_raw, salt_raw, digest_raw = hashed_password.split("$", 3)
    except ValueError:
        return False

    if prefix != HASH_PREFIX:
        return False

    try:
        iterations = int(iterations_raw)
        salt = _b64decode(salt_raw)
        expected_digest = _b64decode(digest_raw)
    except (ValueError, TypeError):
        return False

    actual_digest = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        plain_password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(actual_digest, expected_digest)


def get_password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return "$".join(
        [
            HASH_PREFIX,
            str(PBKDF2_ITERATIONS),
            _b64encode(salt),
            _b64encode(digest),
        ]
    )


def create_access_token(subject: str) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def get_token_subject(token: str) -> str | None:
    try:
        payload = decode_access_token(token)
    except JWTError:
        return None

    subject = payload.get("sub")
    if not isinstance(subject, str):
        return None

    return subject
