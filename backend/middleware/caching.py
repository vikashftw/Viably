import time
from typing import Dict, Tuple

CACHE: Dict[str, Tuple[float, str]] = {}
CACHE_DURATION = 3600  # Cache duration in seconds (1 hour)

def get_from_cache(key: str) -> str | None:
    """
    Retrieves an item from the cache if it exists and has not expired.
    """
    if key in CACHE:
        timestamp, value = CACHE[key]
        if time.time() - timestamp < CACHE_DURATION:
            return value
    return None

def set_in_cache(key: str, value: str):
    """
    Stores an item in the cache.
    """
    CACHE[key] = (time.time(), value)
