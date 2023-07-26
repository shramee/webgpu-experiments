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

    // WebGPU stuff here

    /** @type GPUCanvasContext */
    const ctx = canvas.getContext("webgpu");

    // GPU's preferred texture format (for data in memory)
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    // Connect context with device interface and memory format
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

    // End the render pass
    pass.end();

    // Finish the encoder and pass it to the GPU
    device.queue.submit([encoder.finish()]);
})();
