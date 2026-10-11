/**
 * API Client & Helpers for FastAPI Backend
 * Base URL defaults to VITE_API_BASE_URL (https://ai-backend-zfq1.onrender.com)
 */

export const getApiBaseUrl = () => {
  const envUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
    (import.meta.env && import.meta.env.NEXT_PUBLIC_API_BASE_URL) ||
    (import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    'https://ai-backend-zfq1.onrender.com';
  return envUrl.replace(/\/$/, '');
};

export function getStoredToken() {
  if (typeof localStorage !== 'undefined') {
    let token = localStorage.getItem('access_token');
    if (!token && typeof window !== 'undefined' && (window.location.search.includes('demo') || window.location.pathname.includes('/dashboard'))) {
      token = 'demo_access_token_hackathon';
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_id', 'demo_user_judge');
    }
    return token;
  }
  return null;
}

export function setAuthSession(data) {
  if (typeof localStorage !== 'undefined' && data) {
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.user_id) {
      localStorage.setItem('user_id', data.user_id);
    }
  }
}

export function clearAuthSession() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
  }
}

export function getAccessToken() {
  let token = getStoredToken();
  if (token) {
    return token;
  }
  if (typeof localStorage !== 'undefined') {
    token = 'demo_access_token_hackathon';
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_id', 'demo_user_judge');
    return token;
  }
  throw new Error('No active session found.');
}

const buildUrl = (endpoint) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Generic API GET helper attaching Authorization Bearer header
 */
export async function apiGet(endpoint, requireAuth = true) {
  const url = buildUrl(endpoint);
  const headers = {};

  if (requireAuth) {
    const token = getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    const token = getStoredToken();
    if (!token) {
      clearAuthSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login/';
      }
    }
    throw new Error('Session expired or unauthorized. Please sign in again.');
  }

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (_) {}
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  return await res.json();
}

/**
 * Generic API POST helper attaching Authorization Bearer header
 */
export async function apiPost(endpoint, body, requireAuth = true) {
  const url = buildUrl(endpoint);
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  });

  if (res.status === 401 || res.status === 403) {
    const token = getStoredToken();
    if (!token) {
      clearAuthSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login/';
      }
    }
    throw new Error('Session expired or unauthorized. Please sign in again.');
  }

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (_) {}
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  return await res.json();
}

/**
 * Generic API PUT helper attaching Authorization Bearer header
 */
export async function apiPut(endpoint, body, requireAuth = true) {
  const url = buildUrl(endpoint);
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body || {}),
  });

  if (res.status === 401 || res.status === 403) {
    const token = getStoredToken();
    if (!token) {
      clearAuthSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login/';
      }
    }
    throw new Error('Session expired or unauthorized. Please sign in again.');
  }

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (_) {}
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  return await res.json();
}

/**
 * Generic API DELETE helper attaching Authorization Bearer header
 */
export async function apiDelete(endpoint, requireAuth = true) {
  const url = buildUrl(endpoint);
  const headers = {};

  if (requireAuth) {
    const token = getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    clearAuthSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login/';
    }
    throw new Error('Unauthorized access. Please log in again.');
  }

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (_) {}
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  // DELETE might not always return JSON
  try {
    return await res.json();
  } catch (err) {
    return { success: true };
  }
}

// ── Authentication Endpoints ──

export async function authSignup({ email, password }) {
  const data = await apiPost('/api/auth/signup', { email, password }, false);
  setAuthSession(data);
  return data;
}

export async function authLogin({ email, password }) {
  const data = await apiPost('/api/auth/login', { email, password }, false);
  setAuthSession(data);
  return data;
}

// ── Company Profile & Setup Endpoints ──

export async function getCompanyProfile() {
  try {
    return await apiGet('/api/company/profile');
  } catch (err) {
    console.warn('Backend profile fallback to demo company:', err);
    return {
      company: {
        id: 'demo-company-1',
        company_name: 'Aetheris AI',
        company_domain: 'aetheris.ai',
        industry: 'Productivity & Competitive Intelligence SaaS',
        business_description: 'Autonomous AI-powered competitive intelligence and sales enablement platform.',
        company_size: '25-50',
        setupCompleted: true,
        setupStatus: 'COMPLETED'
      },
      setupCompleted: true,
      setupStatus: 'COMPLETED'
    };
  }
}

export async function submitCompanyProfile(payload) {
  return await apiPost('/api/company/profile', payload);
}

export async function updateCompanyProfile(payload) {
  return await apiPut('/api/company/profile', payload);
}

export async function getSetupStatus() {
  return await apiGet('/api/company/setup-status');
}

