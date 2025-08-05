import re
import datetime as dt
from urllib.parse import unquote
from typing import Any, Iterable, Sequence, List

def now_utc():
    return dt.datetime.now(dt.UTC)

def chunked(iterable: Iterable[Any], size: int):
    buf: list[Any] = []
    for item in iterable:
        buf.append(item)
        if len(buf) >= size:
            yield buf
            buf = []
    if buf:
        yield buf

def extract_tag_from_url(url: str) -> str | None:
    match = re.search(r'/tags/([^/]+)', url)
    if not match:
        return None
    tag = unquote(match.group(1))
    return tag