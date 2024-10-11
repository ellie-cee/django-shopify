from django.urls import path

from . import views
from . import cnr_urls

urlpatterns = [
    path('webhooks/reinstall',views.reinstall,name="webhooks_orders"),
]+cnr_urls.urlpatterns
