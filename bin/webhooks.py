#!/usr/bin/env python3

from pathlib import Path
import sys

if __package__ is None:                  
    DIR = Path(__file__).resolve().parent
    sys.path.insert(0, str(DIR.parent))
    __package__ = DIR.name



import shopify
import json
import csv
import os
from jmespath import search as jpath
from argparse import ArgumentParser
from home.cnr.graphql_common import Webhooks
import requests

def hookByTopic(topic):
    for hook in jpath("data.webhookSubscriptions.nodes",Webhooks().list()):
        if hook.get("topic")==topic:
            return hook
    return None

session = shopify.Session(f"{os.environ.get('SHOPIFY_DOMAIN')}","2024-07",os.environ.get("SHOPIFY_TOKEN"))
shopify.ShopifyResource.activate_session(session)

parser = ArgumentParser()
parser.add_argument("--add",action='store_true')
parser.add_argument("--remove",action='store_true')
parser.add_argument("--list",action='store_true')
parser.add_argument("--trigger",action='store_true')
parser.add_argument("--local",action='store_true')

parser.add_argument("--topic",required=False)
parser.add_argument("--path",required=False)
args = parser.parse_args()



if args.add:
    if not hasattr(args,"path") or not hasattr(args,"topic"):
        print("path and topic required to create webhook!")
        sys.exit()
    hook = Webhooks().create(args.topic,f"{os.environ.get('APP_URL')}/{args.path}")
    print(json.dumps(hook,indent=1))
elif args.remove:
    if not hasattr(args,"topic"):
        print("topic required to remove webhook!")
        sys.exit()
    hook = hookByTopic(args.topic)
    print(json.dumps(hook,indent=1))
    if hook is None:
        print(f"topic {args.topic} does not exist!")
        sys.exit()
    print(json.dumps(Webhooks().delete(hook.get("id").split("/")[-1]),indent=1))
    
elif args.list:
    print(json.dumps(Webhooks().list(),indent=1))
elif args.trigger:
    if not hasattr(args,"path"):
        print("topic required to trigger webhook!")
        sys.exit()        
    url = f"{os.environ.get('APP_URL') if not args.local else 'http://127.0.0.1:8000/'}{args.path}"
    ret = requests.post(
        url,
        data=sys.stdin.read(),
        headers={
            "Content-Type":"application/json",
            "X-Shopify-Shop-Domain":os.environ.get("SHOPIFY_DOMAIN")
        }
    )
    print(json.dumps(ret.json(),indent=1))


