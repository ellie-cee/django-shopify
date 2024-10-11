from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='root_path'),
    path('testbed',views.testbed,name="test page"),
    path('webhooks/reinstall',views.reinstall,name="webhooks_orders"),
    path('webhooks/default',views.default_webhook,name="webhook default endpoint"),
    path('install',views.install,name="install_path"),
    path('api/functions/list',views.all_functions,name="list_functions"),
    path('discounts',views.discount_list,name="list_active+_discounts"),
    path("discounts/create",views.create_discount,name="create_discount"),
    path("discounts/edit/<str:id>",views.edit_discount,name="edit_discount"),
    path("api/discounts/new",views.publish_discount,name="publish_discount"),
    path("api/discounts/delete/<str:id>",views.delete_discount,name="delete_discount"),
    path("api/discounts/update/<str:id>",views.update_discount,name="update_discount"),
    path("api/discounts/list",views.list_discounts,name="list_discounts"),
    path("api/discounts/get/<str:id>",views.retrieve_discount,name="retireve_discount"),
    path('cartTransforms',views.transforms_list    ,name="list_active+_discounts"),
    path("cartTransforms/create",views.create_transform,name="create_discount"),
    path("cartTransforms/edit/<str:id>",views.edit_transform,name="edit_discount"),
    path("api/cartTransforms/new",views.publish_transform,name="publish_discount"),
    path("api/cartTransforms/delete/<str:id>",views.delete_transform,name="delete_discount"),
    path("api/cartTransforms/update/<str:id>",views.update_transform,name="update_discount"),
    path("api/cartTransforms/get/<str:id>",views.retrieve_transform,name="retireve_discount"),
    path("api/functions/list/<str:type>",views.list_functions,name="list_functions"),
    path("api/functions/all",views.all_functions,name="list_functions"),
    path('webhooks',views.webhook_list,name="list_activewebhooks"),
    path("webhooks/create",views.create_webhook,name="create_discount"),
    path("webhooks/edit/<str:id>",views.edit_webhook,name="edit_discount"),
    path("api/webhooks/new",views.publish_webhook,name="publish_discount"),
    path("api/webhooks/list",views.list_webhooks,name="publish_discount"),
    path("api/webhooks/delete/<str:id>",views.delete_webhook,name="delete_discount"),
    path("api/webhooks/update/<str:id>",views.update_webhook,name="update_discount"),
    path("api/webhooks/get/<str:id>",views.retrieve_webhook,name="retireve_discount"),
    path("api/scopes/list",views.list_scopes,name="list_scopes"),
    path("api/dumper",views.dumper,name="dump")
    
]