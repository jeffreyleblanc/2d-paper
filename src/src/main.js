// SPDX-FileCopyRightText: Copyright (c) 2023-present Jeffrey LeBlanc
// SPDX-License-Indentifier: MIT

import "./css/index.css"

import {createApp,reactive} from "vue"
import {G} from "./global.js"
import MainApp from "./MainApp.vue"


function main(){

    // Global holder for the CanvasManager
    G.$CM = null;

    // A reactive store with some shapes
    G.store = reactive({
        items: [{
            id: 1,
            order: 1,
            shape:"rect",
            color:"red",
            x:100, y:100, w:100, h:50
        },{
            id: 2,
            order: 1,
            shape:"rect",
            color:"green",
            x:10, y:100, w:70, h:200
        },{
            id: 3,
            order: 1,
            shape: "circle",
            color:"blue",
            cx:200, cy:200, r:25
        },{
            id: 4,
            order: 1,
            shape:"rect",
            color:"purple",
            x:250, y:180, w:70, h:200
        }]
    });

    // Create the main app
    G.app = createApp(MainApp);
    G.app.use(G);
    G.app.mount("#mount");

    // Export to window for debugging
    if(window.$G===undefined){
        window.$G = G;
    }else{
        console.warn("window.$G already assigned.")
    }
}

main();