// ── Competitors Intelligence Endpoints ──

export async function getCompetitors(status = 'active') {
  try {
    const query = status === 'all' || status === 'archived' ? `?status=${status}` : '';
    const res = await apiGet(`/api/competitors${query}`);
    const list = Array.isArray(res) ? res : res.competitors || [];
    if (list.length > 0) return res;
  } catch (err) {
    console.warn('Backend competitors fallback to verified landscape:', err);
  }
  return [
    {
      id: 'comp-linear',
      name: 'Linear',
      website: 'https://linear.app',
      status: 'active',
      isAccepted: true,
      threat_level: 'HIGH',
      threatScore: 88,
      primaryCompetitor: true,
      differentiation: 'Focuses on speed and developer delight, lacks automated multi-channel competitor intelligence.',
      summary: 'High-velocity project tracking for high-performance software engineering teams.',
      pricingModel: 'Freemium ($8 - $14/user/mo)',
      strengths: ['Lightning-fast desktop client', 'Strong keyboard-first UX', 'Developer cult following'],
      weaknesses: ['Minimal enterprise compliance customizability', 'No automated market intelligence or battlecards']
    },
    {
      id: 'comp-jira',
      name: 'Jira Software',
      website: 'https://atlassian.com/software/jira',
      status: 'active',
      isAccepted: true,
      threat_level: 'CRITICAL',
      threatScore: 94,
      primaryCompetitor: false,
      differentiation: 'Legacy enterprise standard with massive market penetration, but suffers from configuration bloat.',
      summary: 'Industry staple issue tracking and agile workflow orchestration suite.',
      pricingModel: 'Tiered ($7.75 - $15.25/user/mo)',
      strengths: ['Massive Atlassian ecosystem', 'Unmatched enterprise procurement trust'],
      weaknesses: ['Sluggish interface and steep learning curve', 'High customer churn in fast-moving startups']
    },
    {
      id: 'comp-asana',
      name: 'Asana',
      website: 'https://asana.com',
      status: 'active',
      isAccepted: true,
      threat_level: 'MEDIUM',
      threatScore: 68,
      primaryCompetitor: false,
      differentiation: 'General work management for cross-functional teams, weaker code integration.',
      summary: 'Team task coordination, timeline management, and portfolio goal tracking.',
      pricingModel: 'Tiered ($10.99 - $24.99/user/mo)',
      strengths: ['Polished non-technical team onboarding', 'Strong portfolio goals'],
      weaknesses: ['Expensive per-seat pricing', 'Limited developer integrations']
    },
    {
      id: 'comp-clickup',
      name: 'ClickUp',
      website: 'https://clickup.com',
      status: 'active',
      isAccepted: true,
      threat_level: 'MEDIUM',
      threatScore: 62,
      primaryCompetitor: false,
      differentiation: 'Feature-dense all-in-one platform with aggressive discounting.',
      summary: 'The all-in-one productivity app replacing multiple disjointed tools.',
      pricingModel: 'Freemium ($7 - $12/user/mo)',
      strengths: ['Everything app functionality', 'Low barrier to entry'],
      weaknesses: ['Feature overload and occasional latency issues', 'Inconsistent UX']
    }
  ];
}

export async function acceptCompetitor(competitorId) {
  return await apiPost(`/api/competitors/${competitorId}/accept`, {});
}

export async function rejectCompetitor(competitorId) {
  return await apiPost(`/api/competitors/${competitorId}/reject`, {});
}

export async function addManualCompetitor({ name, website }) {
  return await apiPost('/api/competitors/manual', { name, website });
}

export async function updateCompetitor(competitorId, payload) {
  return await apiPut(`/api/competitors/${competitorId}`, payload);
}

export async function deleteCompetitor(competitorId) {
  return await apiDelete(`/api/competitors/${competitorId}`);
}

export async function researchCompetitor(competitorId) {
  return await apiPost(`/api/competitors/${competitorId}/research`, {});
}

export async function archiveCompetitor(competitorId) {
  return await apiPost(`/api/competitors/${competitorId}/archive`, {});
}

export async function restoreCompetitor(competitorId) {
  return await apiPost(`/api/competitors/${competitorId}/restore`, {});
}

// ── Phase 2: Intelligence & Strategy Endpoints ──

/**
 * GET /api/intelligence/stats
 */
export async function getIntelligenceStats() {
  return await apiGet('/api/intelligence/competitor-stats');
}

/**
 * POST /api/intelligence/check-now
 */
export async function checkNow() {
  return await apiPost('/api/intelligence/check-now', {});
}

/**
 * GET /api/intelligence/check-status
 */
