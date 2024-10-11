    class DiscountsCRUD extends FunctionAwareCRUD {
        constructor(options) {
            super(options)
        }
        function_type() {
            return "product_discounts,shipping_discounts,order_discounts";
        }
        objectFromQuery(q) {
            this.config.selectedFunction = q.data.discountNode.discount.appDiscountType.functionId
            return q.data.discountNode;
        }
        
        defaultObject() {
            return  {
                "id": null,
            
                "discount": {
                "title": "New Discount",
                "startsAt":"",
                "endsAt":"",
                "appDiscountType": {
                    "title": "",
                    "functionId": ""
                },
                "combinesWith":{
                    "orderDiscounts":false,
                    "productDiscounts":false,
                    "shippingDiscounts":false,
                }
                },
                
                "metafield": {
                "value": JSON.stringify({"discount":"10.0","message":"Special Discount"})
                }
            }
        }
        id() {
            return this.object.id;
        }
        headerTitle() {
            if (!this.id()) {
                return `Create ${this.object.discount.title}`;
            } else {
                return `Update ${this.object.discount.title}`;
            }
        }
        processObject(raw) {
            return q.data.discountAutomaticAppCreate;
        }
        urls(action) {
            return {
                "functions":"/api/functions/list",
                "load":`/api/discounts/get/${this.config.id}`,
                "create":"/api/discounts/new",
                "update":`/api/discounts/update/${this.config.id}`,
                "delete":`/api/discounts/delete/${this.config.id}`
            }[action];
        }
        processReturn(action,data) {
            
            let message_text = {
                    "create":"Discount Created",
                    "update":`Discount Updated`,
                }[action];
            if (message_text) {
                CnRModal.show(`
                    <h1>Success!</h1>
                    <ul><li>${message_text}</li></ul>
                `)
            }
            switch(action) {
                case "delete":
                    location.href="/discounts";
                    break;
                case "create":
                    if (this.hasUserErrors(data,"discountAutomaticAppCreate")) {
                        return this.showUserErrors(data,"discountAutomaticAppCreate");
                    }
                    
                    let details = data.discountAutomaticAppCreate.automaticAppDiscount;
                    
                    this.object.id = this.gid2id(details.discountId)
                    this.config.id = this.object.id;
                    this.object.discount.combinesWith = details.combinesWith;
                    this.object.discount.startsAt = details.startsAt;
                    this.object.discount.endsAt = details.endsAt;
                    this.object.metafield.value = this.formData.get("metafield")
                    
                    this.render()

            }
        }
        payload() {
            super.payload()
            let payload = {
                "id":this.formData.get("id"),
                "title":this.formData.get("title"),
                "functionId":this.formData.get("functionId"),
                "startsAt":this.formData.get("startsAt"),
                "endsAt":this.formData.get("endsAt")||null,
                "metafield":this.formData.get("json")!=""?{
                    "namespace":"cnr",
                    "key":"config",
                    "type":"json",
                    "value":this.formData.get("metafield")
                }:null,
                "orderDiscounts":this.formData.get("orderDiscounts"),
                "productDiscounts":this.formData.get("productDiscounts"),
                "shippingDiscounts":this.formData.get("shippingDiscounts"),
            }
            if (this.config.debug) {
                console.error(payload)
            }
            return payload;
        }
        
        
        innerHTML() {
            return `
                    <div class="form-row">
                        <div class="title">Discount Title</div>
                        <div class="spacer"></div>
                        <div class="fields"><input type="text" name="title" required value="${this.object.discount.title}"/></div>
                    </div>
                    <div class="form-row">
                        <div     class="title">Starts At</div>
                        <div class="spacer"></div>
                        <div class="fields">
                            <input type="datetime-local" name="startsAt" required data-error-message="Start Date is Required" value="${(this.object.discount.startsAt||"").replace("Z","")}"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="title">Ends At</div>
                        <div class="spacer"></div>
                        <div class="fields">
                            <input type="datetime-local" name="endsAt" value="${(this.object.discount.endsAt||"").replace("Z","")}"/>
                        </div>
                    </div>
                    <div class="form-row ">
                        <div class="title">Combines With</div>
                        <div class="spacer"></div>
                        <div class="fields">
                            <div>
                                <label for="orderDiscountsField">Order discounts</label>
                                <input type="checkbox" id="orderDiscountsField" name="orderDiscounts" value="true" ${this.object.discount.combinesWith.orderDiscounts?'checked':''}>
                            </div>
                            <div>
                                <label for="productDiscountsField">Product discounts</label>
                                <input type="checkbox" id="productDiscountsField" name="productDiscounts" value="true" ${this.object.discount.combinesWith.productDiscounts?'checked':''}>
                            </div>
                            <div>
                                <label for="shippingDiscountsField">Shipping discounts</label>
                                <input type="checkbox" id="shippingDiscountsField" name="shippingDiscounts" value="true" ${this.object.discount.combinesWith.shippingDiscounts?'checked':''}>
                            </div>
                        </div>
                    </div>
            `
        }
        currentFunctionId() {
            return this.object.discount.appDiscountType.functionId;
        }
    }  
