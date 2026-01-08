'use client';

import styled from '@emotion/styled';
import Link from 'next/link';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #fc4c02 0%, #ff6b35 100%);
  padding: 2rem;
`;

const Title = styled.h1`
  color: white;
  font-size: 3rem;
  margin: 0 0 1rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  margin: 0 0 3rem 0;
  text-align: center;
  max-width: 600px;
`;

const DemoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const DemoLink = styled(Link)`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  text-decoration: none;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s;
  text-align: center;
  min-width: 300px;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const ConnectButton = styled(Link)`
  background: white;
  color: #fc4c02;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }
`;

const SectionLabel = styled.h2`
  color: white;
  font-size: 1.5rem;
  margin: 2rem 0 1rem 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;

export default function Home() {
  return (
    <Container>
      <Title>Running Data</Title>
      <Subtitle>
        Data-driven running analysis and storytelling
      </Subtitle>
      
      <ConnectButton href="/api/auth/strava">
        Connect with Strava
      </ConnectButton>

      <DemoSection>
        <SectionLabel>Demos & Experiments</SectionLabel>
        <DemoLink href="/stats">
          📈 Weekly Stats
        </DemoLink>
        <DemoLink href="/explorer">
          🔎 Activity Explorer (Database)
        </DemoLink>
        <DemoLink href="/all-activities">
          📊 All Activities (Quick API Test)
        </DemoLink>
        <DemoLink href="/demo">
          🔬 Stream Data Visualizations
        </DemoLink>
        <DemoLink href="/data-inspector">
          🔍 Data Inspector (Raw JSON)
        </DemoLink>
        <DemoLink href="/download">
          💾 Download All Strava Data
        </DemoLink>
        <DemoLink href="/docs">
          📖 Architecture Documentation
        </DemoLink>
      </DemoSection>
    </Container>
  );
}
