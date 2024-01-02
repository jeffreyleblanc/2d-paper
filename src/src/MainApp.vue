<!--
SPDX-FileCopyRightText: Copyright (c) 2023-present Jeffrey LeBlanc
SPDX-License-Indentifier: MIT
-->

<template>
<div class="w-screen h-screen flex flex-col bg-pink-300">
    <nav class="p-4 flex flex-row items-center bg-purple-300">
        <h1 class="text-2xl font-bold">Welcome to 2D</h1>
    </nav>
    <main class="bg-lime-300 flex-1 min-h-0 overflow-auto flex flex-row">
        <aside class="w-36 h-full flex flex-col gap-y-2 p-4 bg-sky-200">
            <div>aside left</div>
            <button class="px-4 py-1 bg-blue-500 text-white rounded" @click="recenter">recenter</button>
            <button class="px-4 py-1 bg-blue-500 text-white rounded" @click="zoom(0.05)">zoom in</button>
            <button class="px-4 py-1 bg-blue-500 text-white rounded" @click="zoomreset">reset zoom</button>
            <button class="px-4 py-1 bg-blue-500 text-white rounded" @click="zoom(-0.05)">zoom out</button>
        </aside>
        <div ref="canvas_holder"class="flex-1 min-h-0 overflow-auto">
            <canvas ref="main_canvas" class="h-full w-full bg-white"/>
        </div>
        <aside class="w-36 h-full p-4 bg-teal-200">
            aside right
        </aside>
    </main>
    <footer class="p-4 flex flex-row items-center bg-indigo-300">
        <h1 class="text-sm font-bold">footer</h1>
    </footer>
</div>
</template>

<script>

import CanvasManager from "./CanvasManager.js"

export default {
    data(){ return {
        local_title: "",
        local_content: ""
    } },
    computed: {
        posts(){ return this.$G.mng.store.posts.sort((a,b) => b.id-a.id) }
    },
    created(){
        console.log("MainApp::created");
        this.$CM = new CanvasManager(this.$G);
        this.$G.$CM = this.$CM;
    },
    mounted(){
        console.log("MainApp::mounted");
        this.$CM.on_mount(this.$refs.main_canvas);
    },
    methods: {
        // pass
        recenter(){
            this.$CM.viewport_recenter();
        },
        zoomreset(){
            this.$CM.viewport_set_scale(1.0);
        },
        zoom(step){
            this.$CM.viewport_step_scale(step);
        }
    }
}
</script>

