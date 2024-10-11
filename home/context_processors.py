import os 

def share_env(request):
    return {"env":dict(os.environ)}

def navigation(request):
    
    return {"nav":[
        {"label":"Home","path":"/"},
        {"label":"Discounts","path":"/discounts","children":[{"label":"Create Discount","path":"/discounts/create"}]},
        {"label":"Cart Transforms","path":"/cartTransforms","children":[{"label":"Create Cart Transform","path":"/cartTransforms/create"}]},
        {"label":"Webhooks","path":"/webhooks","children":[{"label":"Create Webhook","path":"/webhooks/create"}]}
        
    ]}