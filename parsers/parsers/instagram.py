import os
import typing as T
from apify_client import ApifyClient

from utils.logger import get_logger
logger = get_logger("main")

class InstagramParser:
    APIFY_TOKEN = os.getenv("APIFY_TOKEN", "apify_api_5cbyRGXIQnlWQqtdT8U0bWg5SZWuEi1Tp8fL")

    def __init__(self, batch_size: int = 45):
        self.batch_size = batch_size
        self.client = ApifyClient(self.APIFY_TOKEN)

    def hashtag_detail_input(
            self,
            tags: T.List[str]
    ) -> dict[str, T.Any]:
        urls = [f"https://www.instagram.com/explore/tags/{t}/" for t in tags]
        return {
            "directUrls": urls,
            "resultsType": "details",
            "proxyConfiguration": {"useApifyProxy": True},
        }

    def hashtag_posts_input(
            self,
            tags: T.List[str],
            limit: int
    ) -> dict[str, T.Any]:
        urls = [f"https://www.instagram.com/explore/tags/{t}/" for t in tags]
        return {
            "directUrls": urls,
            "resultsType": "posts",             # ← допустимое значение
            "resultsLimit": limit,
            "proxyConfiguration": {"useApifyProxy": True},
        }
    
    def run_actor(
            self,
            run_input: dict[str, T.Any]
    ) -> T.Sequence[dict[str, T.Any]]:
        safe_input = {k: v for k, v in run_input.items() if k != "proxyConfiguration"}
        logger.debug("Actor input: %s", safe_input)
        run = self.client.actor("apify/instagram-scraper").call(run_input=run_input)
        items = self.client.dataset(run["defaultDatasetId"]).list_items().items
        logger.debug("Actor done → %s items", len(items))
        return items