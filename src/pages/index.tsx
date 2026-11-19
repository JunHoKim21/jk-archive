import type {ReactNode} from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

import Link from '@docusaurus/Link';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/dev/myoyuwon-cat-onsen-devlog">
            개발 지식 & 프로젝트 회고
          </Link>
          <Link
            className="button button--outline button--light button--lg"
            to="/docs/ai/overview">
            AI & 에이전트 자동화
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="홈"
      description="풀스택 엔지니어링, AI 에이전트 자동화, Three.js 3D 웹 인터랙션 및 시스템 개발 아카이브">
      <HomepageHeader />
    </Layout>
  );
}
