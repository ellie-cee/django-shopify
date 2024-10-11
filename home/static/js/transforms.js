class TransformsCRUD extends FunctionAwareCRUD {
    constructor(options) {
        super(options)
    }
    function_type() {
        return "cart_transform";
    }
    objectFromQuery(q) {
        this.config.selectedFunction = q.functionId

        return q
    }
    defaultObject() {
        return  {
            "id": null,
            "functionId":"",
            "blockOnFailure":false,
            "metafield": {
              "value": JSON.stringify(
                    {
                        "enabled":false,
                        "productId":"gid://shopify/CartTransform/1"
                    }
                )
            }
        }
    }
    id() {
        return this.object.id;
    }
    headerTitle() {
        if (!this.id()) {
            return `Create Cart Transform`;
        } else {
            return `Update Cart Transform`;
        }
    }
    processObject(raw) {
        return q.data.cartTransformCreate.cartTransform;
    }
    urls(action) {
        return {
            "functions":"/api/functions/list",
            "load":`/api/cartTransforms/get/${this.config.id}`,
            "create":"/api/cartTransforms/new",
            "update":`/api/cartTransforms/update/${this.config.id}`,
            "delete":`/api/cartTransforms/delete/${this.config.id}`
        }[action];
     }
     processReturn(action,data) {
        
        let message_text = {
                "create":"Transform Created",
                "update":`Transform Updated`,
            }[action];
        if (message_text) {
            CnRModal.show(`
                <h1>Success!</h1>
                <ul><li>${message_text}</li></ul>
            `)
        }
        switch(action) {
            case "delete":
                location.href="/cartTransforms";
                break;
            case "create":
                let details = data.cartTransformCreate;
                if (this.hasUserErrors(data,"cartTransformCreate")) {
                    return this.showUserErrors(data,"cartTransformCreate");
                }
                console.error(details)
                
                this.object.id = this.gid2id(details.cartTransform.id)
                this.config.id = this.object.id;
                if (data.metafield) {
                    this.object.metafield.value = data.metafield.value
                }
                this.render()

        }
     }
     payload() {
        super.payload()
        let payload = {
            "id":this.formData.get("id"),
            "functionId":this.formData.get("functionId"),
            "metafield":this.formData.get("metafield") && this.formData.get("metafield")!=""?{
                "namespace":"cnr",
                "key":"config",
                "type":"json",
                "value":this.formData.get("metafield")
            }:null,
        }
       
        
        return payload;
     }
    
    
     innerHTML() {
        return ``
     }
     currentFunctionId() {
        return this.object.functionId;
     }
}  
