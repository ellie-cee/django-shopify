class JSONEditor {
    constructor(id,injection_point) {
        this.json = {};
        this.product_id = null;
        this.injection_point = injection_point;
        this.selectedIndex=0;
        this.history = [];
        this.historyIndex = 0;


        document.addEventListener("RemoveChild",event=>{
            
            let element = document.querySelector(`[data-uuid="${event.detail}"]`);
            if (element) {
                element.parentNode.removeChild(element);
            }
            
        });
        document.addEventListener("RemoveTable",event=>{
            this.children = this.children.filter(child=>child.index!=parseInt(event.detail));
            if (this.selectedIndex>=this.children.length-1 ) {
                this.selectedIndex = this.children.length-1;
            }
            
            this.children.forEach((child,index)=>child.index=index)
            this.render();
        });
        document.addEventListener("CloneTable",event=>{
            let child = this.children.find(child=>child.index==parseInt(event.detail));
            this.children.push(new RootNode(this,child.serialize(),this.children.length))
            this.render()
        });
        document.addEventListener("ReRender",event=>this.render());
        document.addEventListener("UpdatePreviews",event=>{
            this.children.forEach(child=>child.renderPreview())}
        );
        this.load(id);
    }

    load(id) {
        window.fetch(
            `/nutrition_tables/get/${id}`,
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        ).then(response=>response.json())
        .then(product=>{
            if (!product.facts) {
                let defaults = this.defaultNode(product.title.split("(")[0])
                let fromQuery = {
                    handle:product.handle,
                    product_title:product.title,
                    category:product.type,
                }
                product.facts = {value:[{...defaults,...fromQuery}]};
            } else {
                product.facts.value = JSON.parse(product.facts.value);
            }
            this.product = product;
            this.json = product.facts.value;
            this.product_id = product.id;
            this.children = product.facts.value.map((table,index)=>new RootNode(this,table,index));
            this.render()
        });
    }
    save() {
        let id = this.product_id.split("/").pop();
        window.fetch(
            `/nutrition_tables/set/${id}`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body:JSON.stringify(this.serialize())
            }
        )
        .then(response=>response.json())
        .then(resturn=>{
            alert("Nutrition Table Saved. You can now close this window.")
        })

    }

    render() {
            let tabs = this.children.map((child,index)=>`
                <div class="item-tab" data-index="${index}">
                    <div>${child.tabName()}</div>
                    <div><button class="tab-button delete" data-index="${index}" title="Delete Table"></button></div>
                    <div><button class="tab-button clone" data-index="${index}" title="Clone Table" ></button></div>
                </div>
            `).join("");
            document.querySelector(this.injection_point).innerHTML = `
                <div class="header">
                    <button class="action-button add" title="Add Table"></button>
                    <button class="action-button refresh" title="Refresh Table"></button>
                    <button class="action-button save" title="Save Table"></button>
                </div>
                <div class="tabs">${tabs}<div class="empty-tab"></div></div>
                <div class="all-items-holder">${this.children.map(child=>child.render()).join("\n")}</div>
            `
            ;
            document.querySelectorAll(".item-tab").forEach((tab,index)=>{
                tab.addEventListener("click",event=>{
                    this.selectedIndex = index; 
                    this.select_tab(index);
                })
            })
            this.select_tab(this.   selectedIndex)
            document.querySelector(".action-button.save").addEventListener("click",event=>this.save());
            document.querySelector(".action-button.add").addEventListener("click",event=>this.newTable(prompt("Table name?")));
            document.querySelector(".action-button.refresh").addEventListener("click",event=>document.dispatchEvent(new CustomEvent("ReRender",{bubbles:true})));
            this.children.forEach(child=>{
                child.setupEvents();
            });

            document.querySelectorAll(`.tab-button.delete`).forEach(button=>{ 
                button.addEventListener("click",evemt=>{
                    event.stopPropagation();
                    document.dispatchEvent(new CustomEvent("RemoveTable",{bubbles:true,detail:button.dataset.index}))
                });
            })
            document.querySelectorAll(`.tab-button.clone`).forEach(button=>{ 
                button.addEventListener("click",evemt=>{
                    event.stopPropagation();
                    document.dispatchEvent(new CustomEvent("CloneTable",{bubbles:true,detail:button.dataset.index}))
                });
            })

            
    }
    select_tab(index) {
        
        document.querySelectorAll(".cnr-json-object").forEach(content=>content.classList.remove("active"));
        document.querySelectorAll(".item-tab").forEach(content=>content.classList.remove("active"));
        try {
            document.querySelector(`.cnr-json-object[data-index="${index}"]`).classList.add("active");
            document.querySelector(`.item-tab[data-index="${index}"]`).classList.add("active");
        } catch (e) {
            console.error(e);
        }
        
    }
    defaultNode(subtitle="New Item") {
        return {
            "product_title":"New Table",
            "handle":"",
            "subtitle":subtitle,
            "nutrition_facts":[],
            "calories":"0",
            "serving_per_container":"2",
            "serving_size":"1g",
            "category":"uncategorized",
            "ingredients_label":"Ingredients",
            "note":"",
            "contains":"",
            "other_ingredients":"",
            "daily_value_note":"",
            "table_header":"Supplement Facts",
            
        }
    }
    newTable(subtitle="New Table") {
        this.selectedIndex = this.children.length;
        this.children.push(
            new RootNode(
                this,
                this.defaultNode(subtitle),
                this.children.length
            )
        );
        this.render();
    }
    generate_uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    serialize() {
        return this.children.map(child=>child.serialize())
    }
    search(uuid) {
        return this.children[this.selectedIndex].search(uuid);
    }
    
}

