const canvas = document.querySelector("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

(async () => {
    // WebGPU's representation of the hardware
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No appropriate GPUAdapter found.");
    }

    // the interface for GPU interactions
    const device = await adapter.requestDevice();

    /** @type GPUCanvasContext */
    const ctx = canvas.getContext("webgpu");

    // GPU's preferred texture format (for data in memory)
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    // connect context with device interface and memory format
    ctx.configure({
        device,
        format: canvasFormat,
    });

    // encoder records GPU commands
    const encoder = device.createCommandEncoder();

    // drawing operations happens in render passes, let's begin a render pass
    const pass = encoder.beginRenderPass({
        // textures (called attachments) that receive output of drawing command
        colorAttachments: [
            {
                // the part of texture to render to, this selects whole current canvas
                view: ctx.getCurrentTexture().createView(),
                // load operation to clear the texture
                loadOp: "clear",
                // parameter specific to clear operation
                clearValue: { r: 0.3, g: 0.8, b: 1, a: 1 },
                // store operation to 'store' the results of drawing into the texture
                storeOp: "store",
            },
        ],
    });

    // // drawing a square, GPUs work with triangles
    // // data needs to be a typed array for size allocation
    const vertices = new Float32Array([
        // First triangle
        -0.8, -0.8, 0.8, -0.8, 0.8, 0.8,
        // second triangle with a common edge
        -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
    ]);

    // GPU memory requires GPUBuffer
    const vertexBuffer = device.createBuffer({
        // optional: for error messages
        label: "Cell vertices",
        // size allocation
        size: vertices.byteLength,
        // Use buffer as vertex and copy/write operation destination
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // write buffer - bufferObject, offset, data
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    // define structure of the buffer
    const vertexBufferLayout = {
        // Bytes to jump to move to next vertex, 2 dimensions * 4 bytes(float 32)
        arrayStride: 8,
        // specification of included attributes in the buffer
        attributes: [
            // position attribute
            {
                // https://gpuweb.github.io/gpuweb/#enumdef-gpuvertexformat
                format: "float32x2",
                // offset if your vertex has more than one attribute (like color/direction)
                offset: 0,
                // 0..15, unique id to link this to a particular input in vertex shader
                shaderLocation: 0,
            },
        ],
    };

    // shader module with code to run shader
    const cellShaderModule = device.createShaderModule({
        label: "Cell shader",
        // WGSL (WebGPU Shading Language) code
        code: /*rust*/ `
    	@vertex
    	fn vertexMain( @location(0) pos: vec2f ) -> @builtin(position) vec4f {
    		return vec4f(pos, 0, 1);
    	}

    	@fragment
    	fn fragmentMain() -> @location(0) vec4f {
    		return vec4f( 1,.8,.2,1 ); // rgba
    	}
    	`,
    });

    // add the shader to render pipeline
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: "auto",
        // Vertex shader description
        vertex: {
            module: cellShaderModule,
            entryPoint: "vertexMain", // fn in code
            buffers: [vertexBufferLayout],
        },
        // Fragment shader description
        fragment: {
            module: cellShaderModule,
            entryPoint: "fragmentMain", // fn in code
            targets: [
                {
                    format: canvasFormat,
                },
            ],
        },
    });

    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2);

    // end the render pass
    pass.end();

    // finish the encoder and pass it to the GPU
    device.queue.submit([encoder.finish()]);
})();
