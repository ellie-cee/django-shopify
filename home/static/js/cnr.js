class CnR {
    defaults() {
        return {
            "debug":true,
            "injection_point":".cnr-app",
        };
    }
    constructor(options) {
        this.config = {...this.defaults(),...options}
    }
    async post(url,content) {
        return window.fetch(
            url,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body:JSON.stringify(content)
            }
        )
        .then(response=>response.json())
    }
    gid2id(gid) {
        return parseInt(gid.split("/").pop())
    }
}

class CnRModal extends CnR {
    static show(content,cls="standard") {
        let modal = document.querySelector(".cnr-modal");
        if (!modal) {
            modal = document.createElement("DIV");
            modal.classList.add("cnr-modal");
            document.querySelector("body").appendChild(modal);
        }
        modal.style.width = `${window.innerWidth}px`;
        modal.style.height = `${window.innerHeight}px`;
        modal.style.top = `${window.scrollY}px`
        modal.innerHTML = `
        <div class="modal-content ${cls}">
            <span class="close">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" role="presentation"><path d="M5.86123 14.1073L5.21766 14.1073L3.67204 12.5617L3.67204 11.9181L6.68057 8.90959L3.6521 5.88112L3.6521 5.23755L5.2376 3.65205L5.88117 3.65204L8.90964 6.68052L11.9182 3.67199L12.5617 3.67199L14.1074 5.21761L14.1074 5.86118L11.0988 8.86971L14.1273 11.8982L14.1273 12.5417L12.5418 14.1273H11.8982L8.86976 11.0988L5.86123 14.1073Z" fill="#af3939"></path></svg>
            </span>
            <div class="modal-text text-left color-foreword-primary body1">
                ${content}
            </div>
        </div>
        `;
        modal.querySelector(".close").addEventListener("click",event=>{
            modal.classList.remove("active");
            modal.innerHTML = "";
            document.querySelector("body").classList.remove("stop-scrolling");
        });
        modal.addEventListener("click",event=>{
          if (event.target.classList.contains("cnr-modal")) {
            modal.classList.remove("active");
            modal.style.top = "0px";
            modal.innerHTML = "";
            document.querySelector("body").classList.remove("stop-scrolling");
          }
        })
        document.querySelector("body").classList.add("stop-scrolling");
        modal.classList.add("active");
    }
    static close() {
      let modal = document.querySelector(".cnr-modal");
      modal.classList.remove("active");
      modal.innerHTML = "";
      document.querySelector("body").classList.remove("stop-scrolling");
    }
}


class BaseCRUD extends CnR {
    constructor(options) {
        super(options)
        
        this.metafield = null;
        this.root = document.querySelector(this.config.injection_point);
        this.form = this.root.querySelector("form");
    }
    defaultObject() {
        return {}
    }
    processObject(raw) {
        return raw.data;
    }
    currentFunctionId() {
        return this.config.selectedFunction;
    }
    
    payload() {
        this.formData = new EnhancedFormData(this.form);
        let metadata = {};
        let jsonFields = Array.from(this.form.querySelectorAll("[data-json-field]")).map(field=>field.name);
        
        this.formData.keys().forEach(key=>{
            if (jsonFields.includes(key)) {
            
                metadata[key] = this.formData.get(key);
            }
        })
        this.object.metafield = {"value":JSON.stringify(metadata)};
        this.formData.set("metafield",JSON.stringify(metadata));
    }
    load(id) {
        fetch(this.urls("load"))
            .then(response=>response.json())
            .then(q=>{
                if (this.config.debug) {
                    console.error(q);
                }
                this.object = this.objectFromQuery(q);
                this.render();
            });
     }
    
     urls(action) {
        return {
            "load":"/",
            "create":"/",
            "update":"/",
            "delete":"/"
        }[action];
     }
     processReturn(action,data) {
        
        
     }
     returnProcessed() {

     }
     enableForm() {
        this.form.querySelectorAll(".form-buttons button").forEach(button=>button.disabled=false)
     }
     disableForm() {
        this.form.querySelectorAll(".form-buttons button").forEach(button=>button.disabled=true)
     }

     updateable() { return true;}
     deleteable() { return true;}

