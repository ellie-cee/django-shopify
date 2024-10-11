#!/usr/bin/env python3

import json
import mysql.connector
import os

mydb = mysql.connector.connect(
  host=os.environ.get("DB_HOST"),
  user=os.environ.get("DB_USER"),
  password=os.environ.get("DB_PASSWORD"),
  database=os.environ.get("DB_NAME")
)

cursor = mydb.cursor(dictionary=True)

cursor.execute(
    "select * from home_shopifysite where shopify_site = %s limit 1",   
    [os.environ.get("SHOPIFY_DOMAIN")]
)
print(cursor.fetchone().get("access_token"))