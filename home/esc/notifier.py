
import json
import os
import requests

def sms_notify(message):
    if os.environ.get("SMS_NOTIFY","false")=="true" and os.environ.get("SMS_NOTIFY_NUMBER",None) is not None:
        pass        
def smtp_notify(subject,message):
    ret = requests.post(
        "https://api.smtp2go.com/v3/email/send",
        headers={
            "Content-Type":"application/json",
        },
        data=json.dumps({
            "api_key":os.environ.get("SMTP2GO_key"),
            "sender":"ellie@chelseaandrachel.com",
            "to":["cassadyeleanor@gmail.com"],
            "subject":f"{os.environ.get('SHOPIFY_DOMAIN')}: {subject}",
            "text_body":message,
            "html_body":message,
            
        })
    )