"""
Competitive Knowledge Graph Service for Atheris.

Transforms unstructured scraped competitor data (from Scrapling + Jina AI)
into an Enterprise Graph Database schema (Nodes & Edges / Cypher):
  - Nodes: Company, Product, Feature, PricingTier, MarketSegment, Integration
  - Edges: OFFERS, HAS_FEATURE, HAS_TIER, GATES_FEATURE, TARGETS, INTEGRATES_WITH, COMPETES_WITH

Compatible with Neo4j, Memgraph, AWS Neptune, and D3.js/Cytoscape force-directed graph visuals.
"""

import hashlib
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from database import (
    get_company_profile_by_id,
    get_competitors_for_company,
)
from positioning_engine import PositioningEngine
from snapshot_service import SnapshotService

logger = logging.getLogger(__name__)


class KnowledgeGraphService:
    """Orchestrates Competitive Knowledge Graph construction, Cypher generation, and graph analytics."""

    @staticmethod
    def _slugify(text: str) -> str:
        """Create a clean, stable ID from text."""
        cleaned = re.sub(r"[^\w\s-]", "", str(text or "").lower()).strip()
        return re.sub(r"[-\s]+", "_", cleaned) or "node"

    @classmethod
    def build_landscape_graph(cls, company_id: str) -> Dict[str, Any]:
        """
        Builds the entire competitive ecosystem knowledge graph:
        - Our Company Node
        - All Competitor Nodes
        - Product Nodes & Flagship bindings
        - Feature Nodes & Paywall gating
        - Pricing Tier Nodes
        - Integration Nodes
        - COMPETES_WITH edges with mathematical threat weights
        """
        company = get_company_profile_by_id(company_id) or {}
        competitors = get_competitors_for_company(company_id, status="active", accepted="true") or []
        radar = PositioningEngine.get_positioning_radar(company_id)

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []
        node_ids: set = set()
        edge_ids: set = set()

        def _add_node(node_id: str, label: str, name: str, props: Dict[str, Any] = None):
            if node_id not in node_ids:
                node_ids.add(node_id)
                nodes.append({
                    "id": node_id,
                    "label": label,
                    "name": name,
                    "properties": props or {}
                })

        def _add_edge(source_id: str, target_id: str, relation: str, weight: float = 1.0, props: Dict[str, Any] = None):
            edge_id = f"{source_id}->{relation}->{target_id}"
            if edge_id not in edge_ids:
                edge_ids.add(edge_id)
                edges.append({
                    "id": edge_id,
                    "source": source_id,
                    "target": target_id,
                    "relation": relation,
                    "weight": round(weight, 2),
                    "properties": props or {}
                })

        # -------------------------------------------------------------
        # 1. OUR COMPANY NODE
        # -------------------------------------------------------------
        our_name = company.get("name") or "Our Company"
        our_id = f"company_{cls._slugify(our_name)}"
        our_coords = radar.get("ourCompany", {})
        _add_node(our_id, "Company", our_name, {
            "isHomeTeam": True,
            "domain": company.get("website_url") or "",
            "market_tier_x": our_coords.get("x", 45.0),
            "product_scope_y": our_coords.get("y", 45.0),
            "quadrant": our_coords.get("quadrant", "BALANCED_COMPETITOR")
        })

        # Our Flagship Product
        our_prod_name = company.get("core_product") or f"{our_name} Core"
        our_prod_id = f"product_{cls._slugify(our_prod_name)}"
        _add_node(our_prod_id, "Product", our_prod_name, {
            "is_flagship": True,
            "category": company.get("industry") or "SaaS"
        })
        _add_edge(our_id, our_prod_id, "OFFERS", weight=1.0)

        # -------------------------------------------------------------
        # 2. COMPETITOR NODES & GRAPH ENTITIES
        # -------------------------------------------------------------
        radar_nodes_map = {n.get("id"): n for n in radar.get("competitors", [])}

        for comp in competitors:
            comp_id_str = str(comp.get("id"))
            comp_name = comp.get("name") or "Competitor"
            c_slug = f"company_{cls._slugify(comp_name)}"
            c_radar = radar_nodes_map.get(comp_id_str, {})

            # Company Node
            _add_node(c_slug, "Company", comp_name, {
                "isHomeTeam": False,
                "domain": comp.get("website_url") or "",
                "type": comp.get("type", "DIRECT"),
                "competitive_score": comp.get("competitive_score", 50),
                "market_tier_x": c_radar.get("x", 50.0),
                "product_scope_y": c_radar.get("y", 50.0),
                "quadrant": c_radar.get("quadrant", "DISRUPTIVE_CHALLENGER")
            })

            # Edge: COMPETES_WITH (Our Company <-> Competitor)
            dist_to_us = c_radar.get("distanceToUs", 35.0)
            threat_severity = c_radar.get("threatLevel", "MODERATE")
            _add_edge(our_id, c_slug, "COMPETES_WITH", weight=max(0.1, round(100.0 - dist_to_us, 1)), props={
                "euclidean_distance": dist_to_us,
                "threat_level": threat_severity,
                "overlap_score": comp.get("competitive_score", 50)
            })

            # Snapshots for Product, Pricing, Features
            snapshots = SnapshotService.get_snapshots_for_competitor(comp_id_str)
            latest = snapshots[-1] if snapshots else {}

            # Product Node
            flagship_name = latest.get("flagship_product") or f"{comp_name} Platform"
            prod_id = f"product_{cls._slugify(comp_name)}_{cls._slugify(flagship_name)}"
            _add_node(prod_id, "Product", flagship_name, {
                "is_flagship": True,
                "price_floor": latest.get("price_minima"),
                "price_ceiling": latest.get("price_maxima")
            })
            _add_edge(c_slug, prod_id, "OFFERS", weight=1.0)

            # Pricing Tier Nodes
            tier_names = latest.get("pricing_tiers") or ["Starter", "Professional", "Enterprise"]
            if isinstance(tier_names, list):
                for idx, t_name in enumerate(tier_names[:4]):
                    tier_slug = f"tier_{cls._slugify(comp_name)}_{cls._slugify(t_name)}"
                    is_free = bool("free" in str(t_name).lower() or idx == 0 and latest.get("price_minima") == 0)
                    _add_node(tier_slug, "PricingTier", str(t_name), {
                        "is_free": is_free,
                        "tier_index": idx,
                        "competitor": comp_name
                    })
                    _add_edge(prod_id, tier_slug, "HAS_TIER", weight=0.8)

                    # Gated Feature Edge (e.g. Enterprise gates SSO/Audit)
                    if "enterprise" in str(t_name).lower():
                        sso_id = "feature_sso_saml_security"
                        _add_node(sso_id, "Feature", "SSO & SAML Security", {"category": "Compliance"})
                        _add_edge(tier_slug, sso_id, "GATES_FEATURE", weight=1.0)

            # Extracted Feature Nodes
            features_text = f"{comp.get('description', '')} {comp.get('notes', '')}"
            features_found = cls._extract_features_from_text(features_text)
            for f_name, f_cat in features_found:
                f_slug = f"feature_{cls._slugify(f_name)}"
                _add_node(f_slug, "Feature", f_name, {"category": f_cat})
                _add_edge(prod_id, f_slug, "HAS_FEATURE", weight=0.75)

            # Integrations
            integrations_found = cls._extract_integrations_from_text(features_text)
            for i_name in integrations_found:
                i_slug = f"integration_{cls._slugify(i_name)}"
                _add_node(i_slug, "Integration", i_name, {"ecosystem": "Developer/B2B"})
                _add_edge(prod_id, i_slug, "INTEGRATES_WITH", weight=0.6)

        # Generate Executable Neo4j Cypher Script
        cypher_script = cls._generate_cypher_script(nodes, edges)

        # Graph Metrics
        graph_stats = {
            "totalNodes": len(nodes),
            "totalEdges": len(edges),
            "nodeBreakdown": {
                "Company": sum(1 for n in nodes if n["label"] == "Company"),
                "Product": sum(1 for n in nodes if n["label"] == "Product"),
                "Feature": sum(1 for n in nodes if n["label"] == "Feature"),
                "PricingTier": sum(1 for n in nodes if n["label"] == "PricingTier"),
                "Integration": sum(1 for n in nodes if n["label"] == "Integration"),
            },
            "density": round((2.0 * len(edges)) / max(len(nodes) * (len(nodes) - 1), 1), 4)
        }

        return {
            "nodes": nodes,
            "edges": edges,
            "cypherQuery": cypher_script,
            "summary": graph_stats
        }

    @classmethod
    def extract_graph_from_scraped_dossier(cls, scraped_dossier: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses multi-page output from our In-House Scrapling/Jina scraper
        and turns it into structured Graph Nodes & Edges.
        """
        base_url = scraped_dossier.get("base_url", "https://competitor.com")
        domain = re.sub(r"^https?://(www\.)?", "", base_url).split("/")[0]
        comp_name = domain.split(".")[0].capitalize()

        c_slug = f"company_{cls._slugify(comp_name)}"
        nodes = [{
            "id": c_slug,
            "label": "Company",
            "name": comp_name,
            "properties": {"domain": domain, "url": base_url}
        }]
        edges = []

        sections = scraped_dossier.get("scraped_sections", {})
        all_text = " ".join([sec.get("content", "") for sec in sections.values() if isinstance(sec, dict)])

        # 1. Product Node
        prod_slug = f"product_{cls._slugify(comp_name)}_core"
        nodes.append({
            "id": prod_slug,
            "label": "Product",
            "name": f"{comp_name} Core Platform",
            "properties": {"is_flagship": True}
        })
        edges.append({
            "id": f"{c_slug}->OFFERS->{prod_slug}",
            "source": c_slug,
            "target": prod_slug,
            "relation": "OFFERS",
            "weight": 1.0
        })

        # 2. Extract Pricing Tiers from Pricing Section
        pricing_text = sections.get("PRICING", {}).get("content", "")
        pricing_tiers = cls._extract_pricing_tiers(pricing_text)
        for tier in pricing_tiers:
            t_slug = f"tier_{cls._slugify(comp_name)}_{cls._slugify(tier['name'])}"
            nodes.append({
                "id": t_slug,
                "label": "PricingTier",
                "name": tier["name"],
                "properties": {"price_monthly": tier.get("price"), "is_free": tier.get("is_free", False)}
            })
            edges.append({
                "id": f"{prod_slug}->HAS_TIER->{t_slug}",
                "source": prod_slug,
                "target": t_slug,
                "relation": "HAS_TIER",
                "weight": 0.85
            })

        # 3. Extract Features
        features = cls._extract_features_from_text(all_text)
        for f_name, f_cat in features:
            f_slug = f"feature_{cls._slugify(f_name)}"
            nodes.append({
                "id": f_slug,
                "label": "Feature",
                "name": f_name,
                "properties": {"category": f_cat}
            })
            edges.append({
                "id": f"{prod_slug}->HAS_FEATURE->{f_slug}",
                "source": prod_slug,
                "target": f_slug,
                "relation": "HAS_FEATURE",
                "weight": 0.75
            })

        # 4. Extract Integrations
        integrations = cls._extract_integrations_from_text(all_text)
        for i_name in integrations:
            i_slug = f"integration_{cls._slugify(i_name)}"
            nodes.append({
                "id": i_slug,
                "label": "Integration",
                "name": i_name,
                "properties": {"ecosystem": "Developer/Cloud"}
            })
            edges.append({
                "id": f"{prod_slug}->INTEGRATES_WITH->{i_slug}",
                "source": prod_slug,
                "target": i_slug,
                "relation": "INTEGRATES_WITH",
                "weight": 0.6
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "cypherQuery": cls._generate_cypher_script(nodes, edges),
            "summary": {
                "totalNodes": len(nodes),
                "totalEdges": len(edges)
            }
        }

    # -------------------------------------------------------------------------
    # NLP & HEURISTIC GRAPH ENTITY EXTRACTION
    # -------------------------------------------------------------------------
    @staticmethod
    def _extract_features_from_text(text: str) -> List[Tuple[str, str]]:
        """Identify key architectural features from text."""
        feature_library = [
            ("Real-Time Collaboration", "Collaboration", ["real-time", "collaborative", "multiplayer", "live editing"]),
            ("REST & GraphQL APIs", "Developer", ["graphql", "rest api", "webhooks", "sdk", "developer api"]),
            ("Automated Workflows", "Automation", ["automation", "automated workflows", "triggers", "auto-assign"]),
            ("Custom Dashboards", "Analytics", ["dashboards", "reporting", "charts", "metrics", "analytics"]),
            ("Single Sign-On (SSO)", "Security", ["sso", "saml", "okta", "single sign-on", "scim"]),
            ("Role-Based Access Control", "Security", ["rbac", "permissions", "roles", "access control", "audit log"]),
            ("AI Copilot / Summaries", "AI", ["ai", "copilot", "machine learning", "summaries", "llm"]),
            ("Audit Trail & Compliance", "Compliance", ["soc 2", "compliance", "audit logs", "gdpr", "hipaa"]),
            ("Git Sync & Issue Tracking", "Engineering", ["git sync", "pull requests", "github", "gitlab", "commits"]),
        ]
        text_lower = text.lower()
        found = []
        for name, cat, keywords in feature_library:
            if any(kw in text_lower for kw in keywords):
                found.append((name, cat))
        return found

    @staticmethod
    def _extract_integrations_from_text(text: str) -> List[str]:
        """Detect third-party integration partners."""
        known_partners = ["GitHub", "GitLab", "Slack", "Figma", "Jira", "Zendesk", "Salesforce", "Zapier", "Notion", "Discord", "Linear"]
        text_lower = text.lower()
        return [p for p in known_partners if re.search(rf"\b{p.lower()}\b", text_lower)]

    @staticmethod
    def _extract_pricing_tiers(text: str) -> List[Dict[str, Any]]:
        """Extract pricing tiers and costs from pricing text."""
        tiers = []
        tier_patterns = [
            (r"\bfree\b", "Free Tier", 0.0, True),
            (r"\b(starter|basic|essential)\b", "Starter Tier", 12.0, False),
            (r"\b(pro|professional|standard|growth)\b", "Pro Tier", 29.0, False),
            (r"\b(enterprise|ultimate|scale)\b", "Enterprise Tier", 99.0, False),
        ]
        text_lower = text.lower()
        for pat, default_name, default_price, is_free in tier_patterns:
            if re.search(pat, text_lower):
                # Search for dollar amounts near this tier
                price_match = re.search(rf"{pat}.*?\$([0-9]+)", text_lower, re.S)
                price = float(price_match.group(1)) if price_match else default_price
                tiers.append({
                    "name": default_name,
                    "price": price,
                    "is_free": is_free
                })
        if not tiers:
            tiers = [
                {"name": "Standard Tier", "price": 19.0, "is_free": False},
                {"name": "Enterprise Tier", "price": 99.0, "is_free": False}
            ]
        return tiers

    @staticmethod
    def _generate_cypher_script(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> str:
        """Generates standard Neo4j Cypher query to instantiate the entire graph."""
        lines = ["// --- ATHERIS COMPETITIVE KNOWLEDGE GRAPH (NEO4J / CYPHER) ---"]
        
        # Create Nodes
        for n in nodes:
            props_str = ", ".join([f"{k}: {json.dumps(v)}" for k, v in n.get("properties", {}).items() if v is not None])
            if props_str:
                props_str = f", {props_str}"
            lines.append(f"MERGE (n:{n['label']} {{id: '{n['id']}', name: {json.dumps(n['name'])}{props_str}}})")

        # Create Edges
        lines.append("\n// --- RELATIONSHIPS / EDGES ---")
        for e in edges:
            weight = e.get("weight", 1.0)
            lines.append(
                f"MATCH (s {{id: '{e['source']}'}}), (t {{id: '{e['target']}'}}) "
                f"MERGE (s)-[:{e['relation']} {{weight: {weight}}}]->(t)"
            )
        return ";\n".join(lines) + ";"
