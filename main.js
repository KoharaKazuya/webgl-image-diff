import { diff, resize } from "./webgl.js";

const state = { threhold: 0.1 };

function init(id) {
  state[id] = {};

  const input = document.querySelector(`input[name="${id}"]`);
  const canvas = (state[id].canvas = document.querySelector(`canvas#${id}`));

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    if (state[id].url) URL.revokeObjectURL(state[id].url);
    const url = (state.url = URL.createObjectURL(file));

    const img = new Image();
    img.onload = () => {
      let width = 32,
        height = 32;
      for (; width < img.naturalWidth; width *= 2) {}
      for (; height < img.naturalHeight; height *= 2) {}
      canvas.width = state[id].width = width;
      canvas.height = state[id].height = height;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      resizeGlCanvas();
      render();
    };
    img.src = url;
  });
}

init("source");
init("dist");

const threshold = document.querySelector('input[name="threshold"]');
threshold.value = state.threhold;
threshold.addEventListener("input", () => {
  state.threhold = Number(threshold.value);
  render();
});

function render() {
  diff(state.source.canvas, state.dist.canvas, state.threhold);
}

function resizeGlCanvas() {
  const width = Math.max(state.source.width, state.dist.width);
  const height = Math.max(state.source.height, state.dist.height);
  resize(width, height);
}
