from django.db import models
import django.utils.timezone
import datetime


        
class ShopifySite(models.Model):
    
    id = models.BigAutoField(primary_key=True)
    shopify_site = models.CharField(max_length=64, blank=True, null=True)
    access_token = models.CharField(max_length=64, blank=True, null=True)
    friendly_name = models.CharField(max_length=64, blank=True, null=True)
    parent_site = models.PositiveBigIntegerField(null=True)
    

    def __str__(self):
        return self.shopify_site
    
class ShopifyWebhook(models.Model):
    id = models.BigAutoField(primary_key=True)
    webhook_id = models.CharField(max_length=64, blank=True, null=False)
    webhook_status = models.CharField(max_length=64, blank=True, null=True)
    
    webhook_payload = models.TextField(blank=True,null=True,default="")
    trigger_date = models.DateTimeField(null=True,default=django.utils.timezone.now())
    def __str__(self):
        return self.webhook_id