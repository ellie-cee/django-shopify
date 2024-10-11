#!/usr/bin/env python3

import json
import argparse
import os.path
import traceback

parser = argparse.ArgumentParser(
    prog="backfill_to",
    description="Backfill into main repository"
)
parser.add_argument("-s","--source",required=True)
args = parser.parse_args()

files = """
shopify_django_app/asgi.py
shopify_django_app/__init__.py
shopify_django_app/settings.py
shopify_django_app/urls.py
shopify_django_app/wsgi.py
shopify_app/admin.py
shopify_app/apps.py
shopify_app/context_processors.py
shopify_app/decorators.py
shopify_app/__init__.py
shopify_app/middleware.py
shopify_app/urls.py
shopify_app/views.py
home/templates/home/index.html
home/templates/home/transforms_list.html
home/templates/home/discounts_list.html
home/templates/home/webhooks.html
home/templates/home/webhooks_list.html
home/templates/home/test.html
home/templates/base.html
home/static/style.css
home/static/products_list.js
home/static/js/transforms.js
home/static/js/discounts.js
home/static/js/webhooks.js
home/static/js/esc.js
home/static/stylesheets/application.css
home/esc/urls.py
home/context_processors.py
home/templates/base.html
home/templates/nav.html
home/esc/recharge.py
home/esc/notifier.py
home/esc/graphql_common.py
home/esc/webhooks.py
home/models.py
home/esc/views.py""".split("\n")

source = f"{args.source}/" if not args.source.endswith("/") else args.source

for file in files:
    try:
        contents = open(f"{args.source}{file}").read()
        open(f"{file}","w").write(contents)
        print(f"Copied {file} from {source}")
    except:
        traceback.print_exc()