class RootNode  {
    constructor(parent,json,index) {
        this.parent = parent;
        this.json = json;
        this.index = index;
        this.children = Object.keys(this.json).sort().map(key=>{
            if (key=="nutrition_facts") {
                return new NutritionFacts(key,this.json[key],index)
            } else  {
                if (key=="subtitle" && this.json[key].length<1) {
                    this.json[key] = this.parent.product.title;
                }
                return new FormRow(key,this.json[key],index);
            }
        });
    }
    tabName() {
        if (this.json.subtitle) {
            return this.json.subtitle;
        } else if (this.json.handle) {
            return this.json.handle;
        } else {
            return `Table ${this.index}`
        }
    }
    render() {
        return `
            <div class="cnr-json-object" data-index="${this.index}">
                <div style="display:flex">
                    
                    <div class="form">
                        <div class="cnr-form-row options">
                        <div><h1>${this.tabName()}</h1></div>
                        <div class="spacer"></div>
                            <div>
                                <button class="js-new-field add" title="Add Field"></button>
                            </div>

                        </div>
                        ${this.children.map(child=>child.render()).join("\n")}
                    </div>
                    <div class="preview">${this.preview()}</div>
                </div>

            </div>
        `;
    }
    renderPreview() {
        this.json = this.serialize();
        document.querySelector(`.cnr-json-object[data-index="${this.index}"] .preview`)
            .innerHTML = this.preview();
    }
    preview() {
        let facts = this.json;
        let showSS = () => (facts.serving_size) ? `<div>Serving Size ${facts.serving_size}</div>` : ''
        let showSPC = () => (facts.serving_per_container) ? `<div> Serving Per Container ${facts.serving_per_container}</div>` : ''
        let showC = () => (facts.calories) ? `
            <span class="nutrition-facts-amount-label amount-per-serving"><strong>Amount Per Serving</strong></span>
                <span class="calories-value">
                <span class="nutrition-value daily-value">% Daily Value*</span>
                </span>
            ` : ''
        let showDVNote = () => (!facts.daily_value_note) ? '' : `<div style="white-space: pre-line;"class="supplement-facts__footer--daily-note">${facts.daily_value_note}</div>`;
        let renderSubFacts = (sub_facts)=>{
            if (!sub_facts) { return '';}
            return `
              <ul class="sub-facts">
                ${sub_facts.map(subfact=>`
                  <li>
                      <span class="nutrition-facts-row">
                        <span class="nutrition-facts-label"> ${subfact.name}  ${subfact.amount_per_serving}</span>
                        <span class="nutrition-daily_value">${subfact.daily_value ? subfact.daily_value : facts.daily_value_default }</span>
                      </span>
                      ${subfact.sub_facts?renderSubFacts(subfact.sub_facts):''}
                </li>
              `).join("")}
              </ul>`
          }
      
        function showNote() {
            let otherIngredients = facts.other_ingredients ? `Other ingredients: ${facts.other_ingredients}` : '';
            let contains = facts.contains ? `${facts.contains}` : '';
            return `
                <p class="footer-note-p">${otherIngredients}</p>
                <p class="footer-note-p">${facts.note}</p>
                ${ contains != '' ? `<p class="footer-note-p nutrition-facts-contains-label"><strong>Contains: </strong>${contains}</p>`: '' }
                <p class="footer-note-p">
                    Manufactured in Utah, USA. We are committed to continuously improving our ingredients. For most updated ingredients, please see the packaging label.
                    <a class="manufactured-link" href="https://cleansimpleeats.com/pages/ingredient-glossary" target="_blank">Learn more about our ingredients here.</a>
                </p>
                `;
        }
      
        let showContent = (fact)=>(fact.content)?`<p class="nutrition-facts-content">${ fact.content }</p>`:''
        let renderNutritionFacts = (fact) => {
            return `
                <li class="nutrition-fact ${fact.sub_facts?'has-sub_facts':''} ${fact.content?'has-content':''}" >
                    <span class="nutrition-facts-row ">
                    <span class="nutrition-facts-label"><strong>${fact.name}</strong> ${fact.amount_per_serving}</span>
                    <span class="nutrition-daily_value">${fact.daily_value?fact.daily_value:facts.daily_value_default}</span>
                    ${showContent(fact)}
                    </span>
                    ${renderSubFacts(fact.sub_facts)}
                </li>
            `
        }
        return `<div id="supplemnt-facts-{{ product.handle }}-" class="supplement-facts--table ">
                
                  <div class="nutrition-body">
                   <div class="nutrition-body--inner">
                    <div class="supplement-facts__header">
                      <div class="section-header nutrition-title">
                        <h2 class="section-header__title dropdown-title">
                          ${facts.table_header}
                        </h2>
                        ${showSS()} ${showSPC()}
                      </div>
                    </div>
                    <ul class="supplement-facts__body">
                      <li class="nutrition-header">
                        ${showC()}
                      </li>
                        <div class="calories-span">
                          <span class="nutrition-facts-label calories"><strong>Calories</strong></span>
                          <span class="nutrition-value calories">${ facts.calories }</span>
                      </div>
                      ${[false,true].map(category=>`
                        <div class="nutrition-facts-more-${category}">
                            ${facts.nutrition_facts.filter(fact=>fact.is_nutrient_needed_more==category)
                                .map(fact=>renderNutritionFacts(fact)).join("")
                        }
                        </div>
                      `).join("")}
                    </ul>
                    <div class="supplement-facts__footer">
                    ${showDVNote()}
            </div>
            </div>
            </div>
                <div class="supplement-facts__footer-note">
                ${showNote()}
            </div>
        </div>`
    }
    serialize() {
        let ret = {};
        this.children.forEach(child=>ret[child.key] = child.serialize())
        return ret;
    }
    search(uuid) {
        for (let i=0;i<this.children.length;i++) {
            if (this.children[i].uuid==uuid) {
                return this.children[i]
            } else {
                let v = this.children[i].search(uuid);
                if (v) {
                    return v;
                }
            }
        }
        return null;
    }
    setupEvents() {
        this.children.forEach(child=>child.setupEvents());
        
        document.querySelector(`.cnr-json-object[data-index="${this.index}"] .js-new-field`)
            .addEventListener("click",event=>{
                let newRow = new FormRow("","",this.children.length);
                this.children.unshift(newRow);
                document.dispatchEvent(new CustomEvent("ReRender",{bubbles:true}));
                setTimeout(()=>{
                    document.querySelector(`[data-uuid="${newRow.uuid}"] input[name="key"]`).focus();
                },200);        
        });
        document.addEventListener("RemoveChild",event=>{
            if (this.children.find(child=>child.uuid==event.detail)) {
                this.children = this.children.filter(child=>child.uuid!=event.detail);
                
            }
           
            
           
        })
    }
}
class FormRow  {
    constructor(key,value,index) {
        this.key = key;
        this.value = value;
        this.index = index;
        this.uuid = this.generate_uuid()
    }
    generate_uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    changed() {
        
        if (this.intervalID) {
            
            window.clearTimeout(this.intervalID);
        }
        this.interval = window.setTimeout(()=>{
            
            document.dispatchEvent(new CustomEvent("UpdatePreviews",{bubbles:true}));
            window.clearTimeout(this.intervalID);
            this.intervalID=null;
        },400);
    }
    render() {
        return `
            <div class="cnr-form-row even_odd" data-index="${this.index}" data-uuid="${this.uuid}">
                <div><input type="text" name="key" value="${this.key}"></div>
                <div><textarea class="large-value" name="value">${this.valueOf(this.value)}</textarea></div>
                <div class="spacer"></div>
                <div><button class="delete" title="Delete row"></button></div>
            </div>
        `
        
    }
    serialize() {
        return this.value;
    }
    search(uuid) { 
        if (this.uuid==uuid) {
            return this;
        }
        return null;
    }
    valueOf(value) {
        return value==null?'':value;
    }
    setupEvents() {
        ["key","value"].forEach(field=>{    
            document.querySelector(`[data-uuid="${this.uuid}"] [name="${field}"]`)
                .addEventListener("keyup",event=>{
                    
                    this[field] = event.target.value;
                    this.changed();
                })
        });
        document.querySelector(`[data-uuid="${this.uuid}"]`)
            .addEventListener("dragstart",event=>{
                console.error(this.serialize())
                event.dataTransfer.setData("text/plain",JSON.stringify(editor.search(this.uuid)))
            })
        document.querySelector(`[data-uuid="${this.uuid}"] button`)
            .addEventListener("click",event=>{
                document.dispatchEvent(new CustomEvent("RemoveChild",{bubbles:true,detail:this.uuid}))
        });
    }
}
class BlankRow {
    constructor() {
        this.children = [];
    }
    render() {
        return '';
    }
}
class NutritionFormRow extends FormRow {
    constructor(key,value,index) {
        super(key,value,index)
        this.value =value;
        this.value.is_nutrient_needed_more=value.is_nutrient_needed_more||false;
        if(value.sub_facts) {
            this.sub_facts = new NutritionSubFacts("sub_facts",value.sub_facts,index);
        } else {
            this.sub_facts = new BlankRow();
        }
    }

