#!/usr/bin/env python3

import sys
import os
import json
import shopify
import requests

data = open("payload.json").read()
print(data)

ret = requests.post(
    "http://localhost:8000/webhooks/orders-paid",
    data=open("payload.json").read(),
    headers={"Content-Type":"application/json","X-Shopify-Shop-Domain":"cleansimpleeats.myshopify.com"}
)

print(json.dumps(ret.json(),indent=2))
