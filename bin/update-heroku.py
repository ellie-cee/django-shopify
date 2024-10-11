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
from slugify import slugify

config = {}
for line in open(".env").readlines():
    if "=" not in line:
        continue
    line = line.replace("\n","").strip()
    key = line[0:line.index("=")]
    value = line[line.index("=")+1:len(line)].strip()
    config[key] = value
    


print("Configuring Heroku...")
heroku = heroku3.from_key(os.environ.get("HEROKU_KEY"))

ret = heroku.update_appconfig(
    config.get("HEROKU_APP_NAME"),
    {key:config[key] for key in filter(lambda x: x not in ["HEROKU_KEY","HEROKU_APP_NAME","SHOPIFY_TOKEN"],config.keys()) }
)