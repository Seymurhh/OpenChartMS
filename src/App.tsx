import { ChartView } from './views/ChartView';
import { TradeOff } from './views/TradeOff';
import { MultiConstraint } from './views/MultiConstraint';
import { HybridSynth } from './views/HybridSynth';
import { ProcessSelection } from './views/ProcessSelection';
import { EcoAudit } from './views/EcoAudit';
import { materials } from './data/loadMaterials';
import { useHashTab } from './lib/useHashTab';
import './App.css';

const TABS = ['charts', 'tradeoff', 'multi', 'hybrid', 'process', 'eco'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  charts: 'Material charts',
  tradeoff: 'Trade-off',
  multi: 'Multi-constraint',
  hybrid: 'Hybrid synth',
  process: 'Process',
  eco: 'Eco-Audit',
};

export function App() {
  const [tab, setTab] = useHashTab<Tab>('charts', TABS);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>OpenChartMS</h1>
          <p className="tagline">
            Open Ashby material-selection charts · {materials.length} materials
          </p>
          <p className="attribution">
            Method &amp; reference data from Ashby,{' '}
            <em>Materials Selection in Mechanical Design</em> (6e, 2025) ·{' '}
            <a
              href="https://github.com/Seymurhh/OpenChartMS#citation-and-licensing"
              target="_blank"
              rel="noreferrer"
            >
              cite &amp; license
            </a>
          </p>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={tab === t ? 'tab active' : 'tab'}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'charts' && <ChartView />}
      {tab === 'tradeoff' && <TradeOff />}
      {tab === 'multi' && <MultiConstraint />}
      {tab === 'hybrid' && <HybridSynth />}
      {tab === 'process' && <ProcessSelection />}
      {tab === 'eco' && <EcoAudit />}
    </div>
  );
}
