#!/usr/bin/env python3
"""Génère un dashboard HTML à partir des rapports Trivy JSON."""
import json, os, argparse
from datetime import datetime
from pathlib import Path

def load_reports(input_dir):
    reports = []
    d = Path(input_dir)
    if not d.exists():
        return reports
    for f in sorted(d.glob("trivy-*.json")):
        try:
            data = json.loads(f.read_text())
            service = f.stem.replace("trivy-", "")
            vulns = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
            details = []
            for result in data.get("Results", []):
                for v in result.get("Vulnerabilities", []):
                    sev = v.get("Severity", "UNKNOWN")
                    if sev in vulns:
                        vulns[sev] += 1
                    details.append({
                        "id": v.get("VulnerabilityID", ""),
                        "pkg": v.get("PkgName", ""),
                        "installed": v.get("InstalledVersion", ""),
                        "fixed": v.get("FixedVersion", "N/A"),
                        "severity": sev,
                        "title": v.get("Title", "")[:80],
                    })
            reports.append({"service": service, "vulns": vulns, "details": details})
        except Exception as e:
            print(f"⚠️  Erreur lecture {f}: {e}")
    return reports

def generate_html(reports, output):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    total_c = sum(r["vulns"]["CRITICAL"] for r in reports)
    total_h = sum(r["vulns"]["HIGH"] for r in reports)
    total_m = sum(r["vulns"]["MEDIUM"] for r in reports)

    rows = ""
    for r in reports:
        v = r["vulns"]
        rows += f"""<tr>
          <td><strong>{r['service']}</strong></td>
          <td style="color:#f85149">{v['CRITICAL']}</td>
          <td style="color:#e3b341">{v['HIGH']}</td>
          <td style="color:#d29922">{v['MEDIUM']}</td>
          <td style="color:#3fb950">{v['LOW']}</td>
        </tr>"""

    detail_sections = ""
    for r in reports:
        if not r["details"]:
            continue
        detail_rows = "".join(
            f"<tr><td>{d['id']}</td><td>{d['pkg']}</td>"
            f"<td>{d['installed']}</td><td>{d['fixed']}</td>"
            f"<td style='color:{'#f85149' if d['severity']=='CRITICAL' else '#e3b341' if d['severity']=='HIGH' else '#d29922'}'>"
            f"{d['severity']}</td><td>{d['title']}</td></tr>"
            for d in r["details"]
        )
        detail_sections += f"""
        <details>
          <summary>🔍 {r['service']} — {len(r['details'])} vulnérabilités</summary>
          <table>
            <tr><th>CVE</th><th>Package</th><th>Installé</th><th>Corrigé</th><th>Sévérité</th><th>Description</th></tr>
            {detail_rows}
          </table>
        </details>"""

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>🛡️ Security Dashboard</title>
<style>
body{{background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif;padding:24px;margin:0}}
h1{{font-size:1.8rem;margin-bottom:4px}} .sub{{color:#8b949e;margin-bottom:24px}}
table{{width:100%;border-collapse:collapse;margin-bottom:20px}}
th{{padding:10px;text-align:left;color:#8b949e;border-bottom:2px solid #30363d;background:#161b22}}
td{{padding:9px 10px;border-bottom:1px solid #21262d}}
tr:hover td{{background:rgba(255,255,255,.04)}}
.summary{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}}
.card{{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:20px;text-align:center}}
.card .n{{font-size:2.4rem;font-weight:700}} .card .l{{color:#8b949e;font-size:.85rem}}
details{{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:12px}}
summary{{cursor:pointer;font-weight:600;color:#58a6ff;padding:4px 0}}
</style></head>
<body>
<h1>🛡️ Security Dashboard — E-Learning</h1>
<p class="sub">Généré le {now} — {len(reports)} services scannés</p>
<div class="summary">
  <div class="card"><div class="n" style="color:#f85149">{total_c}</div><div class="l">🔴 Critical</div></div>
  <div class="card"><div class="n" style="color:#e3b341">{total_h}</div><div class="l">🟠 High</div></div>
  <div class="card"><div class="n" style="color:#d29922">{total_m}</div><div class="l">🟡 Medium</div></div>
</div>
<h2>Résumé par service</h2>
<table>
  <tr><th>Service</th><th>🔴 Critical</th><th>🟠 High</th><th>🟡 Medium</th><th>🟢 Low</th></tr>
  {rows}
</table>
<h2>Détails des vulnérabilités</h2>
{detail_sections if detail_sections else '<p style="color:#8b949e">Aucune vulnérabilité détectée.</p>'}
</body></html>"""

    Path(output).write_text(html)
    print(f"✅ Dashboard généré : {output}")
    print(f"   Critical={total_c}  High={total_h}  Medium={total_m}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="trivy-reports/")
    parser.add_argument("--output", default="security-dashboard.html")
    args = parser.parse_args()
    reports = load_reports(args.input_dir)
    generate_html(reports, args.output)
