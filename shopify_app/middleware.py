import os
from django.apps import apps
from django.urls import reverse
import shopify

class ConfigurationError(BaseException):
    pass

class LoginProtection(object):
    def __init__(self, get_response):
        self.get_response = get_response
        self.api_key = apps.get_app_config('shopify_app').SHOPIFY_API_KEY
        self.api_secret = apps.get_app_config('shopify_app').SHOPIFY_API_SECRET
        if not self.api_key or not self.api_secret:
            if not os.getenv("SHOPIFY_KEY"):
                raise ConfigurationError("SHOPIFY_API_KEY and SHOPIFY_API_SECRET must be set in ShopifyAppConfig")
            else:
                self.api_key = os.getenv("SHOPIFY_KEY")
                self.api_secret = os.getenv("SHOPIFY_SECRET")
                
            #raise ConfigurationError("SHOPIFY_API_KEY and SHOPIFY_API_SECRET must be set in ShopifyAppConfig")
        shopify.Session.setup(api_key=self.api_key, secret=self.api_secret)

    def __call__(self, request):
        if hasattr(request, 'session') and 'shopify' in request.session:
            api_version = apps.get_app_config('shopify_app').SHOPIFY_API_VERSION
            shop_url = request.session['shopify']['shop_url']
            shopify_session = shopify.Session(shop_url, api_version)
            shopify_session.token = request.session['shopify']['access_token']
            shopify.ShopifyResource.activate_session(shopify_session)
        elif os.getenv("SHOPIFY_TOKEN"):
            shopify_session = shopify.Session(os.getenv("SHOPIFY_DOMAIN"), os.getenv("SHOPIFY_API_VERSION"))
            shopify_session.token = os.getenv("SHOPIFY_TOKEN")
            shopify.ShopifyResource.activate_session(shopify_session)
            
        response = self.get_response(request)
        shopify.ShopifyResource.clear_session()
        return response

class ShopifyEmbed:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Content-Security-Policy'] = f"frame-ancestors https://{os.environ.get('SHOPIFY_DOMAIN')} https://admin.shopify.com;"
        return response