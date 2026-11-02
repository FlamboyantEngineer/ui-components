import base from './playwright.config.js';
export default {
  ...base,
  projects: (base.projects ?? []).map((project) => ({
    ...project,
    use: { ...project.use, launchOptions: { executablePath: '/opt/pw-browsers/chromium' } },
  })),
};