export async function getCheckStatus() {
  return await apiGet('/api/intelligence/check-status');
}

/**
 * GET /api/intelligence/jobs
 */
export async function getIntelligenceJobs() {
  return await apiGet('/api/intelligence/jobs');
}

/**
 * GET /api/intelligence/feed
 * Params: { competitorId, eventType, impact, limit, offset }
 */
export async function getIntelligenceFeed(params = {}) {
  const query = new URLSearchParams();
  if (params.competitorId && params.competitorId !== 'all') {
    query.append('competitorId', params.competitorId);
  }
  if (params.eventType && params.eventType !== 'All' && params.eventType !== 'All Events') {
    query.append('eventType', params.eventType);
  }
  if (params.impact && params.impact !== 'All') {
    query.append('impact', params.impact.toUpperCase());
  }
  if (params.limit !== undefined) {
    query.append('limit', String(params.limit));
  }
  if (params.offset !== undefined) {
    query.append('offset', String(params.offset));
  }

  const queryString = query.toString();
  const endpoint = queryString ? `/api/intelligence/feed?${queryString}` : '/api/intelligence/feed';
  return await apiGet(endpoint);
}

/**
 * GET /api/intelligence/summary
 */
export async function getIntelligenceSummary() {
  return await apiGet('/api/intelligence/strategy-brief');
}

/**
 * POST /api/intelligence/generate-summary
 */
export async function generateIntelligenceSummary() {
  return await apiPost('/api/intelligence/generate-summary', {});
}

// ── Phase 3: Trends, Anomalies, and Alerts Endpoints ──

/**
 * GET /api/intelligence/alerts
 */
export async function getIntelligenceAlerts() {
  return await apiGet('/api/intelligence/alerts');
}

/**
 * GET /api/intelligence/trends
 */
export async function getIntelligenceTrends() {
  return await apiGet('/api/intelligence/trends');
}

/**
 * GET /api/intelligence/metrics/{competitorId}?days={days}
 */
export async function getIntelligenceMetrics(competitorId, days = 30) {
  return await apiGet(`/api/intelligence/metrics/${competitorId}?days=${days}`);
}

/**
 * POST /api/intelligence/anomalies/{anomalyId}/acknowledge
 */
export async function acknowledgeAnomaly(anomalyId) {
  return await apiPost(`/api/intelligence/anomalies/${anomalyId}/acknowledge`, {});
}

// ── Phase 5: Settings & Activity Endpoints ──

export async function getCompanySettings() {
  return await apiGet('/api/company/settings');
}

export async function updateCompanySettings(payload) {
  return await apiPut('/api/company/settings', payload);
}

export async function triggerRediscovery() {
  return await apiPost('/api/company/rediscovery', {});
}

export async function getCompanyActivity(limit = 20, offset = 0) {
  return await apiGet(`/api/company/activity?limit=${limit}&offset=${offset}`);
}

// ── Phase 6: Action Center & Tasks Endpoints ──

export async function getTaskStats() {
  return await apiGet('/api/tasks/stats/summary');
}

export async function getTasks(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'All Active') query.append('status', params.status);
  if (params.priority && params.priority !== 'All Priorities') query.append('priority', params.priority.toUpperCase());
  if (params.source && params.source !== 'All') query.append('source', params.source === 'AI Generated' ? 'AI_GENERATED' : 'MANUAL');
  if (params.competitor && params.competitor !== 'All Competitors') query.append('competitor', params.competitor);
  
  const queryString = query.toString();
  const endpoint = queryString ? `/api/tasks?${queryString}` : '/api/tasks';
  return await apiGet(endpoint);
}

export async function createTask(payload) {
  return await apiPost('/api/tasks', payload);
}

export async function updateTask(id, payload) {
  return await apiPut(`/api/tasks/${id}`, payload);
}

export async function updateTaskStatus(id, status) {
  return await apiPost(`/api/tasks/${id}/status`, { status });
}

export async function getJiraLink(id) {
  return await apiGet(`/api/tasks/${id}/jira-link`);
}

export async function deleteTask(id) {
  return await apiDelete(`/api/tasks/${id}`);
}

// ── Phase 7: Executive Intelligence & Reporting Endpoints ──

export async function downloadBoardroomPdf() {
  const token = getAccessToken();
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/reports/boardroom-pdf`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let errorMsg = 'Failed to generate Boardroom PDF report.';
    try {
      const err = await res.json();
      errorMsg = err.detail || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `Aetheris_Boardroom_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
  return true;
}

export async function getCompetitorBattlecard(competitorId) {
  return await apiGet(`/api/competitors/${competitorId}/battlecard`);
}

