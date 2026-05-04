#!/bin/bash
# Run PageSpeed Insights across all pages, 3 runs each, best-of-3 scoring.
# Usage: ./scripts/lighthouse-audit.sh [API_KEY]
# Output: docs/performance-report.md (overwritten)

API_KEY="${1:-$PAGESPEED_API_KEY}"
if [ -z "$API_KEY" ]; then
  echo "Usage: ./scripts/lighthouse-audit.sh <API_KEY>"
  echo "Or set PAGESPEED_API_KEY env var"
  exit 1
fi

RUNS=3
SITES=("https://wheresreligion.org" "https://staging.wheresreligion.org")
PAGES=("/" "/map" "/login" "/wheres-religion" "/resources")
STRATEGIES=("desktop" "mobile")

OUTDIR=$(mktemp -d)
echo "Collecting data ($RUNS runs per page per strategy)..."
echo "Temp dir: $OUTDIR"
echo

total=$(( ${#SITES[@]} * ${#PAGES[@]} * ${#STRATEGIES[@]} * RUNS ))
current=0

for site in "${SITES[@]}"; do
  for page in "${PAGES[@]}"; do
    for strategy in "${STRATEGIES[@]}"; do
      for run in $(seq 1 $RUNS); do
        current=$((current + 1))
        label=$(echo "$site" | sed 's|https://||')
        printf "\r  [%d/%d] %s%s (%s, run %d)          " "$current" "$total" "$label" "$page" "$strategy" "$run"

        outfile="$OUTDIR/$(echo "${site}${page}_${strategy}_${run}" | sed 's|[:/]|_|g').json"
        curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${site}${page}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo&key=${API_KEY}" > "$outfile"
      done
    done
  done
done

echo
echo "Processing results..."

python3 -c "
import json, glob, os, sys
from collections import defaultdict

outdir = '$OUTDIR'
runs = $RUNS

# Parse all results
data = defaultdict(list)
for f in glob.glob(os.path.join(outdir, '*.json')):
    try:
        d = json.load(open(f))
        if 'error' in d:
            continue
        lr = d.get('lighthouseResult', {})
        url = lr.get('finalUrl', '')
        strategy = lr.get('configSettings', {}).get('formFactor', 'desktop')

        cats = lr.get('categories', {})
        audits = lr.get('audits', {})

        result = {
            'perf': cats.get('performance', {}).get('score', 0),
            'a11y': cats.get('accessibility', {}).get('score', 0),
            'bp': cats.get('best-practices', {}).get('score', 0),
            'seo': cats.get('seo', {}).get('score', 0),
        }

        for m in ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'interactive']:
            a = audits.get(m, {})
            result[m] = a.get('numericValue', None)

        result['total-byte-weight'] = audits.get('total-byte-weight', {}).get('numericValue', None)
        result['unused-javascript'] = audits.get('unused-javascript', {}).get('details', {}).get('overallSavingsBytes', None)

        # Normalize URL to page path
        for site in ['https://wheresreligion.org', 'https://staging.wheresreligion.org']:
            if url.startswith(site):
                page = url[len(site):].rstrip('/')
                if not page: page = '/'
                key = (site, page, strategy)
                data[key].append(result)
                break
    except:
        continue

# Best-of-N: take the run with highest performance score
def best_of(results):
    if not results:
        return None
    return max(results, key=lambda r: r.get('perf', 0))

def fmt_time(ms):
    if ms is None: return '--'
    if ms < 1000: return f'{int(ms)} ms'
    return f'{ms/1000:.1f}s'

def fmt_bytes(b):
    if b is None: return '--'
    return f'{int(b/1024):,} KiB'

def fmt_score(s):
    if s is None: return '--'
    return str(int(s * 100))

sites = ['https://wheresreligion.org', 'https://staging.wheresreligion.org']
site_labels = ['Production', 'Staging']
pages = ['/', '/map', '/login', '/wheres-religion', '/resources']
page_labels = ['Home', 'Map', 'Login', \"Where's Religion\", 'Resources']

# Print markdown report
print('# Performance Report: Production vs Staging')
print()
print('**Date**: $(date +%Y-%m-%d)')
print('**Tool**: Google PageSpeed Insights (Lighthouse, best of $RUNS runs)')
print('**Production**: wheresreligion.org (Next.js on Netlify)')
print('**Staging**: staging.wheresreligion.org (TanStack Start on Cloudflare Workers)')
print()
print('---')
print()

for strategy in ['desktop', 'mobile']:
    print(f'## {strategy.title()} Scores')
    print()

    # Category scores
    print('### Category Scores (0-100)')
    print()
    print('| Page | Site | Performance | Accessibility | Best Practices | SEO |')
    print('|------|------|:-----------:|:------------:|:--------------:|:---:|')
    for pi, page in enumerate(pages):
        for si, site in enumerate(sites):
            key = (site, page, strategy)
            r = best_of(data.get(key, []))
            label = f'**{page_labels[pi]}**' if si == 0 else ''
            site_label = site_labels[si]
            if r:
                perf = fmt_score(r['perf'])
                a11y = fmt_score(r['a11y'])
                bp = fmt_score(r['bp'])
                seo = fmt_score(r['seo'])
                print(f'| {label} | {site_label} | {perf} | {a11y} | {bp} | {seo} |')
            else:
                print(f'| {label} | {site_label} | Error | -- | -- | -- |')
    print()

    # Core Web Vitals
    print('### Core Web Vitals')
    print()
    print('| Page | Site | FCP | LCP | TBT | CLS | Speed Index | TTI |')
    print('|------|------|-----|-----|-----|-----|-------------|-----|')
    for pi, page in enumerate(pages):
        for si, site in enumerate(sites):
            key = (site, page, strategy)
            r = best_of(data.get(key, []))
            label = f'**{page_labels[pi]}**' if si == 0 else ''
            site_label = site_labels[si]
            if r:
                fcp = fmt_time(r.get('first-contentful-paint'))
                lcp = fmt_time(r.get('largest-contentful-paint'))
                tbt = fmt_time(r.get('total-blocking-time'))
                cls_val = r.get('cumulative-layout-shift')
                cls_str = f'{cls_val:.2f}' if cls_val is not None else '--'
                si_val = fmt_time(r.get('speed-index'))
                tti = fmt_time(r.get('interactive'))
                print(f'| {label} | {site_label} | {fcp} | {lcp} | {tbt} | {cls_str} | {si_val} | {tti} |')
            else:
                print(f'| {label} | {site_label} | -- | -- | -- | -- | -- | -- |')
    print()

    # Payload
    print('### Resource Usage')
    print()
    print('| Page | Site | Total Payload | Unused JS |')
    print('|------|------|---------------|-----------|')
    for pi, page in enumerate(pages):
        for si, site in enumerate(sites):
            key = (site, page, strategy)
            r = best_of(data.get(key, []))
            label = f'**{page_labels[pi]}**' if si == 0 else ''
            site_label = site_labels[si]
            if r:
                payload = fmt_bytes(r.get('total-byte-weight'))
                unused = fmt_bytes(r.get('unused-javascript'))
                print(f'| {label} | {site_label} | {payload} | {unused} |')
            else:
                print(f'| {label} | {site_label} | -- | -- |')
    print()
    print('---')
    print()

print('*Report generated via Google PageSpeed Insights API (Lighthouse). Best of $RUNS runs per page.*')
" > docs/performance-report.md

rm -rf "$OUTDIR"
echo "Written to docs/performance-report.md"
