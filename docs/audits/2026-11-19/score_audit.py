"""Verify the archived 50-post review; does not invent labels or query an LLM."""
import collections, csv, hashlib, json, math
from pathlib import Path

root=Path(__file__).parent
audit=json.loads((root/'audit.json').read_text(encoding='utf-8'))
rows=audit['rows']
assert audit['population_size']==len(set(audit['population_ids']))
expected=sorted(audit['population_ids'],key=lambda job_id:hashlib.sha256((audit['seed']+'|'+job_id).encode()).hexdigest())[:50]
assert len(rows)==len(set(r['id'] for r in rows))==50
assert expected==[row['id'] for row in rows]
decisions=json.loads((root/'reviewer-decisions-before-comparison.json').read_text(encoding='utf-8'))
for row, decision in zip(rows,decisions):
    assert [row['number'],row['reviewed_role'],row['reviewed_locations'],row['review_note']]==decision
    role='ambiguous' if decision[1] is None else 'correct' if decision[1]==row['published_role'] else 'wrong'
    location='ambiguous' if decision[2] is None else 'correct' if set(decision[2])==set(row['published_locations']) else 'wrong'
    if row['number'] in [14,31]:
        assert location=='wrong' and decision[2]==['Remote']
        assert 'Remote' in row['published_locations']
        location='normalization_mismatch'
    joint='wrong' if 'wrong' in [role,location] else 'ambiguous' if 'ambiguous' in [role,location] else 'normalization_mismatch' if location=='normalization_mismatch' else 'correct'
    assert [row['role_verdict'],row['location_verdict'],row['joint_verdict']]==[role,location,joint]
metrics={name:dict(collections.Counter(row[name+'_verdict'] for row in rows)) for name in ['role','location','joint']}
assert metrics==audit['metrics']
assert dict(collections.Counter(row['source'] for row in rows))==audit['source_counts']
with (root/'reviewed-posts.csv').open(encoding='utf-8-sig',newline='') as stream:
    exported=list(csv.DictReader(stream))
assert [row['id'] for row in exported]==expected
for row, exported_row in zip(rows,exported):
    for field in ['role_verdict','location_verdict','joint_verdict','review_note']:
        assert exported_row[field]==row[field]
cost=json.loads((root/'cost-estimate.json').read_text(encoding='utf-8'))
assert cost['actual_cost_per_1000'] is None
assert cost['input_tokens_per_1000']==cost['sample_payload_input_tokens']*20+cost['instruction_tokens_per_batch']*25
assert cost['visible_output_tokens_per_1000']==cost['sample_visible_output_tokens']*20
subtotal=(cost['input_tokens_per_1000']*cost['input_usd_per_million']+cost['visible_output_tokens_per_1000']*cost['output_usd_per_million'])/1e6
assert math.isclose(subtotal,cost['single_pass_usd_per_1000'])
def wilson(k,n=50,z=1.96):
    centre=(k/n+z*z/(2*n))/(1+z*z/n)
    margin=z*math.sqrt(k/n*(1-k/n)/n+z*z/(4*n*n))/(1+z*z/n)
    return [round(100*(centre-margin),1),round(100*(centre+margin),1)]
print(json.dumps({'sample_verified':True,'metrics':metrics,'wilson_95_percent':{name:wilson(counts.get('correct',0)) for name,counts in metrics.items()},'previous_sample_overlap':len(audit['overlap_with_previous_sample']),'existing_review_statuses':dict(collections.Counter(row['existing_review_status'] for row in rows)),'hypothetical_usd_per_1000':subtotal},indent=2))
