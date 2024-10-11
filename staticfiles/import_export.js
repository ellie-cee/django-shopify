class NutritionTableImporter {
    constructor(options) {
        this.config = options;
        this.products = [];
        this.handle_map = {};
        this.exported = []
        this.status_text = document.querySelector(".status-field h1");
        this.load_index = 0;

        document.querySelector(".load-button").addEventListener("click",event=>{
            event.target.disabled=true;
            this.load_product_ids();
        })
    }
    segment(array,chunkSize=25) {
        let ret = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            ret.push(array.slice(i, i + chunkSize));
        }
        return ret;     
    }
    load_source_metafields(cursor="") {
        fetch(`/import/fetch_metafields/${this.config.source_id}?cursor=${cursor}`)
            .then(response=>response.json())
            .then(q=>{
                console.error(q)
                this.products = this.products.concat(
                    q.data.products.nodes.filter(product=>product.facts!=null)
                );
                this.status_text.textContent = `Loaded ${this.products.length} of ${Object.keys(this.handle_map).length} Products`
                if (q.data.products.pageInfo.hasNextPage) {
                    this.load_source_metafields(q.data.products.pageInfo.endCursor);
                } else {
                    this.segments = this.segment(
                        this.products.map(product=>{
                            return {
                                id:this.handle_map[product.handle],
                                value:product.facts.value,
                                title:product.title,
                            }
                        }),
                        10
                    );
                    this.segment_count = this.segments.length;
                    console.error(this.segments);
                    this.copyMetas()
                    
                }
            });
    }
    load_product_ids(cursor="") {
        fetch(`/import/fetch_metafields/${this.config.dest_id}?cursor=${cursor}`)
            .then(response=>response.json())
            .then(q=>{
                q.data.products.nodes.filter(product=>product.facts!=null).forEach(product=>{
                    this.handle_map[product.handle] = product.id
                })
                this.status_text.textContent = `Loaded ${Object.keys(this.handle_map).length} of ? Wholesale Products`
                if (q.data.products.pageInfo.hasNextPage) {
                    this.load_product_ids(q.data.products.pageInfo.endCursor);
                } else {
                    this.load_source_metafields()
                }
            });
    }
    copyMetas() {

       
        
        let bar = document.querySelector(".importer-status-bar");
        let fill = document.querySelector(".importer-status-fill");
        if (this.segments.length<1) {
            this.status_text.textContent = "Done!";
            fill.style.width = "100%";
            document.querySelector(".subtext").textContent= `It is safe to close this window`;
            return;
        }
        
        fill.style.width = `${((this.exported.length+1)/this.segment_count)*100}%`
        bar.classList.add("active");
        let segment = this.segments.shift()
        this.status_text.textContent = `Updating...`;
        let map = segment.map(item=>`<li>${item.title}</li>`).join("")
        document.querySelector(".subtext").innerHTML= `<ul>${map}</ul>`;

        window.fetch(
            `/import/set_metafield/${this.config.dest_id}`,
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
}