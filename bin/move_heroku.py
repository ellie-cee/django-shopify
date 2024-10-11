#!/usr/bin/env python3

import os
import sys
import json
from urllib.parse import urlparse
from password_generator import PasswordGenerator
import subprocess
import heroku3
import toml
import json
import argparse
from slugify import slugify

parser = argparse.ArgumentParser()
parser.add_argument("--url","-u",required=True)
args = parser.parse_args()

if os.environ.get("HEROKU_KEY") is None or os.environ.get("HEROKU_KEY")=="":
    print("You must set environment variable HEROKU_KEY")
    sys.exit()
    
envfile = open(".env")
config = {}
heroku = heroku3.from_key(os.environ.get("HEROKU_KEY"))

parsed = urlparse(args.url)

shopify_app = toml.load("shopify-extensions/shopify.app.toml")
shopify_app["client_id"] = config["SHOPIFY_API_KEY"]
shopify_app["name"] = config["APP_NAME"]
shopify_app["handle"] = slugify(config["APP_NAME"])
shopify_app["application_url"] = config["APP_URL"]
shopify_app["auth"]["redirect_urls"] = [f"{config['APP_URL']}{x}" for x in ["shopify/auth/","shopify/login/","shopify/finalize/","shopify/logout/",""]]
open("shopify-extensions/shopify.app.toml","w").write(toml.dumps(shopify_app))


