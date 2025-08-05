import json
import typing as T
import datetime as dt
from urllib.parse import unquote
import uuid

from . import sql

from utils.logger import get_logger
from utils.tools import chunked, now_utc

import psycopg2.extras as ext


logger = get_logger("main")

def get_profiles_instagram(conn) -> T.List[str]:
    """Возвращает список directUrl'ов, которые надо пересканировать."""
    with conn.cursor() as cur:
        cur.execute(sql.sql_get_profiles_to_update,)
        usernames = [row[0] for row in cur.fetchall()]
    urls = [f"https://www.instagram.com/{u}/" for u in usernames]
    logger.info("Profiles queued for refresh: %s", len(urls))
    return urls


def get_not_public_profiles_instagram(conn) -> T.List[str]:
    """Возвращает список directUrl'ов, которые надо пересканировать."""
    with conn.cursor() as cur:
        cur.execute(sql.sql_get_profiles_not_public_to_update,)
        usernames = [row[0] for row in cur.fetchall()]
    urls = [f"https://www.instagram.com/{u}/" for u in usernames]
    logger.info("Profiles queued for refresh: %s", len(urls))
    return urls


def get_profiles_youtube(conn) -> T.List[str]:
    """Возвращает список directUrl'ов, которые надо пересканировать."""
    with conn.cursor() as cur:
        cur.execute(sql.sql_get_profiles_youtube,)
        usernames = [row[0] for row in cur.fetchall()]
    chanels = [u for u in usernames]
    logger.info("Profiles queued for refresh: %s", len(chanels))
    return chanels

def get_hashtags_youtube(conn) -> T.List[str]:
    """Возвращает список directUrl'ов, которые надо пересканировать."""
    with conn.cursor() as cur:
        cur.execute(sql.sql_get_hashtags_youtube,)
        usernames = [row[0] for row in cur.fetchall()]
    chanels = [u for u in usernames]
    logger.info("hashtags queued for refresh: %s", len(chanels))
    return chanels


def get_hashtags_instagram(conn) -> list[str]:
    with conn.cursor() as cur:
        cur.execute(sql.sql_get_hashtags_to_update)
        tags = [row[0] for row in cur.fetchall()]
    logger.info("Hashtags queued for refresh: %s", len(tags))
    return tags


def upsert_profiles(conn, items: T.Sequence[dict[str, T.Any]], public=True):
    rows = [
        (
            p.get('platform', 'instagram'),
            p.get("username"),
            p.get("fullName"),  # displayName
            p.get("profilePicUrl"),  # profilePic
            p.get("biography"),  # profileBio
            p.get("followersCount", 0),  # followers
            p.get("followsCount", 0),  # following
            p.get("latestVideo"),  # latestVideo
            p.get("commentsCount", 0),  # comments
            public,
            now_utc(),  # createdAt
            now_utc(),  # updatedAt
        )
        for p in items
    ]
    with conn.cursor() as cur:
        for batch in chunked(rows, 100):
            ext.execute_values(
                cur,
                sql.sql_isert_instagram_profile,
                batch,
                page_size=len(batch)
            )
    conn.commit()
    logger.info("Profiles upserted: %s", len(rows))


def upsert_posts(conn, search_type, items: T.Sequence[dict[str, T.Any]]):
    print(items)
    rows = [
        (
            p["id"],
            p.get('platform', 'instagram'),
            search_type,
            p.get("username") if p.get("username") else p.get("ownerUsername"),
            p.get("videoDuration"),
            p.get("url"),
            p.get("caption"),
            p.get("type", 'Video'),
            dt.datetime.fromtimestamp(p.get("timestamp")) if isinstance(p.get("timestamp"), (int, float)) else dt.datetime.fromisoformat(p.get("timestamp").replace("Z", "+00:00")),
            p.get("likesCount") if p.get("likesCount") else p.get("likes", 0),
            p.get("videoPlayCount", 0),
            p.get("commentsCount", 0),
            json.dumps(p),
            now_utc(),
        )
        for p in items
    ]
    with conn.cursor() as cur:
        for batch in chunked(rows, 100):
            ext.execute_values(cur, sql.sql_isert_instagram_post, batch, page_size=len(batch))
    conn.commit()
    logger.info("Posts upserted: %s", len(rows))


def upsert_hashtags(conn, items: T.List[dict[str, T.Any]]):
    for h in items:
        print(1)
        print(h.keys())
        # print(h['topPosts'])
        # print(h['posts'])

    rows = [
        (
            h["id"],
            "instagram",
            unquote(h['name']),  # Извлекаем тег из URL
            dt.datetime.fromisoformat(h["firstSeen"]).replace(tzinfo=dt.timezone.utc)
                if h.get("firstSeen") else now_utc(),
            # json.dumps(h),
            h.get("postsCount", 0),
            now_utc(),
        )
        for h in items
    ]
    with conn.cursor() as cur:
        for batch in chunked(rows, 100):
            ext.execute_values(cur, sql.sql_isert_instagram_hashtag, batch, page_size=len(batch))
    conn.commit()
    logger.info("Hashtags upserted: %s", len(rows))


def upsert_hashtag_posts_links(conn, tag: str, posts: T.List[dict[str, T.Any]]):
    """Сохраняет посты по хештегу"""
    rows = [
        (
            p["id"],
            "instagram",
            tag,
            p.get("ownerUsername"),
            p.get("caption"),
            p.get("type"),
            dt.datetime.fromtimestamp(p.get("timestamp")) if isinstance(p.get("timestamp"), (int, float)) else dt.datetime.fromisoformat(p.get("timestamp").replace("Z", "+00:00")),
            p.get("likesCount", 0),
            p.get("videoPlayCount", 0),
            p.get("commentsCount", 0),
            json.dumps(p),
            dt.datetime.fromtimestamp(p.get("timestamp")) if isinstance(p.get("timestamp"), (int, float)) else dt.datetime.fromisoformat(p.get("timestamp").replace("Z", "+00:00")),
            now_utc()
        )
        for p in posts
    ]
    with conn.cursor() as cur:
        for batch in chunked(rows, 100):
            ext.execute_values(cur, sql.sql_isert_instagram_hashtag_post, batch, page_size=len(batch))
    conn.commit()
    logger.info("Hashtag posts upserted: %s", len(rows))

def upsert_hashtags_youtube(conn, items: T.List[dict[str, T.Any]]):
    rows = [
        (
            str(uuid.uuid4()),  # id
            "youtube",
            h['name'],  # tag
            dt.datetime.fromisoformat(h["firstSeen"]).replace(tzinfo=dt.timezone.utc)
                if h.get("firstSeen") else now_utc(),
            h.get("postsCount", 0),
            now_utc(),
        )
        for h in items
    ]
    with conn.cursor() as cur:
        for batch in chunked(rows, 100):
            ext.execute_values(cur, sql.sql_isert_instagram_hashtag, batch, page_size=len(batch))
    conn.commit()
    logger.info("YouTube hashtags upserted: %s", len(rows))
