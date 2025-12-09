class APIFetch{
    constructor(){
        this.chave = "9D67A537A9329E0F1E9D088A1C991F1CC728EA87D3D154B409ED3320EA940303";
        this.URLBASE = "http://localhost:800/backend/api/"
    }
    async fetch(url){       // usuarios
        try{
            let response = await fetch(`${this.URLBASE}${url}`, { 
            method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.chave}`
                }
            });
            let data = await response.json();
            return data;
        }catch(error){
            console.log(`o Erro foi: ${error}`)
        }
    }
}
export default APIFetch;