     dispatch(action) {
        this.disableForm()
        let payload = this.payload()
        if (this.config.debug) {
            console.error(payload)
        }
        if (this.config.dontSend) {
            return;
        }
        if (payload==null) {
            return;
        }
        this.post(this.urls(action),payload).then(json=>{
  
            if (json.errors && json.errors.length>0) {
                return this.showErrorModal(json.errors.map(error=>error.message));
            }
            this.processReturn(action,json.data);
            this.enableForm()
        }).catch(error=>{
            console.error(error)
            CnRModal.show(`<h1>Error!</h1>
                <ul><li>${error.message}</li></ul>
            `)
            this.enableForm()
        })
     }
     hasUserErrors(data,queryRoot) {
        if ((data[queryRoot] && data[queryRoot].userErrors && data[queryRoot].userErrors.length>0) || (data.errors && data.errors.length>0)) {
            return true;
        }
        return false;
     }
     showUserErrors(data,queryRoot) {
        let messages = [];
        if (data[queryRoot].userErrors && data[queryRoot].userErrors.length>0) {
            data[queryRoot].userErrors.forEach(error=>{
                let field = '';
                if (error.fields.length>1) {
                    field = `${error.fields.pop()}: `;
                }
                messages.push(`${field}${error.message}`);
            })
        }
        return showErrorModal(messages);
    }
    showErrorModal(messages) {
        console.error(messages)
        if (messages.length>0) {
            CnRModal.show(`
                <h1>Errors!</h1>
                <ul>${messages.map(message=>`<li>${message}</li>`).join("")}</ul>
            `)
        }
        return;
     }
     innerHTML() {
        return ``
     }
     id() {
        return null;
     }
     setupEvents() {
        this.root.querySelector(".create-button").addEventListener("click",event=>{
            event.preventDefault();
            if (this.isValid()) {
                this.dispatch("create")
            }
            
        })
        this.root.querySelector(".update-button").addEventListener("click",event=>{
            event.preventDefault();
            if (this.isValid()) {
                this.dispatch("update")
            }
        })
        this.root.querySelector(".delete-button").addEventListener("click",event=>{
            event.preventDefault();
            if (this.isValid()) {
                this.dispatch("delete")
            }
        })
     }
     headerTitle() {
        return "Generic CRUD";
     }
     isValid() {
        let errors = [];
        let formFields = new EnhancedFormData(this.form);
        this.form.querySelectorAll("[required]").forEach(element=>{
            if (!formFields.get(element.name)) {
                element.classList.add("error");
                errors.push(element.dataset.errorMessage);
            } else {
                element.classList.remove("error");
            }
        })
        if (errors.length>0) {
            CnRModal.show(`
                
                <h1>Validation Errors!</h1>
                <ul>${errors.map(error=>`<li>${error}</li>`).join("")}</ul>
            `)
            return false;
        } else {
            return true;
        }
     }
     formPreamble() {
        return '';
     }
     formPostamble() { return ''};

     

