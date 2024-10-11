from django.shortcuts import render,redirect
import shopify
from shopify_app.decorators import shop_login_required

import logging
import json
from django.http import HttpResponse
from .models import ShopifySite
from .esc import webhooks
from .esc.graphql_common import Discounts,Metafields
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from . import esc
from .esc.views import *
from .project import webhooks as project_webhooks    

logger = logging.getLogger(__name__)
    

@shop_login_required
def install(request):
    
    default_install(request)  
    return redirect("/")   

@shop_login_required
def reinstall(request):
    
    webhooks.Shopify().uninstall(shopify,"webhooks")
    webhooks.Shopify().install(shopify,"orders/create","webhooks/orders-paid")
    return HttpResponse(json.dumps(webhooks.Shopify().list(shopify)), content_type="application/json")
    