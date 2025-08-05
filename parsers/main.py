import os
import typing as T
from urllib.parse import unquote

import psycopg2
import psycopg2.extras as ext

from parsers.instagram import InstagramParser
from parsers.youtube import YoutubeParser
from db import db
from utils.tools import chunked

from utils.logger import get_logger
logger = get_logger("main")


def parse_instagram_profiles(conn, profiles, instagram_parser, BATCH_SIZE, POSTS_LIMIT, public=True):
    if len(profiles) > 0:
        all_profile_items: list[dict[str, T.Any]] = []
        for chunk in chunked(profiles, BATCH_SIZE):
            details_input = {
                "directUrls": chunk,
                "resultsType": "details",
                "resultsLimit": 1,
                "proxyConfiguration": {"useApifyProxy": True},
            }
            all_profile_items.extend(instagram_parser.run_actor(details_input))
        db.upsert_profiles(conn, all_profile_items, public)

        if public:
            all_posts: list[dict[str, T.Any]] = []
            for chunk in chunked(profiles, BATCH_SIZE):
                posts_input = {
                    "directUrls": chunk,
                    "resultsType": "posts",
                    "resultsLimit": POSTS_LIMIT,
                    "proxyConfiguration": {"useApifyProxy": True},
                }
                all_posts.extend(instagram_parser.run_actor(posts_input))
            logger.info(f"Posts: {len(all_posts)}")
            logger.info(all_posts)
            # print(all_posts[0])
            db.upsert_posts(conn, "profiles", all_posts)

def parse_instagram_hashtags(conn, tags, instagram_parser, BATCH_SIZE, POSTS_LIMIT):
    if len(tags) > 0:
        hash_details = []
        for chunk in chunked(tags, BATCH_SIZE):
            hash_details.extend(
                instagram_parser.run_actor(
                    instagram_parser.hashtag_detail_input(chunk)
                )
            )
        db.upsert_hashtags(conn, hash_details)

        for chunk in chunked(tags, BATCH_SIZE):
            posts = instagram_parser.run_actor(
                instagram_parser.hashtag_posts_input(chunk, POSTS_LIMIT)
            )

            posts = [p for p in posts if p['type'] == 'Video']
            urls = [p["url"] for p in posts]
            if len(urls) > 0:
                posts_input = {
                    "directUrls": urls,
                    "resultsType": "posts",
                    "resultsLimit": POSTS_LIMIT,
                    "proxyConfiguration": {"useApifyProxy": True},
                }

                posts_details = instagram_parser.run_actor(posts_input)
                print("|||")
                print(posts_details)

            if not posts:
                continue

            for tag in chunk:
                h_id = next((h["id"] for h in hash_details if unquote(h['name']) == tag), None)
                if not h_id:
                    continue
                
                db.upsert_posts(conn, "hashtags", posts)

def parse_youtube_profiles(conn, profiles, youtube_parser, BATCH_SIZE, POSTS_LIMIT):
    if len(profiles) > 0:
        channels = {}
        posts = []
        shorts = youtube_parser.run_actor(profiles)

        for short in shorts:
            print(short)
            channels['channelUsername'] = {
                "platform": "youtub",
                "username": short['channelUsername'],
                "displayName": short['channelName'],
                "followersCount": short['numberOfSubscribers']
            }
            posts.append({
                "id": str(short['id']),
                "platform": "youtub",
                "videoDuration": convert_duration_to_seconds(short['duration']),
                "caption": short['text'],
                "url": short['url'],
                "searchType": 'profiles',
                "username": short['channelUsername'],
                "postType": 'video',
                "takenAt": short['date'],
                "likes": short['likes'],
                "videoPlayCount": short['viewCount'],
                "comments": short['commentsCount'],
                "timestamp": short['date'],
                "raw": short,
            })
        logger.info(channels)
        logger.info(shorts)
        db.upsert_profiles(conn, channels.values())
        db.upsert_posts(conn, "profiles", posts)

def parse_youtube_hashtags(conn, tags, youtube_parser, BATCH_SIZE, POSTS_LIMIT):
    if len(tags) > 0:
        posts = []
        channels = {}
        tags = [f"#{t}" for t in tags]
        shorts = youtube_parser.run_actor_hashtags(tags)
        for short in shorts:
            print(short)
            channels['channelUsername'] = {
                "platform": "youtub",
                "username": short['channelUsername'],
                "displayName": short['channelName'],
                "followersCount": short['numberOfSubscribers']
            }
            posts.append({
                "id": str(short['id']),
                "platform": "youtub",
                "videoDuration": convert_duration_to_seconds(short['duration']),
                "caption": short['text'],
                "url": short['url'],
                "searchType": 'hashtags',
                "username": short['channelUsername'],
                "postType": 'video',
                "takenAt": short['date'],
                "likes": short['likes'],
                "videoPlayCount": short['viewCount'],
                "comments": short['commentsCount'],
                "timestamp": short['date'],
                "raw": short,
            })
        db.upsert_posts(conn, "hashtags", posts)
        db.upsert_profiles(conn, channels.values(), False)

def convert_duration_to_seconds(duration_str: str) -> int:
    h, m, s = duration_str.split(':')
    return int(h) * 3600 + int(m) * 60 + int(s)

def main():
    logger.info("Parser start")

    instagram_parser = InstagramParser()
    youtube_parser = YoutubeParser()

    POSTGRES_DSN = os.getenv("POSTGRES_DSN", "postgresql://postgres:secret@5.129.200.110:5432/data")
    MAX_PROFILE_AGE_HRS = int(os.getenv("MAX_PROFILE_AGE_HRS", "24"))
    POSTS_LIMIT         = int(os.getenv("POSTS_LIMIT", "150"))
    BATCH_SIZE          = int(os.getenv("BATCH_SIZE", "45"))

    with psycopg2.connect(POSTGRES_DSN) as conn:
        # INSTAGRAM
        profiles = db.get_profiles_instagram(conn)
        logger.info(f"INSTAGRAM Profiles: {len(profiles)}")
        tags = db.get_hashtags_instagram(conn)
        logger.info(f"INSTAGRAM Tags: {len(tags)}")
        parse_instagram_profiles(conn, profiles, instagram_parser, BATCH_SIZE, POSTS_LIMIT)
        parse_instagram_hashtags(conn, tags, instagram_parser, BATCH_SIZE, POSTS_LIMIT)

        profiles_not_public = list(set(db.get_not_public_profiles_instagram(conn)))
        logger.info(f"INSTAGRAM Profiles not public: {profiles_not_public}")
        parse_instagram_profiles(conn, profiles_not_public, instagram_parser, BATCH_SIZE, POSTS_LIMIT, public=False)

        #YOUTUBE
        # profiles = db.get_profiles_youtube(conn)
        # logger.info(f"YOUTUBE Profiles: {len(profiles)}")
        # tags = db.get_hashtags_youtube(conn)
        # logger.info(f"YOUTUBE Tags: {len(tags)}")
        # parse_youtube_profiles(conn, profiles, youtube_parser, BATCH_SIZE, POSTS_LIMIT)
        # parse_youtube_hashtags(conn, tags, youtube_parser, BATCH_SIZE, POSTS_LIMIT)

if __name__ == "__main__":
    main()