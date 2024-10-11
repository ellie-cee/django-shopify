class WholesaleDiscounts {
    constructor(options) {
        this.config = options;
        this.products = [];
        this.exported = [];
        if (sessionStorage.getItem(this.sessionId()) && false) {
            this.products = JSON.parse(sessionStorage.getItem(this.sessionId()))
            this.render();
        } else {
            this.load_products();
        }
        
    }
    segment(array,chunkSize=25) {
        let ret = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            ret.push(array.slice(i, i + chunkSize));
        }
        return ret;     
    }
    sessionId() {
        return `products-list-${this.config.sitename}`
    }
    load_products(cursor="") {
        fetch(`/wholesale_discounts/get?cursor=${cursor}`)
            .then(response=>response.json())
            .then(q=>{
                console.error(q);
                this.products = this.products.concat(q.data.products.nodes)
                if (q.data.products.pageInfo.hasNextPage) {
                    this.load_products(q.data.products.pageInfo.endCursor)
                } else {
                   // sessionStorage.setItem(this.sessionId(),JSON.stringify(this.products))
                    this.render();
                }
            });
     }
     render() {
        let options = this.products.map(product=>`
            <div style="display:flex;flex-direction:row;gap:8px">
              <div>${product.title}</div>
              <div style="flex-grow:1"></div>
              <div><input class="js-wholesale-discount" data-title="${product.title}" data-product-id="${product.id}" type="number" value="${product.wholesale_discount?product.wholesale_discount.value:0.34975}"></div>
            </div>
        `).join("");
        document.querySelector(this.config.injection_point).innerHTML = `
            <div>
                <h3>Wholesale Prices</h3>
                <div class="status-field"><h1></h1></div>
                <div class="subtext"></div>
                <div class="importer-status-bar">
                    <div class="importer-status-fill"></div>
                </div>
                <div class="products-holder">
                    ${options}
                    <button class="js-action-button">Update</button>
                </div>
                
            </div>
        `;
        document.querySelector(`${this.config.injection_point} .js-action-button`).addEventListener("click",event=>{
            let payload = Array.from(document.querySelectorAll(".js-wholesale-discount")).map(node=>{
                return {
                    id:node.dataset.productId,
                    value:node.value,
                    title:node.dataset.title
                }
            })
            this.segments = this.segment(payload,10);
            this.segments_count = this.segments.length;
            document.querySelector(".products-holder").style.display="none";
            console.error(this.segments)
            this.copyMetas();
        });
     }
     copyMetas() {
        let bar = document.querySelector(".importer-status-bar");
        let fill = document.querySelector(".importer-status-fill");
        if (this.segments.length<1) {
            document.querySelector(".status-field").textContent = "Done!";
            fill.style.width = "100%";
            document.querySelector(".subtext").textContent= `It is safe to close this window`;
            return;
        }
        fill.style.width = `${((this.exported.length+1)/this.segments_count)*100}%`
        bar.classList.add("active");
        let segment = this.segments.shift()
        document.querySelector(".status-field").textContent = `Updating...`;
        let map = segment.map(item=>`<li>${item.title}</li>`).join("")
        document.querySelector(".subtext").innerHTML= `<ul>${map}</ul>`;

        window.fetch(
            `/wholesale_discounts/set`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body:JSON.stringify(segment)
            }
        )
        .then(response=>response.json())
        .then(q=>{
            this.exported.push(q);
            this.copyMetas();
        })

        //fill.style.width=
    }
     dispatch(id) {
        location.href=`/nutrition_tables?id=${id}`;
     }   
}