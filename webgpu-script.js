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
})();
