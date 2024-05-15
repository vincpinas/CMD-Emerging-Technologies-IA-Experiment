import torch
import os
import sys
from TTS.api import TTS
import time
import praw


def current_milli_time():
    return str(round(time.time() * 1000))


device = "cuda" if torch.cuda.is_available() else "cpu"

speaker_mp3 = os.getcwd() + "/speakers/" + sys.argv[1]

user_agent = "praw_scraper_1.0"

reddit = praw.Reddit(
    username="TrueChampion2007",
    password="",
    client_id="",
    client_secret="",
    user_agent=user_agent,
)

subreddit = reddit.subreddit(sys.argv[2])
post = subreddit.random()

finaltext = post.title + post.selftext

# Init TTS
speaker = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

# # Text to speech to a file
speaker.tts_to_file(text=finaltext, speaker_wav=speaker_mp3, language="en", file_path=sys.argv[3])
