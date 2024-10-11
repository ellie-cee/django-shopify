import requests
import shopify
import json
import os
import logging
from jmespath import search as jsearch

logger = logging.getLogger(__name__)
class GraphQL:
    def __init__(self):
        pass
        
    def run(self,query,variables={}):
        return json.loads(shopify.GraphQL().execute(query,variables))
    
class Functions(GraphQL):
    def list(self):
        return self.run(
        """
        query {
            shopifyFunctions(first: 25) {
                nodes {
                    app {
                        title
                    }
                    apiType
                    title
                    id
                }
            }
        }
        """)
    def find(self,type):
        types = type.split(",")
        return {
            "data":{
                "shopifyFunctions":{
                    "nodes":list(filter(lambda x: x.get("apiType") in types,jsearch("data.shopifyFunctions.nodes",self.list())))
                }
            }
        }
class Discounts(GraphQL):
    def listFunctions(self):
        ret = self.run(
            """
            query {
                appDiscountTypes {
                    targetType
                    functionId
                    title
                    appKey
                }
            }
            """
        )
        logger.error(json.dumps(ret,indent=2))
        
        ret["data"]["addDiscountTypes"] = list(
            filter(
                lambda x: x["appKey"]==os.environ.get("SHOPIFY_API_KEY"),
                ret["data"]["appDiscountTypes"]
            )
        )
        logger.error(ret)
        return ret
    def listAppDiscounts(self):
        return self.run(
            """
            query {
                discountNodes(first:250,query:"type:app") {
                    nodes {
                        
                        id
                        discount {
                            ... on DiscountAutomaticApp {
                                title
                                appDiscountType {
                                    title
                                    functionId
                                    appKey
                                }
                            }
                        }
                        metafield(namespace:"esc",key:"config") {
                            value
                        }  
                    }
                }
            }    
            """
        )
        
    def createAppDiscount(self,input):
        return self.run("""
        mutation discountAutomaticAppCreate($input: DiscountAutomaticAppInput!) {
            discountAutomaticAppCreate(automaticAppDiscount: $input) {
                userErrors {
                    field
                    message
                }
                automaticAppDiscount {
                    discountId
                    title
                    startsAt
                    endsAt
                    status
                    appDiscountType {
                        appKey
                        functionId
                    }
                    combinesWith {
                        orderDiscounts
                        productDiscounts
                        shippingDiscounts
                    }
                }
            }
        }""",
        input)
        
    def updateDiscount(self,id,payload):
        return self.run(
            """
            mutation discountAutomaticAppUpdate($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!) {
                discountAutomaticAppUpdate(automaticAppDiscount: $automaticAppDiscount, id: $id) {
                    automaticAppDiscount {
                        discountId
                        title
                        startsAt
                        endsAt
                        status
                        appDiscountType {
                            appKey
                            functionId
                        }
                        combinesWith {
                            orderDiscounts
                            productDiscounts
                            shippingDiscounts
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
            """,
            {
                "id":f"gid://shopify/DiscountAutomaticNode/{id}",
                "automaticAppDiscount":payload,
            }
        )
    def getDiscountFunction(self,id):
        return self.run("""
        query getDiscountNode($id:ID!) {
            discountNode(id:$id) {
                id
                discount {
                    ... on DiscountAutomaticApp {
                        title
                        startsAt
                        endsAt
                        appDiscountType {
                            title
                            functionId  
                        }
                        combinesWith {
                           orderDiscounts
                            productDiscounts
                            shippingDiscounts
                        }                                
                    }
                }
                metafield(namespace:"esc",key:"config") {
                    value
                }  
            }
        }
        """,
        {"id":f"gid://shopify/DiscountAutomaticNode/{id}"}
    )
    def deleteAppDiscount(self,id):
        return self.run("""
        mutation discountAutomaticDelete($id: ID!) {
            discountAutomaticDelete(id: $id) {
                deletedAutomaticDiscountId
                userErrors {
                    field
                    code
                    message
                }
            }
        }                
        """,
        {
            "id":f"gid://shopify/DiscountAutomaticNode/{id}"
        })
    def preview(self,request):
        payload = {}
        
