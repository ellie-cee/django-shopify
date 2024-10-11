from django.shortcuts import render,redirect
import shopify
from shopify_app.decorators import shop_login_required

import logging
import json
from django.http import HttpResponse
from .models import ShopifySite
from . import webhooks
from .graphql_common import Discounts,Metafields,Functions,CartTransforms,Webhooks,Application
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from jmespath import search as jsearch
import os

logger = logging.getLogger(__name__)

def json_response(data):
    return HttpResponse(json.dumps(data ), content_type="application/json")
def gid2id(id):
    return id.split("/")[-1]

@shop_login_required
def index(request):
        
    return render(request, 'home/index.html', {'products': [], 'orders': [],"session":request.session})

def default_install(request):
    if not "site_details" in request.session:
        site, created = ShopifySite.objects.get_or_create(shopify_site=request.session["shopify"]["shop_url"])
        if created:
            site.access_token = request.session["shopify"]["access_token"]
            site.save()
        elif site.access_token!=request.session["shopify"]["access_token"]:
            site.access_token = request.session["shopify"]["access_token"]
            site.save()

######### Application

@shop_login_required
def list_scopes(request):
    return json_response(Application().scopes())

@shop_login_required
def dumper(request):
    logger.log(f'token: {request.session["access_token"]}')
    return json_response({"message":"weqweqw    ew"})
    

########## Functions

@shop_login_required
def list_functions(request,type):
    ret = Functions().find(type)
    
    return json_response(ret)

def all_functions(request):
    return json_response(Functions().list())

@shop_login_required
def testbed(request):
    return {}    


######### Discounts



@shop_login_required
def discount_list(request):
    query = Discounts().listAppDiscounts()
    logger.error(json.dumps(query,indent=2))
    discounts = []
    if jsearch("data.discountNodes.nodes",query):
        
        discounts = list(
            map(
                lambda x:{"id":gid2id(x["id"]),"title":x["discount"]["title"]},jsearch("data.discountNodes.nodes || []",query) 
            )
        )
    
    
    return render(request,"home/discounts_list.html",{"discounts":discounts})

@shop_login_required
def create_discount(request):
    return render(request,"home/discounts.html",{})

def show_discounts(request):
    ret = Discounts().listAppDiscounts()
    return render(request,"home/discounts.html",{"discount_id":id})

@shop_login_required
def edit_discount(request,id):
    return render(request,"home/discounts.html",{"discount_id":id})

@shop_login_required
def update_discount(request,id):
    data = json.loads(request.body.decode("utf-8"))
    ret = Discounts().updateDiscount(id,{
        "title":data.get("title"),
        "functionId":data.get("functionId"),
        "startsAt":data.get("startsAt"),
        "endsAt":data.get("endsAt"),
        "combinesWith":{
            "productDiscounts":data.get("productDiscounts"),
            "orderDiscounts":data.get("orderDiscounts"),
            "shippingDiscounts":data.get("orderDiscounts"),
        }
    })
    if data.get("metafield"):
        metafield = data.get("metafield")
        metafield["ownerId"]=f"gid://shopify/DiscountAutomaticNode/{id}"
        mfs = Metafields().set(data.get("metafield"))
        
        
    return HttpResponse(json.dumps(ret), content_type="application/json")

@shop_login_required
def publish_discount(request):
    data = json.loads(request.body.decode("utf-8"))
    
    ret = Discounts().createAppDiscount(
        {
            "input":{
                "title":data.get("title"),
                "functionId":data.get("functionId"),
                "startsAt":data.get("startsAt"),
                "endsAt":data.get("endsAt"),
                "metafields":[data.get("metafield")],
                "combinesWith":{
                    "productDiscounts":data.get("productDiscounts"),
                    "orderDiscounts":data.get("orderDiscounts"),
                    "shippingDiscounts":data.get("orderDiscounts"),
                }
            }
        }
    )
    logger.error(json.dumps(ret,indent=1))
    return json_response(ret)
    
@shop_login_required
def retrieve_discount(request,id): 
    ret = Discounts().getDiscountFunction(id)
    return json_response(ret)
@shop_login_required

