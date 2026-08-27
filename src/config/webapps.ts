export type WebAppRuntimeConfig = {
  name: string;
  id: string;
  deploymentId: string;
  url: string;
  purpose: string;
  token: string;
};

const SAFE_DEFAULTS = {
  PRIMARY_CONTENT: {
    name: 'Bible365 Canonical Content Gateway',
    id: 'PRIMARY_CONTENT_GATEWAY',
    deploymentId: 'SERVER_SIDE',
    url: '/api/bible365/engine',
    purpose: '본문/콘텐츠 same-origin gateway',
    token: '',
  },
  AUDIO_DELIVERY: {
    name: 'Bible365 Canonical Audio Gateway',
    id: 'AUDIO_DELIVERY_GATEWAY',
    deploymentId: 'SERVER_SIDE',
    url: '/api/bible365/engine',
    purpose: '오디오 포인터 포함 same-origin gateway',
    token: '',
  },
  AUDIO_PROXY: {
    name: 'Bible365 Audio Proxy',
    id: 'AUDIO_PROXY_API',
    deploymentId: 'SERVER_SIDE',
    url: '/api/bible365/audio',
    purpose: '오디오 재생 프록시',
    token: '',
  },
} as const;

export const getWebAppConfig = () => {
  // Never restore legacy browser-stored Apps Script URLs, deployment ids, or tokens.
  // Private runtime configuration is server-side only.
  return {
    PRIMARY_CONTENT: { ...SAFE_DEFAULTS.PRIMARY_CONTENT },
    AUDIO_DELIVERY: { ...SAFE_DEFAULTS.AUDIO_DELIVERY },
    AUDIO_PROXY: { ...SAFE_DEFAULTS.AUDIO_PROXY },
  };
};

export const WEBAPP_REGISTRY = getWebAppConfig();

export const saveWebAppConfig = (_newConfig: typeof WEBAPP_REGISTRY) => {
  // Compatibility no-op. Browser-side runtime credentials are intentionally disabled.
  localStorage.removeItem('webapp_config');
  localStorage.removeItem('webapp_config_time');
};