     render() {
        this.root.innerHTML = `
        <h1>${this.headerTitle()}</h1>
        <form class="discounts-form ">
            <input type="hidden" name="id" value="${this.object.id}"/>
            <div class="form-holder ${this.id()?'has-id':''}">
                ${this.formPreamble()}
                ${this.innerHTML()}
                ${this.formPostamble()}
                <div class="form-buttons">
                    <button type="submit" class="create-button">Create </button>
                    <button type="submit" class="update-button">Update </button>
                    <button type="submit" class="delete-button">Delete </button>
                </div>
            </div>
        </form>
        `;
        this.form = this.root.querySelector("form")
        this.setupEvents()
        
     }
}
class GenericCRUD extends BaseCRUD {
    constructor(options) {
        super(options);
        if (this.config.id) {
            this.load(this.config.id)
        } else {
            this.object = this.defaultObject();
            this.render();
        }
    }
}
class FunctionAwareCRUD extends BaseCRUD {
    constructor(options) {
        super(options)
        this.load_functions()
    }
    load_functions() {
        fetch(`/api/functions/list/${this.function_type()}`)
            .then(response=>response.json()).then(q=>{
                let functions = []
                if (q.data.shopifyFunctions.nodes && q.data.shopifyFunctions.nodes.length>0) {
                    this.config.functions = q.data.shopifyFunctions.nodes;
                    if (this.config.functions.length>0) {
                        this.config.selectedFunction = this.config.functions[0].id;
                    }
                    
                } else {
                    CnRModal.show(`
                        <h1>Errors!</h1>
                        <ul>No Functions are available</ul>
                    `);
                    return;
                }
                if (this.config.id) {
                    this.load(this.config.id)
                } else {
                    this.object = this.defaultObject();
                    this.render();
                }
        });
    }
    function_type() {
        return 'product_discounts';
    }
    metafieldContent() {
        return JSON.parse(this.object.metafield?this.object.metafield.value:"{}");
     }
    functionConfig() {
        let conf = document.querySelector(`[data-function="${this.config.selectedFunction}"]`);
        if (conf) {
            
            return JSON.parse(conf.textContent);
        } else {
            return {fields:[]};
        }
    }
    setupEvents() {
        super.setupEvents();
        this.root.querySelector(".function-selector").addEventListener("change",event=>{
            this.config.selectedFunction = event.target.options[event.target.selectedIndex].value;
            this.render()
        });
    }
    formPreamble() {
        return this.functionRow()
    }
    formPostamble() {
        return new MetafieldConfig(this.functionConfig(),this.metafieldContent()).render()
    }
    functionRow() {
        return `<div class="form-row">
                    <div class="title">Function ID</div>
                    <div class="spacer"></div>
                    <div class="fields">
                        <select name="functionId" class="function-selector">
                        ${this.config.functions.map(func=>`
                            <option value="${func.id}"${this.currentFunctionId()==func.id?' selected':''}>${func.title}</option>
                        `).join('')}
                        </select>
                    </div>
                </div>`
     }
}
class EnhancedFormData extends FormData {
    get(key) {
        let val = super.get(key);
        switch(val) {
            case "undefined":
                return null;
                break;
            case "true":
                return true;
                break;
            case "false":
                return false;
                break;
            default:
                return val
        }
    }
}

class MetafieldConfig {
    constructor(config,data) {
        
        this.config = config;
        this.fields = this.config.fields.map(field=>{
            console.error("init",data)
            switch(field.type) {
                case "number":
                    return new JSONNumber(data,field);
                break;
                case "boolean":
                    return new JSONBoolean(data,field);
                break;
                case "text":
                default:
                    return new JSONText(data,field);
                break;
            }
        })
    }
    render() {
        return this.fields.map(field=>field.render()).join("\n");
    }
}

class JSONFormField {
    constructor(data,field) {
        this.data = data;
        this.field = field;
    }
    valueOf() {
        return document.querySelector(`[data-json-field][name="${this.name}"]`).value
    }
    render() {
        return `
        <div class="form-row">
            <div class="title">${this.field.label}</div>
            <div class="spacer"></div>
            <div class="fields">
                ${this.formField()}
            </div>
        </div>`
    }
    valueOf() {
        console.error(this.data);
        if (this.data[this.field.name]) {
            return this.data[this.field.name];
        }
        return this.field.default;
    }
}
class JSONText extends JSONFormField{ 
    formField() {
        return `<input type='text' data-json-field name="${this.field.name}" value="${this.valueOf()}">`
    }
}
class JSONNumber extends JSONFormField {
    formField() {
        return `<input type='number' data-json-field name="${this.field.name}" value="${this.valueOf()}">`
    }
}
class JSONBoolean extends JSONFormField {
    checked() {
        if (this.valueOf()==true || this.valueOf()=="true") {
            return true;
        } else {
            return false;
        }
    }
    formField() {

        return `
            <div><input type="radio" data-json-field name="${this.field.name}" value="true" ${this.checked()?'checked':''}> yes</div>
            <div><input type="radio" data-json-field name="${this.field.name}" value="false" ${this.checked()?'':'checked'}> no</div>
        `
    }
}

class JSONSelectField extends JSONFormField {
    formField() {
        return `
            <select data-json-field name="${this.field.name}">
                ${this.field.options.map(
                    option=>`<option value="${option.value}" ${option.value==this.valueOf()?' selected':''}>${option.label?option.label:option.value}</option>`
                ).join("\n")
            }
            </select>
        `;
    }
}