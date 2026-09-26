export function modelHref(model: string): string {
  if (model.startsWith("http://") || model.startsWith("https://")) {
    return model;
  }
  if (model.startsWith("hf:")) {
    return `https://huggingface.co/${model.slice(3)}`;
  }
  return `https://huggingface.co/${model}`;
}

export function modelLabel(model: string): string {
  if (model.startsWith("http://") || model.startsWith("https://")) {
    return model.replace(/^https?:\/\/huggingface\.co\//, "");
  }
  return model.replace(/^hf:/, "");
}