    render() {
        
        return `
            <div class="wrapper" data-uuid="${this.uuid}" data-element-type="${this.constructor.name}">
            <div class="cnr-form-row" data-index="${this.index}" >
                <div><input type="text" name="name" value="${this.valueOf(this.value.name)}"></div>
                <div><input type="text" name="amount_per_serving" value="${this.valueOf(this.value.amount_per_serving)}"></div>
                <div><input type="text" name="daily_value" value="${this.valueOf(this.value.daily_value)}"></div>
                <div ${this.constructor.name!="NutritionFormRow"?'style="display:none"':''}>
                    <select name="is_nutrient_needed_more" class="innm">
                        <option value="false">less</option>
                        <option value="true" ${this.value.is_nutrition_needed_more?'selected':''}">more</option>
                    </select>
                </div>
                <div class="spacer"></div>
                <div>
                    <button class="add" title="Add Sub Facts Table"></button>
                    <button class="delete" title="Delete Row"></button>
                </div>
            </div>
            <div class="description">
                <textarea rows="2" columns="50" data-uuid="${this.uuid}" placeholder="Description" name="content">${this.valueOf(this.value.content)}</textarea>
            </div>
            </div>
            ${this.sub_facts.render()}
        `
    }
    serialize() {
        let ret = {
            name:this.value.name,
            amount_per_serving:this.value.amount_per_serving,
            daily_value:this.value.daily_value,
            is_nutrient_needed_more:this.value.is_nutrient_needed_more
        };
        if (this.value.sub_facts && this.sub_facts.children.length>0) {
            ret.sub_facts = this.sub_facts.serialize();
        }
        let content = document.querySelector(`textarea[data-uuid="${this.uuid}"]`);
        if (content) {
            ret.content = content.value;
        }
        return ret;
    }
    search(uuid) {
        
        if (this.uuid==uuid) {
            return this;
        } else {
            if (this.value.sub_facts) {
                return this.sub_facts.search(uuid);
            }
        }
        return null;
    }
    setupEvents() {
        ["name","amount_per_serving","daily_value","content"].forEach(field=>{
            document.querySelector(`[data-uuid="${this.uuid}"] [name="${field}"]`)
                .addEventListener("keyup",event=>{
                    this.changed();
                    this.value[field] = event.target.value;
                    
                })
        });
        document.querySelector(`[data-uuid="${this.uuid}"]`)
            .addEventListener("dragstart",event=>{
                console.error("dragstart");
                let node = editor.search(event.target.dataset.uuid);
                if (node) {
                    console.error(node.serialize())
                }
                
        })
        document.querySelector(`[data-uuid="${this.uuid}"] select.innm`)
            .addEventListener("click",event=>{
                this.value.is_nutrient_needed_more = event.target.options[event.target.selectedIndex].value=="true";
                console.error(this.value.is_nutrient_needed_more);
                this.changed()
            });
        document.querySelector(`[data-uuid="${this.uuid}"] button.delete`)
            .addEventListener("click",event=>{
                document.dispatchEvent(new CustomEvent("RemoveChild",{bubbles:true,detail:this.uuid}))
            });
        
        
        if (!this.constructor.name!="SubfactRow)") {
            document.querySelector(`[data-uuid="${this.uuid}"] button.add`)
                .addEventListener("click",event=>{
                    if (!this.value.sub_facts) {
                        this.sub_facts = new NutritionSubFacts("sub_facts",[{name:"",amount_per_serving:"",daily_value:""}],1);
                        this.value.sub_facts = this.sub_facts.serialize()
                        document.dispatchEvent(new CustomEvent("ReRender",{bubbles:true}))
                    } else {
                        this.sub_facts.addChild();
                        this.value.sub_facts = this.sub_facts.serialize()
                        document.dispatchEvent(new CustomEvent("ReRender",{bubbles:true}))
                    }
                    
            });
            document.querySelector(`[data-uuid="${this.uuid}"] button.add`).style.display="inline-block";
        } 
        
        document.addEventListener("RemoveChild",event=>{

            if (this.sub_facts && this.sub_facts.uuid==event.detail) {
                console.error("subfactstable",event.detail);
                this.sub_facts = new BlankRow()
                this.value.sub_facts=null;
                document.dispatchEvent(new CustomEvent("UpdatePreviews",{bubbles:true}));
                
            }
        });
        
        if (this.value.sub_facts) {
            this.sub_facts.setupEvents();
        }
    }
}
class SubfactRow extends NutritionFormRow {
    render() {
       let html = super.render(true);
        return `
            <div style="margin-left:16px">${html}</div>
        `
    }
}

