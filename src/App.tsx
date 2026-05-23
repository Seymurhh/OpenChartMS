import { useState } from 'react';
import { ChartView } from './views/ChartView';
import { TradeOff } from './views/TradeOff';
import { MultiConstraint } from './views/MultiConstraint';
import { HybridSynth } from './views/HybridSynth';
import { ProcessSelection } from './views/ProcessSelection';
import { EcoAudit } from './views/EcoAudit';
import { materials } from './data/loadMaterials';
import { CORE_IDS } from './data/coreIds';
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
  const [coreOnly, setCoreOnly] = useState(false);
  const whitelist = coreOnly ? CORE_IDS : undefined;
  const matCount = coreOnly ? CORE_IDS.size : materials.length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>MatSel</h1>
          <p className="tagline">
            OpenChartMS · Open Ashby material-selection charts · {matCount} materials
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
        <div className="header-right">
          <div
            className="dataset-toggle"
            title="Teaching: 56 core Ashby Appendix A materials — clean envelopes for lectures. Extended: all 159 materials — for problem sets and exploration."
          >
            <button
              className={`dataset-btn${!coreOnly ? ' active' : ''}`}
              onClick={() => setCoreOnly(false)}
            >
              Extended <span className="dataset-count">159</span>
            </button>
            <button
              className={`dataset-btn${coreOnly ? ' active' : ''}`}
              onClick={() => setCoreOnly(true)}
            >
              Teaching <span className="dataset-count">56</span>
            </button>
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
        </div>
      </header>

      {tab === 'charts' && <ChartView whitelist={whitelist} />}
      {tab === 'tradeoff' && <TradeOff whitelist={whitelist} />}
      {tab === 'multi' && <MultiConstraint whitelist={whitelist} />}
      {tab === 'hybrid' && <HybridSynth whitelist={whitelist} />}
      {tab === 'process' && <ProcessSelection />}
      {tab === 'eco' && <EcoAudit whitelist={whitelist} />}

      <footer className="app-footer">
        <p>
          <strong>Educational use only — non-commercial.</strong>{' '}
          OpenChartMS is an open-source teaching tool developed for{' '}
          <strong>Harvard ES 192 (Materials Selection and Failure Analysis)</strong>.
          Property values are provided for instructional purposes and are{' '}
          <em>not</em> suitable for safety-critical engineering decisions.
          For production work use MMPDS, ASM Handbook, NIST WebBook, or
          manufacturer data sheets.
        </p>
        <p>
          <strong>Data sources &amp; attribution.</strong>{' '}
          Original corpus: Ashby, <em>Materials Selection in Mechanical Design</em> (6th ed., 2025) — Appendix A.{' '}
          Alloy grades: ASM Handbooks Vol. 1 &amp; 2.{' '}
          Ceramics &amp; glasses: ASM Engineered Materials Handbook Vol. 4.{' '}
          Eco properties: Bath ICE v3.0 (Univ. of Bath / BSRIA).{' '}
          Thermophysical data: CRC Handbook of Chemistry &amp; Physics.{' '}
          DFT elastic constants (Phase 3 materials):{' '}
          <a
            href="https://materialsproject.org"
            target="_blank"
            rel="noreferrer"
          >
            Materials Project
          </a>{' '}
          (Jain et al., <em>APL Materials</em> 1, 011002, 2013) — CC BY 4.0.
        </p>
        <p>
          <strong>No affiliation.</strong>{' '}
          OpenChartMS is an independent academic project. "Granta", "EduPack",
          and Ansys logos are trademarks of Ansys, Inc. This tool is not
          affiliated with or endorsed by Ansys, Elsevier, Cambridge University,
          or the Materials Project.{' '}
          Software: MIT licence.
        </p>
      </footer>
    </div>
  );
}
