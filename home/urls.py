from django.urls import path

from . import views
from . import esc

urlpatterns = [
    path('webhooks/reinstall',views.reinstall,name="webhooks_orders"),
]+esc.urls.urlpatterns