class NutritionFacts extends FormRow {
    label() {
        return "Nutrition Facts";
    }
    constructor(key,value,index) {
        super(key,value,index);
        this.children = value.map(child=>this.newChild(key,child,index));
    }
    newChild(key,child,index) {
        return new NutritionFormRow(key,child,index);
    }
    
    render() {
        return `
            <div class="cnr-form-nutrition-facts ${this.constructor.name.toLowerCase()}" data-index="${this.index}" data-uuid="${this.uuid}">
                <div class="header "><h2>${this.label()}</h2>
                <div class="spacer"></div>
                    <div class="buttons">
                        <button class="add" title="Add Nutrition Fact"></button>
                        
                    </div>
                </div>
                
                ${this.children.map(child=>child.render()).join("\n")}
            </div>
        `
    }
    serialize() {
        return this.children.map(child=>child.serialize());
    }
    search(uuid) {
        for (let i=0;i<this.children.length;i++) {
            if (this.children[i].uuid==uuid) {
                return this.children[i]
            } else {
                let v = this.children[i].search(uuid);
                if (v) {
                    return v;
                }
            }
        }
        return null;
    }
    
    setupEvents() {
        this.children.forEach(child=>child.setupEvents());
        document.addEventListener("RemoveChild",event=>{
            if (this.children.find(child=>child.uuid==event.detail)) {
                this.children = this.children.filter(child=>child.uuid!=event.detail);
                
                document.dispatchEvent(new CustomEvent("UpdatePreviews",{bubbles:true}));
            }
            
            

        });
            
            //if (this.constructor.name!="NutritionFacts") {
                
                
                document.querySelector(`[data-uuid="${this.uuid}"] .delete`).style.display="inline-block";
            //} else {
                document.querySelector(`[data-uuid="${this.uuid}"] .add`)
                .addEventListener("click",event=>{
                    this.addChild();
                    document.dispatchEvent(new CustomEvent("ReRender",{bubbles:true}));
                })
    
               //document.querySelector(`[data-uuid="${this.uuid}"] .delete`).style.display="none";
            //}
            
        
        
        document.addEventListener("AddChild",event=>{
            if (event.detail==this.uuid) {
                this.addChild();
            }
        })
    }
    addChild() {
        let newChild =  this.newChild("nutrition_facts",{name:"",amount_per_serving:"",daily_value:""},this.children.length);
        this.children.unshift(newChild);
        setTimeout(()=>{
            document.querySelector(`[data-uuid="${newChild.uuid}"] input[name="name"]`).focus();
        },200);        
    }
}
class NutritionSubFacts extends NutritionFacts {
    label() { return "Sub-facts";}
    newChild(key,child,index) {
        return new SubfactRow(key,child,index);
    }
    
    setupEvents() {
        this.children.forEach(child=>child.setupEvents());
        document.addEventListener("RemoveChild",event=>{
            if (this.children.find(child=>child.uuid==event.detail)) {
                this.children = this.children.filter(child=>child.uuid!=event.detail);
                
                document.dispatchEvent(new CustomEvent("UpdatePreviews",{bubbles:true}));
            }
            
            
        });
       
        document.querySelector(`[data-uuid="${this.uuid}"] .add`)
            .addEventListener("click",event=>{
                this.children.unshift(new SubfactRow(this.key,{name:"",daily_value:"",amount_per_serving:""},this.children.length))
                document.dispatchEvent(new CustomEvent("ReRender",{bubbles:true}));
            })
    }
}