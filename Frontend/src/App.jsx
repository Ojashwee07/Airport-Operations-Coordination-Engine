
import { useEffect, useState } from 'react'
import './App.css'
import { getFlights, analyzeFlight } from './services/researchApi'

const agents = [
  {
    name: 'Research Agent',
    detail: 'Flight information and research',
    status: 'Available',
    color: 'blue',
  },
  {
    name: 'Analysis Agent',
    detail: 'Assess operational impact',
    status: 'Planned',
    color: 'purple',
  },
  {
    name: 'Resource Agent',
    detail: 'Check gate and staff availability',
    status: 'Planned',
    color: 'amber',
  },
  {
    name: 'Planning Agent',
    detail: 'Generate alternative plans',
    status: 'Planned',
    color: 'cyan',
  },
  {
    name: 'Decision Agent',
    detail: 'Prepare final recommendation',
    status: 'Planned',
    color: 'green',
  },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [flights, setFlights] = useState([])
  const [selectedFlightId, setSelectedFlightId] = useState('DEMO205')
  const [analysis, setAnalysis] = useState(null)
  const [loadingFlights, setLoadingFlights] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState('')
  const [flightError, setFlightError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadFlights() {
      try {
        const data = await getFlights()

        if (!cancelled) {
          setFlights(data.flights || [])

          if (
            !(data.flights || []).some(
              (flight) => flight.flight_id === 'DEMO205',
            )
          ) {
            setSelectedFlightId(data.flights?.[0]?.flight_id || '')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFlightError(err.message || 'Unable to load flights.')
        }
      } finally {
        if (!cancelled) setLoadingFlights(false)
      }
    }

    loadFlights()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedFlight = flights.find(
    (flight) => flight.flight_id === selectedFlightId,
  )

  async function handleAnalyze() {
    if (!selectedFlight) {
      setError('Please select a flight first.')
      return
    }

    setLoadingAnalysis(true)
    setError('')
    setAnalysis(null)

    try {
      const result = await analyzeFlight({
        flight_id: selectedFlight.flight_id,
        origin: selectedFlight.origin,
        destination: selectedFlight.destination,
        scheduled_departure: selectedFlight.scheduled_departure,
        status: selectedFlight.status,
      })

      setAnalysis(result)
    } catch (err) {
      setError(err.message || 'Flight analysis failed.')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  function scrollToSection(event, sectionId) {
    event.preventDefault()
    setMenuOpen(false)
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const riskClass = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
    unknown: 'risk-unknown',
  }[(analysis?.risk_level || 'unknown').toLowerCase()] || 'risk-unknown'

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">✈</div>
          <div>
            <h2>AirportOps</h2>
            <p>Coordination Engine</p>
          </div>

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation">
          <a href="#overview" onClick={(e) => scrollToSection(e, 'overview')}>
            ▦ <span>Overview</span>
          </a>
          <a href="#agents" onClick={(e) => scrollToSection(e, 'agents')}>
            ◈ <span>AI Agent Monitoring</span>
          </a>
          <a href="#decisions" onClick={(e) => scrollToSection(e, 'decisions')}>
            ◇ <span>Decision Support</span>
          </a>
          <a href="#activity" onClick={(e) => scrollToSection(e, 'activity')}>
            ≡ <span>Activity Log</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot" />
          Development Environment
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / AI Operations</p>
            <h2>AI Agent Monitoring</h2>
          </div>

          <div className="system-status">
            <span className="online-dot" />
            {flightError ? 'API Connection Issue' : 'Research API'}
          </div>
        </header>

        <section className="welcome" id="overview">
          <div>
            <p className="eyebrow">AIRPORT OPERATIONS COORDINATION ENGINE</p>
            <h1>AI Decision Center</h1>
            <p className="welcome-text">
              Analyze flight information and review AI-generated findings.
            </p>
          </div>

          <div className="flight-badge">
            <span>✈</span>
            <div>
              <small>Selected Flight</small>
              <strong>{selectedFlightId || 'No flight selected'}</strong>
            </div>
          </div>
        </section>

        {flightError && (
          <div className="api-error" role="alert">
            <strong>Unable to load flights.</strong>
            <p>{flightError}</p>
            <button onClick={() => window.location.reload()}>
              Retry connection
            </button>
          </div>
        )}

        <section className="flight-selector-panel panel">
          <div className="section-heading">
            <div>
              <h2>Flight Research</h2>
              <p>Select a flight and request AI analysis.</p>
            </div>
            <span className="demo-tag">LIVE API REQUEST</span>
          </div>

          <label className="field-label" htmlFor="flight-select">
            Select Flight
          </label>

          <select
            id="flight-select"
            className="flight-select"
            value={selectedFlightId}
            onChange={(event) => {
              setSelectedFlightId(event.target.value)
              setAnalysis(null)
              setError('')
            }}
            disabled={loadingFlights || flights.length === 0}
          >
            {loadingFlights && <option value="">Loading flights...</option>}
            {!loadingFlights && flights.length === 0 && (
              <option value="">No flights available</option>
            )}
            {flights.map((flight) => (
              <option key={flight.flight_id} value={flight.flight_id}>
                {flight.flight_id} — {flight.origin} to {flight.destination}
              </option>
            ))}
          </select>

          {selectedFlight && (
            <div className="flight-details">
              <div>
                <small>Origin</small>
                <strong>{selectedFlight.origin}</strong>
              </div>
              <div>
                <small>Destination</small>
                <strong>{selectedFlight.destination}</strong>
              </div>
              <div>
                <small>Departure</small>
                <strong>{selectedFlight.scheduled_departure}</strong>
              </div>
              <div>
                <small>Flight Status</small>
                <strong>{selectedFlight.status}</strong>
              </div>
            </div>
          )}

          <button
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={!selectedFlight || loadingFlights || loadingAnalysis}
          >
            {loadingAnalysis ? 'Analyzing flight...' : '✦ Analyze Flight'}
          </button>

          {loadingAnalysis && (
            <p className="loading-message" role="status">
              The Research Agent is analyzing the flight. This may take a
              little while.
            </p>
          )}
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon blue-bg">◈</span>
            <p>Total Agents</p>
            <h2>05</h2>
            <small>Planned workflow stages</small>
          </div>

          <div className="stat-card">
            <span className="stat-icon green-bg">✓</span>
            <p>Research Agent</p>
            <h2>Ready</h2>
            <small>API endpoint available</small>
          </div>

          
          <div className="stat-card">
            <span className="stat-icon amber-bg">◷</span>
            <p>Analysis Status</p>
            <h2>
              {loadingAnalysis
                ? 'Running'
                : error
                  ? 'Error'
                  : analysis
                    ? 'Completed'
                    : 'Ready'}
            </h2>
            <small>Current browser session</small>
          </div>


          <div className="stat-card">
            <span className="stat-icon purple-bg">◇</span>
            <p>Human Review</p>
            <h2>{analysis?.human_approval_required ? 'Required' : 'Pending'}</h2>
            <small>Review before action</small>
          </div>
        </section>

        <section className="panel" id="agents">
          <div className="section-heading">
            <div>
              <h2>Agent Workflow</h2>
              <p>Research is available; later stages are planned.</p>
            </div>
            <span className="demo-tag">WORKFLOW STATUS</span>
          </div>

          <div className="agent-list">
            {agents.map((agent, index) => (
              <div className="agent-row" key={agent.name}>
                <div className={`agent-number ${agent.color}`}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="agent-info">
                  <strong>{agent.name}</strong>
                  <p>{agent.detail}</p>
                </div>
                <span className={`status status-${agent.color}`}>
                  {agent.status}
                </span>
              </div>
            ))}
          </div>

          <p className="notice">
            Only the Research Agent API has been tested in this workflow.
            The other agents are planned and do not execute yet.
          </p>
        </section>

        <section className="panel" id="activity">
          <div className="section-heading">
            <div>
              <h2>Agent Activity Log</h2>
              <p>Current session information</p>
            </div>
            <span className="demo-tag">SESSION STATUS</span>
          </div>

          <div className="activity-list">
            <div className="activity-row">
              <div className="activity-marker" />
              <div className="activity-info">
                <strong>Flight data connection</strong>
                <p>
                  {flightError
                    ? 'Unable to retrieve flight records.'
                    : loadingFlights
                      ? 'Loading flight records from the API.'
                      : `Loaded ${flights.length} flight records from the API.`}
                </p>
              </div>
              <div className="activity-meta">
                <small>{flightError ? 'Error' : loadingFlights ? 'Loading' : 'Ready'}</small>
              </div>
            </div>

            <div className="activity-row">
              <div className="activity-marker" />
              <div className="activity-info">
                <strong>Research Agent</strong>
                <p>
                  {loadingAnalysis
                    ? `Analyzing ${selectedFlightId}...`
                    : analysis
                      ? `Analysis returned for ${analysis.flight_id}.`
                      : 'Waiting for a flight analysis request.'}
                </p>
              </div>
              <div className="activity-meta">
                <small>
                  {loadingAnalysis ? 'Running' : analysis ? 'Completed' : 'Idle'}
                </small>
              </div>
            </div>
          </div>
          <p className="notice">
            This panel displays frontend session state, not a persistent
            backend audit log.
          </p>
        </section>

        <section className="decision-grid" id="decisions">
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Decision Support</h2>
                <p>Research Agent output</p>
              </div>
              {analysis && (
                <span className="demo-tag">ANALYSIS RECEIVED</span>
              )}
            </div>

            {error && (
              <div className="api-error" role="alert">
                <strong>Analysis failed</strong>
                <p>{error}</p>
                <small>
                  Check the Python API terminal and Gemini availability.
                </small>
              </div>
            )}

            {!analysis && !error && !loadingAnalysis && (
              <div className="empty-state">
                <div className="empty-icon">◇</div>
                <h3>No analysis loaded</h3>
                <p>
                  Select a flight above and click Analyze Flight to display
                  the Research Agent's actual response.
                </p>
              </div>
            )}

            {analysis && (
              <div className="analysis-result">
                <div className="analysis-field">
                  <small>Flight ID</small>
                  <strong>{analysis.flight_id}</strong>
                </div>

                <div className="analysis-field">
                  <small>Observed Status</small>
                  <strong>{analysis.observed_status}</strong>
                </div>

                <div className="analysis-field">
                  <small>Risk Level</small>
                  <span className={`risk-badge ${riskClass}`}>
                    {analysis.risk_level}
                  </span>
                </div>

                <div className="analysis-field">
                  <small>Reason</small>
                  <p>{analysis.reason}</p>
                </div>

                <div className="analysis-field">
                  <small>Recommended Action</small>
                  <p>{analysis.recommended_action}</p>
                </div>

                <div className="analysis-field">
                  <small>Missing Information</small>
                  {analysis.missing_information?.length > 0 ? (
                    <ul>
                      {analysis.missing_information.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No missing information reported.</p>
                  )}
                </div>

                <div className="approval-notice">
                  <strong>
                    {analysis.human_approval_required
                      ? 'Human approval required'
                      : 'No approval requirement reported'}
                  </strong>
                  <p>
                    Review the findings before taking any operational action.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Human Review</h2>
                <p>Operator decision panel</p>
              </div>
            </div>

            <div className="review-box">
              <span className="review-badge">Review required</span>
              <p>
                The Research Agent provides recommendations, not authorization
                to change real airport operations.
              </p>
              <button disabled>Approve recommendation</button>
              <button className="reject-button" disabled>
                Reject recommendation
              </button>
              <small>
                Decision handling has not been implemented.
              </small>
            </div>
          </div>
        </section>

        <footer className="page-footer">
          Airport Operations Coordination Engine · Frontend Module
        </footer>
      </main>
    </div>
  )
}

export default App
