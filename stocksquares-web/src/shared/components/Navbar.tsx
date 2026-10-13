import React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { ConnectionState } from '../realtime/types';
import { Activity, RotateCcw, Globe, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  connectionState: ConnectionState;
  onResetPortfolio: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  connectionState,
  onResetPortfolio,
  isResetting
}) => {
  const { t, language, toggleLanguage } = useTranslation();

  const isConnected = connectionState === 'Connected';

  return (
    <header className="glass-panel" style={{
      margin: '20px 24px 0 24px',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
        }}>
          <Activity size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              {t.appTitle}
            </h1>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.6875rem' }}>
              .NET 10 ENGINE
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Actions & Connection Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Connection status pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '9999px',
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? 'var(--color-up)' : 'var(--color-warning)',
            boxShadow: isConnected ? '0 0 8px var(--color-up)' : '0 0 8px var(--color-warning)'
          }} />
          <span style={{ color: isConnected ? 'var(--color-up)' : 'var(--color-warning)' }}>
            {isConnected ? t.connected : t.reconnecting}
          </span>
        </div>

        {/* Reset Virtual Portfolio */}
        <button
          className="btn btn-ghost"
          onClick={onResetPortfolio}
          disabled={isResetting}
          style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
          title={t.resetPortfolio}
        >
          <RotateCcw size={15} className={isResetting ? 'spin' : ''} />
          <span>{isResetting ? t.resetting : t.resetPortfolio}</span>
        </button>

        {/* Language Switcher */}
        <button
          className="btn btn-ghost"
          onClick={toggleLanguage}
          style={{ padding: '8px 14px', fontSize: '0.8125rem', fontWeight: 600 }}
        >
          <Globe size={15} />
          <span>{t.switchLanguage}</span>
        </button>
      </div>
    </header>
  );
};
