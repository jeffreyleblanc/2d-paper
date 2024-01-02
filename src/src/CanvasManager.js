// SPDX-FileCopyRightText: Copyright (c) 2023-present Jeffrey LeBlanc
// SPDX-License-Indentifier: MIT

import {utc_millis} from "./utils.js"

export default class CanvasManager {

    constructor(global_object){
        this.$G = global_object;

        // Canvas elements
        this.canvas_el = null;
        this.ctx = null;

        // Position of the pointer
        this.client_pos = {x:0,y:0};
        this.canvas_pos = {x:0,y:0};
        this.doc_pos = {x:0,y:0};

        // Render
        this.is_pointer_within = false;

        // Document viewport transforms
        this.docviewport_canvas_translation = {x:0,y:0};
        this.docviewport_scale = 1.0;

        // Focus dragging helpers
        this.is_focus_dragging = false;
        this.focus_obj_ptr = null;
        this.focus_obj_grab_offset = {x:0,y:0};

        // Viewport dragging updates
        this.is_viewport_dragging = false;
        this.viewport_grab_offset = {x:0,y:0};
    }

    //-- DOM Interface Events -------------------------------------------------------------//

        on_mount(canvas_el){
            // Basic canvas refs
            this.canvas_el = canvas_el;
            this.ctx = this.canvas_el.getContext("2d");

            // Attach a resize observer
            this.resizeObserver = new ResizeObserver((event)=>{this.on_resize(event)});
            this.resizeObserver.observe(this.canvas_el);

            // Attach event handlers
            for(let evt of ["mousedown","mousemove","mouseup","mouseenter","mouseleave","wheel"]){
                const meth = this[`on_${evt}`];
                this.canvas_el.addEventListener(evt,meth.bind(this));
            }

            // Start the render loop
            this.run_render_loop();
        }

        on_resize(event){
            // Determine size
            const cbbox = this.canvas_el.getBoundingClientRect();
            this.canvas_root_x = cbbox.x;
            this.canvas_root_y = cbbox.y;
            this.canvas_width = cbbox.width;
            this.canvas_height = cbbox.height;

            // Set the size
            this.canvas_el.width = this.canvas_width;
            this.canvas_el.height = this.canvas_height;
        }

    //-- ViewPort -------------------------------------------------------------//

        viewport_recenter(){
            this.docviewport_canvas_translation.x = 0;
            this.docviewport_canvas_translation.y = 0;
        }

        viewport_set_scale(value){
            this.docviewport_scale = value;
        }

        viewport_step_scale(step){
            this.docviewport_scale += step;
        }

    //-- Coordinates -----------------------------------------------------------------//

        /*
        https://developer.mozilla.org/en-US/docs/Web/CSS/CSSOM_view/Coordinate_systems

        Positions in play
            * client => event.clientX and event.clientY
                * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX
            * mouse => position within the canvas element
            * document => position within the document
        */

        _ingest_pointer_event(event){
            // Save the client position
            this.client_pos.x = event.clientX;
            this.client_pos.y = event.clientY;

            // This transforms from client coor to document
            this.canvas_pos.x = this.client_pos.x - this.canvas_root_x;
            this.canvas_pos.y = this.client_pos.y - this.canvas_root_y;

            // Transform for the document
            this.doc_pos.x = ( this.canvas_pos.x - this.docviewport_canvas_translation.x ) / this.docviewport_scale;
            this.doc_pos.y = ( this.canvas_pos.y - this.docviewport_canvas_translation.y ) / this.docviewport_scale;
        }

        client_to_canvas(event){
            return {
                x: event.clientX - this.canvas_root_x,
                y: event.clientY - this.canvas_root_y
            }
        }

        canvas_to_client(canvas_pos){
            return {
                clientX: canvas_pos.x + this.canvas_root_x,
                clientY: canvas_pos.y + this.canvas_root_y
            }
        }

        canvas_to_doc(canvas_pos){
            return {
                x: ( canvas_pos.x - this.docviewport_canvas_translation.x ) / this.docviewport_scale,
                y: ( canvas_pos.y - this.docviewport_canvas_translation.y ) / this.docviewport_scale
            }
        }

        doc_to_canvas(doc_pos){
            return {
                x: ( doc_pos.x * this.docviewport_scale + this.docviewport_canvas_translation.x ),
                y: ( doc_pos.y * this.docviewport_scale + this.docviewport_canvas_translation.y )
            }
        }

        doc_to_client(doc_pos){
            return {
                x: ( doc_pos.x * this.docviewport_scale + this.docviewport_canvas_translation.x ) + this.canvas_root_x,
                y: ( doc_pos.y * this.docviewport_scale + this.docviewport_canvas_translation.y ) + this.canvas_root_y
            }
        }

    //-- Events -----------------------------------------------------------------//

        on_mousedown(event){
            // Transform the pointer event
            this._ingest_pointer_event(event);

            // Look for object
            const focus_obj = this.find_hit(this.doc_pos);
            if(focus_obj!=null){
                // deal with rect first
                this.is_focus_dragging = true;
                this.focus_obj_ptr = focus_obj;

                this.focus_obj_ptr.order = utc_millis();

                if("rect"==focus_obj.shape){
                    this.focus_obj_grab_offset.x = this.focus_obj_ptr.x - this.doc_pos.x;
                    this.focus_obj_grab_offset.y = this.focus_obj_ptr.y - this.doc_pos.y;
                }else if("circle"==focus_obj.shape){
                    this.focus_obj_grab_offset.x = this.focus_obj_ptr.cx - this.doc_pos.x;
                    this.focus_obj_grab_offset.y = this.focus_obj_ptr.cy - this.doc_pos.y;
                }

            // Otherwise drag the viewport
            }else{
                this.is_viewport_dragging = true;
                this.view_drag_offset_x = this.docviewport_canvas_translation.x - this.canvas_pos.x;
                this.view_drag_offset_y = this.docviewport_canvas_translation.y - this.canvas_pos.y;
            }
        }