class Products(GraphQL):
    def getByHandle(self,handle):
        data = self.run("""
            query getProductIdFromHandle($handle: String!) {
                productByHandle(handle: $handle) {
                id
            }
        }
        """,
        {"handle":handle}
        )
        return self.get(data.get("productByHandle",{}).get("id"))
    def get(self,id):
        return self.run(
        """
            query getProduct ($id:ID!) {
             product(id: "gid://shopify/Product/108828309") {
                title
                description
                onlineStoreUrl
            }
        }""",
        {
            "id":id
        }
        )
    def metafield(self,id,namespace,key):
        data =self.run("""
            query getProduct($id: ID!,$namespace:String,$key:String) {
                product(id:$id) {
                    id
                    title
                    handle
                    productType
                    metafield(namespace:$namespace,key:$key) {
                        value
                    }
                }
            }
        """,
        {
            "id":f"gid://shopify/Product/{id}",
            "namespace":namespace,
            "key":key
        })
        return data
class Metafields(GraphQL):
    def set(self,metafield):
        return self.run("""
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
                metafields {
                    key
                    namespace
                    value
                    createdAt
                    updatedAt
                }
                userErrors {
                    field
                    message
                    code
                }
            }
        }""",
        {
            "metafields":[
               metafield
            ]
        })
class Inventory(GraphQL):
    def inventory_level(self,id):
        return self.run(
        """
        query getInventoryLevel($id:ID!) {
            inventoryLevel(id: $id) {
                id
                quantities(names: ["available", "incoming", "committed", "damaged", "on_hand", "quality_control", "reserved", "safety_stock"]) {
                    name
                    quantity
                }
                item {
                    id
                    sku
                    inventoryHistoryUrl
                    variant {
                        id
                        product {
                            id
                            title
                            sellingPlanGroupCount {
                                count
                            }
                        }
                    }
                }
                location {
                    id
                    name
                }
            }
        }
        """,
            {
                "id":id,
            }
        )
class Customers(GraphQL):
    def setTaxFree(self,id):
        return self.run(
            """
        mutation customerUpdate($input: CustomerInput!) {
            customerUpdate(input: $input) {
                userErrors {
                    field
                    message
                }
                customer {
                    id
                    email
                    firstName
                    lastName
                    taxExempt
                }
            }
        }
        """,
        {
            "input":{
                "id":id,
                "taxExempt":True
            }
        })
    def companyFromCustomer(self,id):
        return json.loads(shopify.GraphQL().execute(
        """
        query customer($id:ID!) {
            customer(id:$id) {
                companyContactProfiles {
                        company {
                            id
                            externalId
                            contactCount {
                                count
                            }
                            locationCount {
                                count
                            }
                            locations(first:20) {
                                nodes {
                                    id
                                    shippingAddress {
                                        province
                                        zoneCode
                                    }
                                    taxExemptions    
                                }  
                            }
                        }    
                    
                }       
            }
        }
        """,
        {"id":id}
))
class Company(GraphQL):
    tax_exemptions = ["CA_BC_COMMERCIAL_FISHERY_EXEMPTION","CA_BC_CONTRACTOR_EXEMPTION","CA_BC_PRODUCTION_AND_MACHINERY_EXEMPTION","CA_BC_RESELLER_EXEMPTION","CA_BC_SUB_CONTRACTOR_EXEMPTION","CA_DIPLOMAT_EXEMPTION","CA_MB_COMMERCIAL_FISHERY_EXEMPTION","CA_MB_FARMER_EXEMPTION","CA_MB_RESELLER_EXEMPTION","CA_NS_COMMERCIAL_FISHERY_EXEMPTION","CA_NS_FARMER_EXEMPTION","CA_ON_PURCHASE_EXEMPTION","CA_PE_COMMERCIAL_FISHERY_EXEMPTION","CA_SK_COMMERCIAL_FISHERY_EXEMPTION","CA_SK_CONTRACTOR_EXEMPTION","CA_SK_FARMER_EXEMPTION","CA_SK_PRODUCTION_AND_MACHINERY_EXEMPTION","CA_SK_RESELLER_EXEMPTION","CA_SK_SUB_CONTRACTOR_EXEMPTION","CA_STATUS_CARD_EXEMPTION","EU_REVERSE_CHARGE_EXEMPTION_RULE","US_AK_RESELLER_EXEMPTION","US_AL_RESELLER_EXEMPTION","US_AR_RESELLER_EXEMPTION","US_AZ_RESELLER_EXEMPTION","US_CA_RESELLER_EXEMPTION","US_CO_RESELLER_EXEMPTION","US_CT_RESELLER_EXEMPTION","US_DC_RESELLER_EXEMPTION","US_DE_RESELLER_EXEMPTION","US_FL_RESELLER_EXEMPTION","US_GA_RESELLER_EXEMPTION","US_HI_RESELLER_EXEMPTION","US_IA_RESELLER_EXEMPTION","US_ID_RESELLER_EXEMPTION","US_IL_RESELLER_EXEMPTION","US_IN_RESELLER_EXEMPTION","US_KS_RESELLER_EXEMPTION","US_KY_RESELLER_EXEMPTION","US_LA_RESELLER_EXEMPTION","US_MA_RESELLER_EXEMPTION","US_MD_RESELLER_EXEMPTION","US_ME_RESELLER_EXEMPTION","US_MI_RESELLER_EXEMPTION","US_MN_RESELLER_EXEMPTION","US_MO_RESELLER_EXEMPTION","US_MS_RESELLER_EXEMPTION","US_MT_RESELLER_EXEMPTION","US_NC_RESELLER_EXEMPTION","US_ND_RESELLER_EXEMPTION","US_NE_RESELLER_EXEMPTION","US_NH_RESELLER_EXEMPTION","US_NJ_RESELLER_EXEMPTION","US_NM_RESELLER_EXEMPTION","US_NV_RESELLER_EXEMPTION","US_NY_RESELLER_EXEMPTION","US_OH_RESELLER_EXEMPTION","US_OK_RESELLER_EXEMPTION","US_OR_RESELLER_EXEMPTION","US_PA_RESELLER_EXEMPTION","US_RI_RESELLER_EXEMPTION","US_SC_RESELLER_EXEMPTION","US_SD_RESELLER_EXEMPTION","US_TN_RESELLER_EXEMPTION","US_TX_RESELLER_EXEMPTION","US_UT_RESELLER_EXEMPTION","US_VA_RESELLER_EXEMPTION","US_VT_RESELLER_EXEMPTION","US_WA_RESELLER_EXEMPTION","US_WI_RESELLER_EXEMPTION","US_WV_RESELLER_EXEMPTION","US_WY_RESELLER_EXEMPTION"]
    def setLocationTaxExemptions(self,location):
        if location["shippingAddress"] is not None:
            if len(location["taxExemptions"])<1:
                location_exemptions = list(filter(lambda c: f"_{location['shippingAddress']['zoneCode']}_" in c,self.tax_exemptions))
                if len(location_exemptions)>0:
                    logger.error(f"Updating Tax exemptions for {location['id']}")
                    ret = self.run(
                    """
                        mutation companyLocationAssignTaxExemptions($companyLocationId: ID!, $taxExemptions: [TaxExemption!]!) {
                            companyLocationAssignTaxExemptions(companyLocationId: $companyLocationId, taxExemptions: $taxExemptions) {
                                companyLocation {
                                    # CompanyLocation fields
                                    id
                                    shippingAddress {
                                        zoneCode
                                    }
                                    taxExemptions
                                }
                                userErrors {
                                    field
                                    message
                                }
                            }
                        }
                        """,
                        {
                            "companyLocationId": location["id"],
                            "taxExemptions":location_exemptions
                        }
                    )
            
