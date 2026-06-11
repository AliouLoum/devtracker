export const aiConfig = {
  get apiKey() {
    return process.env.NVIDIA_API_KEY || '';
  },
  get apiUrl() {
    return process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1';
  },
  get defaultModel() {
    return process.env.NVIDIA_MODEL_DEFAULT || 'meta/llama-3.1-70b-instruct';
  },
  get codeModel() {
    return process.env.NVIDIA_MODEL_CODE || 'nvidia/llama-3.1-nemotron-70b-instruct';
  },
};
