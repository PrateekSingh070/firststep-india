"""Verify deterministic selection and summarize the recorded manual review.
This does not create ground-truth labels or re-run an LLM.
"""
import collections
import hashlib
import json
from pathlib import Path

data = json.loads((Path(__file__).parent / 'audit.json').read_text(encoding='utf-8'))
expected = sorted(
    data['population_ids'],
    key=lambda job_id: hashlib.sha256((data['seed'] + '|' + job_id).encode()).hexdigest()
)[:50]
assert expected == [row['id'] for row in data['rows']]
assert len(set(expected)) == 50
assert len(data['population_ids']) == data['population_size']
metrics = {
    name: dict(collections.Counter(row[name + '_verdict'] for row in data['rows']))
    for name in ['role', 'location', 'joint']
}
assert metrics == data['metrics']
print(json.dumps({'sample_verified': True, 'metrics': metrics}, indent=2))