        on_mousemove(event){
            // Transform the pointer event
            this._ingest_pointer_event(event);

            // Handle operation
            if(this.is_focus_dragging){
                if("rect"==this.focus_obj_ptr.shape){
                    this.focus_obj_ptr.x = this.doc_pos.x + this.focus_obj_grab_offset.x;
                    this.focus_obj_ptr.y = this.doc_pos.y + this.focus_obj_grab_offset.y;
                }else if("circle"==this.focus_obj_ptr.shape){
                    this.focus_obj_ptr.cx = this.doc_pos.x + this.focus_obj_grab_offset.x;
                    this.focus_obj_ptr.cy = this.doc_pos.y + this.focus_obj_grab_offset.y;
                }
            }
            if(this.is_viewport_dragging){
                this.docviewport_canvas_translation.x = this.canvas_pos.x + this.view_drag_offset_x;
                this.docviewport_canvas_translation.y = this.canvas_pos.y + this.view_drag_offset_y;
            }
        }

        on_mouseup(event){
            // Transform the pointer event
            this._ingest_pointer_event(event);

            // Handle operation
            if(this.is_focus_dragging){
                // Move to final position
                this.focus_obj_ptr.x = this.doc_pos.x + this.focus_obj_grab_offset.x;
                this.focus_obj_ptr.y = this.doc_pos.y + this.focus_obj_grab_offset.y;

                // No more dragging
                this.is_focus_dragging = false;
                this.focus_obj_ptr = null;
            }
            if(this.is_viewport_dragging){
                // Final position
                this.docviewport_canvas_translation.x = this.canvas_pos.x + this.view_drag_offset_x;
                this.docviewport_canvas_translation.y = this.canvas_pos.y + this.view_drag_offset_y;

                // No more dragging
                this.is_viewport_dragging = false;
            }
        }

        on_mouseenter(event){
            this.is_pointer_within = true;
        }

        on_mouseleave(event){
            this.on_mouseup(event);
            this.is_pointer_within = false;
        }

        on_wheel(event){
            // See https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
            const val = Math.round(event.deltaY);
            if(val > 0){
                this.docviewport_scale += 0.05;
            }
            else if (val < 0){
                this.docviewport_scale -= 0.05;
            }
        }

    //-- Hit Detection ------------------------------------//

        find_hit(doc_pos){
            const docx = doc_pos.x;
            const docy = doc_pos.y;

            // Traverse the list in *reverse* order to determine hit
            // Reverse, since those at the end of the array are "on top"
            let obj, hit_obj = null;
            const len = this.$G.store.items.length;
            for(let i=len-1; i>-1; i--){
                let obj = this.$G.store.items[i];
                if("rect"==obj.shape){
                    if(this.within_rect(docx,docy,obj)){
                        hit_obj = obj;
                        break;
                    }
                }
                else if("circle"==obj.shape){
                    const {cx,cy,r,color} = obj;
                    if(this.within_circle(docx,docy,obj)){
                        hit_obj = obj;
                        break;
                    }
                }
            }
            return hit_obj;
        }

        within_rect(x, y, rect){
            return (
                x >= rect.x &&
                y >= rect.y &&
                x <= (rect.x+rect.w) &&
                y <= (rect.y+rect.h)
            );
        }

        within_circle(x, y, circle){
            const dx = circle.cx - x,
                  dy = circle.cy - y;
            return (dx*dx+dy*dy <= circle.r*circle.r);
        }

    //-- Render ------------------------------------//

        run_render_loop(){
            this.render();
            window.requestAnimationFrame(this.run_render_loop.bind(this));
        }

        render(){
            // Clear the canvas
            this.ctx.clearRect(0,0,this.canvas_width,this.canvas_height);

            // This order scales around the translation point
            this.ctx.save();
            this.ctx.translate(this.docviewport_canvas_translation.x,this.docviewport_canvas_translation.y);
            this.ctx.scale(this.docviewport_scale,this.docviewport_scale);

            // Draw the document origin
            this._draw_circle(0,0,5,"red");

            // Inefficient sort
            this.$G.store.items.sort((a,b)=>{ return a.order-b.order; })

            // Draw the items
            for(let obj of this.$G.store.items){
                if("rect"==obj.shape){
                    const {x,y,w,h,color} = obj;
                    this._draw_rect(x,y,w,h,color);
                }
                else if("circle"==obj.shape){
                    const {cx,cy,r,color} = obj;
                    this._draw_circle(cx,cy,r,color);
                }
            }

            // Draw the pointer
            if(this.is_pointer_within){
                this._draw_circle(this.doc_pos.x,this.doc_pos.y,5,"green");
            }

            this.ctx.restore();
        }

    //-- Draw ------------------------------------//

        _draw_rect(x, y, w, h, color){
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.rect(x,y,w,h);
            this.ctx.fill();
            // Or just:
            // this.ctx.fillRect(x,y,w,h);
        }

        _draw_line(x0, y0, x1, y1, color, line_width=2){
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = line_width;
            this.ctx.beginPath();
            this.ctx.moveTo(x0, y0);
            this.ctx.lineTo(x1, y1);
            this.ctx.stroke();
        }

        _draw_circle(cx, cy, r, color){
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
            this.ctx.fill();
        }

}

