class ProductsList {
    constructor(options) {
        this.config = options;
        this.products = [];
        if (sessionStorage.getItem(this.sessionId())) {
            this.products = JSON.parse(sessionStorage.getItem(this.sessionId()))
            this.render();
        } else {
            this.load_products();
        }
        
    }
    sessionId() {
        return `products-list-${this.config.sitename}`
    }
    load_products(cursor="") {
        fetch(`/ajax/fetch_products?cursor=${cursor}`)
            .then(response=>response.json())
            .then(q=>{
                console.error(q);
                this.products = this.products.concat(q.data.products.nodes)
                console.error(this.products)
                if (q.data.products.pageInfo.hasNextPage) {
                    this.load_products(q.data.products.pageInfo.endCursor)
                } else {
                    sessionStorage.setItem(this.sessionId(),JSON.stringify(this.products))
                    this.render();
                }
            });
     }
     render() {
        let options = this.products.map(product=>`<option value="${product.id.split("/").pop()}">${product.title}`);
        document.querySelector(this.config.injection_point).innerHTML = `
            <div>
                <h3>Select a Product</h3>
                <div style="display:flex;flex-direction:row;gap:8px">
                    <select id="id-select">${options}</select>
                    <button class="action-button">Go!</button>
                </div>
            </div>
        `;
        document.querySelector(`${this.config.injection_point} .action-button`).addEventListener("click",event=>{
            let select = document.querySelector(`${this.config.injection_point} #id-select`);
            this.dispatch(select.options[select.selectedIndex].value);
        });
     }
     dispatch(id) {
        location.href=`/nutrition_tables?id=${id}`;
     }   
}