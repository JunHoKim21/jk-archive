import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "JK's Archive",
  tagline: '풀스택 엔지니어링 · AI 자동화 · 3D 인터랙티브 웹 지식 아카이브',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: false, // Windows 환경에서 Rspack CSS HMR 패닉 방지를 위해 기본 Webpack 사용
  },

  // Set the production url of your site here
  url: 'https://docs.jk-str.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'JunHoKim21', // Usually your GitHub org/user name.
  projectName: 'jk-archive', // Usually your repo name.
  trailingSlash: false, // 커스텀 도메인 사용 시 라우팅 404 오류 방지

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
      onBrokenMarkdownImages: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ko', // 한국어 사이트이므로 ko로 변경
    locales: ['ko'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/JunHoKim21/jk-archive/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true, // 사용자의 OS 다크/라이트 모드 자동 따라가기
    },
    navbar: {
      title: "JK's Archive",
      logo: {
        alt: 'JK Archive Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/docs/site/build-wiki',
          label: '사이트구축',
          position: 'left',
        },
        {
          to: '/docs/dev/myoyuwon-cat-onsen-devlog',
          label: '개발지식',
          position: 'left',
        },
        {
          to: '/docs/ai/overview',
          label: 'AI지식',
          position: 'left',
        },
        {
          to: '/docs/psychology/overview',
          label: '심리지식',
          position: 'left',
        },
        {
          to: '/docs/etc/overview',
          label: '기타지식',
          position: 'left',
        },
        {
          to: '/docs/site모음/overview',
          label: '사이트모음',
          position: 'left',
        },
        {
          href: 'https://github.com/JunHoKim21/jk-archive',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Links',
          items: [
            {
              label: '정보전달 블로그',
              href: 'https://etc.jk-str.com/',
            },
            {
              label: '고양이 온천 여관 (묘유원)',
              href: 'https://myoyuwon-cat-onsen.onrender.com',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/JunHoKim21/jk-archive',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} JK's Archive. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;