export const getWebAppConfig = () => {
  const savedConfig = localStorage.getItem('webapp_config');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      // Ensure AUDIO_PROXY is always present even if old config was saved
      if (!parsed.AUDIO_PROXY) {
        parsed.AUDIO_PROXY = {
          name: 'Audio Proxy API',
          id: 'AUDIO_PROXY_API',
          deploymentId: 'N/A (Node.js Proxy)',
          url: '/api/audio-proxy',
          purpose: '프록시 전용',
          token: 'N/A'
        };
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse webapp_config', e);
    }
  }
  
  return {
    PRIMARY_CONTENT: {
      name: 'Primary Content WebApp',
      id: 'PRIMARY_CONTENT_WEBAPP',
      deploymentId: import.meta.env.VITE_PRIMARY_DEPLOYMENT_ID || 'AKfycbwx7sU5mEpCcEbGqx6122eclRauaOwZS28ig5LyjUcEZnfjD-I',
      url: import.meta.env.VITE_PRIMARY_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbwx7sU5mEpCcEbGqx6122eclRauaOwZS28ig5LyjUcEZnfjD-I/exec',
      purpose: '본문/콘텐츠 전용',
      token: import.meta.env.VITE_ACCESS_TOKEN || 'bible2026secret'
    },
    AUDIO_DELIVERY: {
      name: 'Audio Delivery WebApp',
      id: 'AUDIO_DELIVERY_WEBAPP',
      deploymentId: import.meta.env.VITE_AUDIO_DEPLOYMENT_ID || 'AKfycbwlsqwtVAm4DEU5ugDgleVKxOs2_HECqiOnbLTiLR74Pd25QzNITPjCaHr-llSrG-1Z',
      url: import.meta.env.VITE_AUDIO_WEBAPP_URL || import.meta.env.VITE_AUDIO_WEBAPP_BASE_URL || 'https://script.google.com/macros/s/AKfycbwlsqwtVAm4DEU5ugDgleVKxOs2_HECqiOnbLTiLR74Pd25QzNITPjCaHr-llSrG-1Z/exec',
      purpose: '오디오 송출 전용',
      token: import.meta.env.VITE_ACCESS_TOKEN || 'bible2026secret'
    },
    AUDIO_PROXY: {
      name: 'Audio Proxy API',
      id: 'AUDIO_PROXY_API',
      deploymentId: 'N/A (Node.js Proxy)',
      url: '/api/audio-proxy',
      purpose: '프록시 전용',
      token: 'N/A'
    }
  };
};

export const WEBAPP_REGISTRY = getWebAppConfig();

export const saveWebAppConfig = (newConfig: typeof WEBAPP_REGISTRY) => {
  localStorage.setItem('webapp_config', JSON.stringify(newConfig));
  Object.assign(WEBAPP_REGISTRY, newConfig);
};