class CartTransforms(GraphQL):
    def list(self):
        return self.run(
            """
            query {
                cartTransforms(first:250) {
                    nodes {
                        functionId
                        id
                        blockOnFailure
                        metafield(key:"config",namespace:"esc") {
                            value
                        }    
                    }
                }
            }
            """
        )
    def get(self,id):
        try:
            return list(
                filter(
                    lambda x:x["id"]==f"gid://shopify/CartTransform/{id}",
                    self.list()["data"]["cartTransforms"]["nodes"]
                )
            )[-1]
        except:
            return {}
    def create(self,function,block=False):
        return self.run(
            """
                mutation cartTransformCreate($functionId: String!,$block:Boolean) {
                    cartTransformCreate(functionId: $functionId,blockOnFailure:$block) {
                        cartTransform {
                            functionId
                            id
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            """,
            {"functionId":function,"block":block}
        )
    def delete(self,id):
        return self.run(
            """
            mutation cartTransformDelete($id: ID!) {
                cartTransformDelete(id: $id) {
                    deletedId
                    userErrors {
                        field
                        message
                    }
                }
            }
            """,
            {"id":f"gid://shopify/CartTransform/{id}"}
        )
class Webhooks(GraphQL):
    def list(self):
        return self.run(
            """
            query {
              webhookSubscriptions(first: 250) {
                nodes {
                    id
                    topic
                    endpoint {
                        __typename
                        ... on WebhookHttpEndpoint {
                            callbackUrl
                        }
                    }
                }
            }
        }
            """
        )
    def get(self,id):
        return self.run(
            """
            query getWebhook($id:ID!) {
                webhookSubscription(id: $id) {
                    id
                    topic
                    endpoint {
                        __typename
                        ... on WebhookHttpEndpoint {
                            callbackUrl
                        }
                    }
                }
            }
            """,
            {"id":f"gid://shopify/WebhookSubscription/{id}"}
        )
    def create(self,topic,url):
        return self.run(
            """
                mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
                    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
                        webhookSubscription {
                            id
                            topic
                            format
                            endpoint {
                                __typename
                                ... on WebhookHttpEndpoint {
                                    callbackUrl
                                }
                            }
                        }
                    }
                }
            """,
            {
                "topic":topic,
                "webhookSubscription": {
                    "callbackUrl": url,
                    "format": "JSON"
                }
            }
        )
    def update(self,id,url):
        return self.run(
            """
                mutation webhookSubscriptionUpdate($id: ID!, $webhookSubscription: WebhookSubscriptionInput!) {
                    webhookSubscriptionUpdate(id: $id, webhookSubscription: $webhookSubscription) {
                        userErrors {
                            field
                            message
                        }
                        webhookSubscription {
                            id
                            topic
                            endpoint {
                                ... on WebhookHttpEndpoint {
                                    callbackUrl
                                }
                            }
                        }
                    }
                }
            """,
            {
                "id": f"gid://shopify/WebhookSubscription/{id}",
                "webhookSubscription": {
                    "callbackUrl": url
                }
            }   
        )
    def delete(self,id):
        return self.run(
            """
            mutation webhookSubscriptionDelete($id: ID!) {
                webhookSubscriptionDelete(id: $id) {
                    userErrors {
                      field
                      message
                    }
                    deletedWebhookSubscriptionId
                }
            }
            """,
            {"id":f"gid://shopify/WebhookSubscription/{id}"}
        )
