import React, { useState, useMemo } from 'react';
import { MarketDto } from '../../shared/dtos';
import { useTranslation } from '../../shared/i18n/I18nContext';
import {
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Search,
  X,
  ArrowUpDown,
  Radio,
  Flame,
  TrendingDown,
  Layers
} from 'lucide-react';

interface LivePriceTableProps {
  markets: Record<string, MarketDto>;
  tickFlashes: Record<string, 'up' | 'down'>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

type FilterCategory = 'ALL' | 'GAINERS' | 'LOSERS' | 'VOLUME';
type SortField = 'symbol' | 'price' | 'change24h' | 'volume24h';
type SortOrder = 'asc' | 'desc';

export const LivePriceTable: React.FC<LivePriceTableProps> = ({
  markets,
  tickFlashes,
  selectedSymbol,
  onSelectSymbol
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [category, setCategory] = useState<FilterCategory>('ALL');
  const [sortField, setSortField] = useState<SortField>('change24h');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const marketList = useMemo(() => Object.values(markets), [markets]);

  // Filtering & Search
  const filteredMarkets = useMemo(() => {
    let list = [...marketList];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => m.symbol.toLowerCase().includes(q));
    }

    // Category filter
    if (category === 'GAINERS') {
      list = list.filter(m => m.change24h > 0);
    } else if (category === 'LOSERS') {
      list = list.filter(m => m.change24h < 0);
    } else if (category === 'VOLUME') {
      list = list.sort((a, b) => b.volume24h - a.volume24h);
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortField === 'price') {
        comparison = a.price - b.price;
      } else if (sortField === 'change24h') {
        comparison = a.change24h - b.change24h;
      } else if (sortField === 'volume24h') {
        comparison = a.volume24h - b.volume24h;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [marketList, searchQuery, category, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      {/* Table Header with Search & Filters */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: 'var(--color-brand)' }} />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
              {t.markets}
            </h2>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--color-brand)'
            }}>
              {filteredMarkets.length} / {marketList.length}
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                top: '50%',
                insetInlineStart: '10px',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                padding: '6px 28px',
                paddingInlineStart: '30px',
                paddingInlineEnd: searchQuery ? '28px' : '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  top: '50%',
                  insetInlineEnd: '8px',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL' as const, label: t.filterAll, icon: Layers },
            { id: 'GAINERS' as const, label: t.filterGainers, icon: Flame },
            { id: 'LOSERS' as const, label: t.filterLosers, icon: TrendingDown },
            { id: 'VOLUME' as const, label: t.filterVolume, icon: Zap }
          ].map(f => {
            const Icon = f.icon;
            const isActive = category === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setCategory(f.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--color-brand)' : 'var(--border-color)',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={11} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Markets Table */}
      <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
        <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
          </colgroup>
          <thead>
            <tr>
              <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {t.symbol}
                  <ArrowUpDown size={11} opacity={sortField === 'symbol' ? 1 : 0.4} />
                </div>
              </th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {t.price}
                  <ArrowUpDown size={11} opacity={sortField === 'price' ? 1 : 0.4} />
                </div>
              </th>
              <th onClick={() => handleSort('change24h')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {t.change24h}
                  <ArrowUpDown size={11} opacity={sortField === 'change24h' ? 1 : 0.4} />
                </div>
              </th>
              <th>{t.high24h}</th>
              <th>{t.low24h}</th>
              <th onClick={() => handleSort('volume24h')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {t.volume}
                  <ArrowUpDown size={11} opacity={sortField === 'volume24h' ? 1 : 0.4} />
                </div>
              </th>
              <th>{t.source}</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarkets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {t.noMarketsMatch} &quot;{searchQuery}&quot;.
                </td>
              </tr>
            ) : (
              filteredMarkets.map(market => {
                const isSelected = market.symbol === selectedSymbol;
                const flash = tickFlashes[market.symbol];
                const isPositive = market.change24h >= 0;

                return (
                  <tr
                    key={market.symbol}
                    onClick={() => onSelectSymbol(market.symbol)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(59, 130, 246, 0.12)' : undefined,
                      borderInlineStart: isSelected ? '3px solid var(--color-brand)' : '3px solid transparent'
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                          {market.symbol}
                        </span>
                        {isSelected && (
                          <span style={{
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'var(--color-brand)',
                            color: '#fff',
                            letterSpacing: '0.04em'
                          }}>
                            {t.selected}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`font-mono ${flash === 'up' ? 'tick-flash-up text-up' : flash === 'down' ? 'tick-flash-down text-down' : ''}`}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          padding: '1px 4px',
                          borderRadius: '3px'
                        }}
                      >
                        ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${isPositive ? 'badge-up' : 'badge-down'}`} style={{ padding: '2px 6px', fontSize: '0.6875rem' }}>
                        {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {isPositive ? '+' : ''}{market.change24h.toFixed(2)}%
                      </span>
                    </td>

                    <td>
                      <span className="font-mono text-secondary" style={{ fontSize: '0.75rem' }}>
                        ${market.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td>
                      <span className="font-mono text-secondary" style={{ fontSize: '0.75rem' }}>
                        ${market.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td>
                      <span className="font-mono text-secondary" style={{ fontSize: '0.75rem' }}>
                        {(market.volume24h || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: market.source === 'BINANCE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: market.source === 'BINANCE' ? 'var(--color-up)' : 'var(--color-warning)',
                          border: `1px solid ${market.source === 'BINANCE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}
                      >
                        <Radio size={8} />
                        {market.source === 'BINANCE' ? 'BINANCE' : 'MOCK'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
