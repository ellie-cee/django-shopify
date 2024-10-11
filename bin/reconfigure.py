#!/usr/bin/env python3

import os
import sys
import heroku3
import toml
import json
from slugify import slugify

envfile = open(".env")
config = {}
heroku = heroku3.from_key(os.environ.get("HEROKU_KEY"))
print("Configuring Heroku...")
for line in envfile.readlines():
    line = line.replace("\n","")
    try:
        key = line[0:line.index("=")]
        if key in ["HEROKU_KEY","HEROKU_APP_NAME","SHOPIFY_TOKEN"]:
            continue
        value = line[line.index("=")+1:len(line)].strip()
        print(f"{key}: {value}")
        config[key] = value
    except:
        pass
print(json.dumps(heroku.update_appconfig(os.environ.get("HEROKU_APP_NAME"),config).to_dict(),indent=1))
print("Done")

print("Configuring shopify.app.toml")
shopify_app = toml.load("shopify-extensions/shopify.app.toml")
shopify_app["client_id"] = config["SHOPIFY_API_KEY"]
shopify_app["name"] = config["APP_NAME"]
shopify_app["handle"] = slugify(config["APP_NAME"])
shopify_app["application_url"] = config["APP_URL"]
shopify_app["auth"]["redirect_urls"] = [f"{config['APP_URL']}{x}" for x in ["shopify/auth/","shopify/login/","shopify/finalize/","shopify/logout/",""]]
open("shopify-extensions/shopify.app.toml","w").write(toml.dumps(shopify_app))


    
