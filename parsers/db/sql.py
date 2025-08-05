sql_isert_instagram_profile = """
    INSERT INTO "Profiles" (
        platform,
        username,
        "displayName",
        "profilePic",
        "profileBio",
        followers,
        following,
        "latestVideo",
        comments,
        public,
        "createdAt",
        "updatedAt"
    )
    VALUES %s
    ON CONFLICT (platform, username) DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "profilePic" = EXCLUDED."profilePic",
        "profileBio" = EXCLUDED."profileBio",
        followers = EXCLUDED.followers,
        following = EXCLUDED.following,
        "latestVideo" = EXCLUDED."latestVideo",
        comments = EXCLUDED.comments,
        public = EXCLUDED.public,
        "updatedAt" = EXCLUDED."updatedAt"
"""


sql_get_profiles_to_update = """
    SELECT username
    FROM   "Profiles"
    WHERE  username IS NOT NULL
        and platform = 'instagram'
        and public = true
    ORDER  BY "updatedAt" NULLS FIRST
"""

sql_get_profiles_not_public_to_update = """
    SELECT username
    FROM   "Posts"
    WHERE  username IS NOT NULL
        and platform = 'instagram'
        and "searchType" = 'hashtags'
        and "postType" = 'Video'
"""

sql_get_profiles_youtube = """
    SELECT username
    FROM   "Profiles"
    WHERE  username IS NOT NULL
        and platform = 'youtub'
    ORDER  BY "updatedAt" NULLS FIRST
"""

sql_get_hashtags_to_update = """
    SELECT tag
    FROM   "Hashtag"
    WHERE  platform = 'instagram'
    ORDER  BY "updatedAt" NULLS FIRST
"""

sql_get_hashtags_youtube = """
    SELECT tag
    FROM   "Hashtag"
    WHERE  platform = 'youtub'
    ORDER  BY "updatedAt" NULLS FIRST
"""

sql_isert_instagram_post = """
    INSERT INTO "Posts" (
        id, platform, "searchType", username, "durationSec", url, caption, "postType", "takenAt",
        likes, "videoPlayCount", comments, raw, "scrapedAt")
    VALUES %s
    ON CONFLICT (id) DO UPDATE SET
        url = EXCLUDED.url,
        caption = EXCLUDED.caption,
        likes = EXCLUDED.likes,
        "videoPlayCount" = EXCLUDED."videoPlayCount",
        comments = EXCLUDED.comments,
        raw = EXCLUDED.raw,
        "scrapedAt" = EXCLUDED."scrapedAt"
"""

sql_isert_instagram_hashtag = """
    INSERT INTO "Hashtag" (id, platform, tag, "firstSeen", "totalPosts", "updatedAt")
    VALUES %s
    ON CONFLICT (platform, tag) DO UPDATE SET
        "firstSeen"  = COALESCE("Hashtag"."firstSeen", EXCLUDED."firstSeen"),
        "totalPosts" = EXCLUDED."totalPosts",
        "updatedAt"  = EXCLUDED."updatedAt"
"""

sql_isert_instagram_hashtag_post = """
    INSERT INTO "Post" (
        id, platform, tag, username, caption, "postType", "takenAt",
        likes, "videoPlayCount", comments, raw, "timestamp", "scrapedAt"
    )
    VALUES %s
    ON CONFLICT (id) DO UPDATE SET
        caption = EXCLUDED.caption,
        likes = EXCLUDED.likes,
        "videoPlayCount" = EXCLUDED."videoPlayCount",
        comments = EXCLUDED.comments,
        raw = EXCLUDED.raw,
        "scrapedAt" = EXCLUDED."scrapedAt"
"""