@shop_login_required
def list_discounts(request):
    ret = Discounts().listAppDiscounts()
    return json_response(ret)

def delete_discount(request,id):
    
    ret = Discounts().deleteAppDiscount(id)
    return json_response(ret)


############## Cart Transform Functions

@shop_login_required
def transforms_list(request):
    query = CartTransforms().list()
    functions = {x["id"]:x["title"] for x in filter(lambda y:y["apiType"]=="cart_transform",jsearch("data.shopifyFunctions.nodes",Functions().list()))}
    transforms = []
    if jsearch("data.cartTransforms.nodes",query):
        
        transforms = list(
            map(
                lambda x:{"id":gid2id(x["id"]),"functionId":x["functionId"],"title":functions.get(x["functionId"],"No Title")},jsearch("data.cartTransforms.nodes || []",query)
            )
        )
    return render(request,"home/transforms_list.html",{"transforms":transforms})

@shop_login_required
def create_transform(request):
    return render(request,"home/transforms.html",{})

@shop_login_required
def edit_transform(request,id):
    return render(request,"home/transforms.html",{"id":id})

@shop_login_required
def update_transform(request,id):
    data = json.loads(request.body.decode("utf-8"))
    if data.get("metafield"):
        metafield = data.get("metafield")
        metafield["ownerId"]=f"gid://shopify/CartTransform/{id}"
        mfs = Metafields().set(data.get("metafield"))
        
    return HttpResponse(json.dumps({}), content_type="application/json")

@shop_login_required
def publish_transform(request):
    data = json.loads(request.body.decode("utf-8"))
    
    ret = CartTransforms().create(data.get("functionId"))
    logger.error(json.dumps(ret,indent=2))
    if data.get("metafield"):
        
        metafield = data.get("metafield")
        metafield["ownerId"]=jsearch("data.cartTransformCreate.cartTransform.id",ret)
        
        mfs = Metafields().set(metafield)
        logger.error(json.dumps(mfs,indent=2))
        
    return json_response(ret)
    
@shop_login_required
def retrieve_transform(request,id): 
    ret = CartTransforms().get(id)
    return json_response(ret)

@shop_login_required
def list_transforms(request):
    ret = CartTransforms().list()
    return json_response(ret)

def delete_transform(request,id):
    
    ret = CartTransforms().delete(id)
    return json_response(ret)

######### Webhooks

@csrf_exempt
def default_webhook(request):
     data = json.loads(request.body.decode("utf-8"))
     logger.error(json.dumps(data))
     return json_response({"message":"received"})

@shop_login_required
def webhook_list(request):
    query = Webhooks().list()
    webhooks = []
    if jsearch("data.webhookSubscriptions.nodes",query):
        
        webhooks = list(
            map(
                lambda x:{"id":gid2id(x["id"]),"title":x["topic"]},jsearch("data.webhookSubscriptions.nodes || []",query) 
            )
        )
    
    
    return render(request,"home/webhooks_list.html",{"webhooks":webhooks})

@shop_login_required
def create_webhook(request):
    return render(request,"home/webhooks.html",{})

@shop_login_required
def edit_webhook(request,id):
    return render(request,"home/webhooks.html",{"id":id,"app_url":os.environ.get('APP_URL')})

@shop_login_required
def update_webhook(request,id):
    data = json.loads(request.body.decode("utf-8"))
    ret = Webhooks().update(id,f"{os.environ.get('APP_URL')}{data.get('url')}")    
        
    return HttpResponse(json.dumps(ret), content_type="application/json")

@shop_login_required
def publish_webhook(request):
    data = json.loads(request.body.decode("utf-8"))
    ret = Webhooks().create(data.get("topic"),f"{os.environ.get('APP_URL')}{data.get('url')}")
    
    return json_response(ret)
    
@shop_login_required
def retrieve_webhook(request,id): 
    ret = Webhooks().get(id)
    return json_response(ret)
@shop_login_required

@shop_login_required
def list_webhooks(request):
    ret = Webhooks().list()
    return json_response(ret)

def delete_webhook(request,id):
    
    ret = Webhooks().delete(id)
    return json_response(ret)