class Application(GraphQL):
    def scopes(self):
        return self.run(
            """
            query {
                currentAppInstallation {
                    accessScopes {
                        description
                        handle
                    }
                    app {
                        availableAccessScopes {
                            handle
                        }
                    }
                }
            }
            """
        )
class Orders(GraphQL):
    def orderEditBegin(self,id):
        return self.run(
            """
                mutation orderEditBegin($id: ID!) {
                    orderEditBegin(id: $id) {
                        calculatedOrder {
                            id
                        }
                        userErrors {
                        field
                        message
                        }
                    }
                }
            """,
            {"id":id}
        )
    def orderEditClose(self,id):
        return self.run(
            """
            mutation orderEditCommit($id: ID!,$staffNote:String) {
                orderEditCommit(id: $id,staffNote:$staffNote) {
                    order {
                        id
                        currentSubtotalPriceSet {
                            presentmentMoney {
                                amount
                            }
                            shopMoney {
                                amount
                            }
                        }
                        
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
            """,
            {
                "id":id,
                "notifyCustomer": False,
                "staffNote": "Added Bundle Items"
            }
        )
    def orderEditAdd(self,id,variant,quantity):
        return self.run(
            """
            mutation orderEditAddVariant($id: ID!, $quantity: Int!, $variantId: ID!) {
                orderEditAddVariant(id: $id, quantity: $quantity, variantId: $variantId) {
                    calculatedLineItem {
                        id
                    }
                    userErrors {
                    field
                    message
                    }
                }
            }
            """,
            {
                "allowDuplicates": True,
                "id": id,
                "quantity": quantity,
                "variantId": f"gid://shopify/ProductVariant/{variant}"
            }
            
        )
        
    def orderItemDiscount(self,id,line_item,description="Bundle Discount"):
        return self.run(
            """
            mutation orderEditAddLineItemDiscount($discount: OrderEditAppliedDiscountInput!, $id: ID!, $lineItemId: ID!) {
                orderEditAddLineItemDiscount(discount: $discount, id: $id, lineItemId: $lineItemId) {
                    addedDiscountStagedChange {
                        id
                    }
                    calculatedLineItem {
                        id
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }""",
            {
                "discount": {
                    "description": description,
                    "percentValue": 100
                },
                "id": id,
                "lineItemId": line_item
            }
        )
    def addNote(self,payload,note):
        return requests.put(
            f"https://{os.getenv('SHOPIFY_SITE')}.myshopify.com/admin/api/2024-04/orders/{payload.get('id')}.json",
            json={"order":{"id":payload.get(id),"note":f"{payload.get('note','')}\n{note}"}},
            headers={
                "Content-type":"application/json",
                "X-Shopify-Access-Token":os.getenv("SHOPIFY_TOKEN")
            }
        ).json()
