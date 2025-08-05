import os
import time
import typing as T
from apify_client import ApifyClient

from utils.logger import get_logger
logger = get_logger("main")

class YoutubeParser:
    APIFY_TOKEN = os.getenv("APIFY_TOKEN", "apify_api_5cbyRGXIQnlWQqtdT8U0bWg5SZWuEi1Tp8fL")

    def __init__(self, batch_size: int = 45):
        self.batch_size = batch_size
        self.client = ApifyClient(self.APIFY_TOKEN)

    
    def run_actor(self, urls: T.List[str]) -> T.Sequence[dict[str, T.Any]]:
        """
        Запускает актор Apify и возвращает результаты
        """
        try:
            run_input = {
                "searchQueries": [url for url in urls],
                "maxResults": 0,
                "maxResultsShorts": 15,
                "maxResultStreams": 0,
                "dateFilter": "year",
                "sortBy": "relevance"
            }
            run = self.client.actor("streamers/youtube-scraper").call(run_input=run_input)
            
            # Ждем завершения выполнения
            while True:
                run_info = self.client.run(run["id"]).get()
                if run_info["status"] == "SUCCEEDED":
                    break
                elif run_info["status"] == "FAILED":
                    raise Exception(f"Run failed: {run_info['meta']['error']}")
                time.sleep(5)
            
            # Получаем результаты
            items = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                items.append(item)
            return items
        except Exception as e:
            print(f"Error running actor: {str(e)}")
            return None
        

    def run_actor_hashtags(self, urls: T.List[str]) -> T.Sequence[dict[str, T.Any]]:
        """
        Запускает актор Apify и возвращает результаты
        """
        try:
            # print(run_input)
            run_input = {
                "searchQueries": urls,
                "maxResults": 0,
                "maxResultsShorts": 15,
                "maxResultStreams": 0,
                "dateFilter": "year",
                "sortBy": "relevance"  # Сортируем по релевантности
            }
            print(run_input)
            run = self.client.actor("streamers/youtube-scraper").call(run_input=run_input)
            
            # Ждем завершения выполнения
            while True:
                run_info = self.client.run(run["id"]).get()
                if run_info["status"] == "SUCCEEDED":
                    break
                elif run_info["status"] == "FAILED":
                    raise Exception(f"Run failed: {run_info['meta']['error']}")
                time.sleep(5)
            
            # Получаем результаты
            items = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                items.append(item)
            return items
        except Exception as e:
            print(f"Error running actor: {str(e)}")
            return None