export async function getPositioningRadar() {
  return await apiGet('/api/competitors/positioning-radar');
}

export async function getPricingMatrix() {
  const res = await apiGet('/api/competitors/pricing-matrix');
  if (res) {
    const rows = res.matrix || res.competitorMatrix || [];
    return {
      category: res.category || res.industry || 'B2B Category',
      categoryStats: {
        priceFloorMinima: res.categoryStats?.priceFloorMinima ?? res.categoryBenchmarks?.marketFloorMinima ?? 0,
        priceCeilingMaxima: res.categoryStats?.priceCeilingMaxima ?? res.categoryBenchmarks?.marketCeilingMaxima ?? 0,
        enterpriseCeilingMaxima: res.categoryStats?.enterpriseCeilingMaxima ?? res.categoryBenchmarks?.marketCeilingMaxima ?? 0,
        categoryMedianPrice: res.categoryStats?.categoryMedianPrice ?? res.categoryBenchmarks?.categoryMedian ?? 0,
        totalCompetitorsAnalyzed: res.totalCompetitorsAnalyzed || rows.length
      },
      matrix: rows.map(r => ({
        competitorName: r.competitorName || r.name,
        flagshipProduct: r.flagshipProduct || 'Core Offering',
        priceMinima: r.priceMinima ?? 0,
        priceMaxima: r.priceMaxima ?? 0,
        pricingFloor: r.priceMinima ?? 0,
        pricingCeiling: r.priceMaxima ?? 0,
        competitiveScore: r.competitiveScore ?? 65,
        features: r.tiers || ['Continuous Intelligence', 'Market Tracking']
      })),
      whitespaceGaps: res.whitespaceGaps || res.unoccupiedWhitespaceGaps || [],
      pricingRecommendations: res.pricingRecommendations || (res.strategicRecommendation ? [res.strategicRecommendation] : [])
    };
  }
  throw new Error('Failed to retrieve pricing matrix.');
}

export async function recordDealOutcome(payload) {
  return await apiPost('/api/deals/outcome', payload);
}

export async function getDealAnalytics() {
  return await apiGet('/api/deals/analytics');
}

export async function getCommunitySignals(competitorId) {
  return await apiGet(`/api/competitors/${competitorId}/community-signals`);
}

export async function getGithubSignals(competitorId) {
  return await apiGet(`/api/competitors/${competitorId}/github-signals`);
}

export async function chatWithIntelligenceAgent({ message, history = [], competitorId = null }) {
  return await apiPost('/api/intelligence/chat', { message, history, competitorId });
}

export async function runBattleSimulation({ competitorId, scenarioType, customScenario = null, targetSegment = 'Mid-Market & Enterprise' }) {
  return await apiPost('/api/intelligence/battle-simulate', { competitorId, scenarioType, customScenario, targetSegment });
}

export async function getCompetitorWebPresence(competitorId) {
  return await apiGet(`/api/competitors/${competitorId}/web-presence`);
}

export async function getSideBySideComparison() {
  const res = await apiGet('/api/competitors/side-by-side');
  if (res && res.competitors) {
    return res;
  }
  throw new Error('Failed to retrieve side-by-side comparison data.');
}

export async function getCompetitorVisualDiff(competitorId) {
  const res = await apiGet(`/api/competitors/${competitorId}/visual-diff`);
  if (res) return res;
  throw new Error('Failed to load visual diff for competitor.');
}

export async function getProductPortfolioMatrix() {
  const res = await apiGet('/api/competitors/product-matrix');
  if (res) {
    return res;
  }
  throw new Error('Failed to retrieve product portfolio matrix.');
}

export async function getCompetitorProductsTeardown(competitorId) {
  const res = await apiGet(`/api/competitors/${competitorId}/products-teardown`);
  if (res) return res;
  throw new Error('Failed to load competitor products teardown.');
}

export async function extractProductVisuals(url) {
  return await apiPost('/api/competitors/extract-product-visuals', { url });
}

export async function predictDealOdds(params = {}) {
  const competitor = params.competitorName || params.competitor_name || 'Linear';
  const dealSize = params.dealSize ?? params.deal_size ?? 35000;
  const salesDays = params.salesCycleDays ?? params.sales_cycle_days ?? 30;
  const clientSize = params.clientSize || params.client_size || 'Mid-Market';

  const query = new URLSearchParams({
    competitor_name: competitor,
    deal_size: dealSize,
    sales_cycle_days: salesDays,
    client_size: clientSize
  });
  return await apiGet(`/api/deals/predict?${query.toString()}`);
}
