import json,datetime,re
p='data/candidates.json';r=json.load(open(p,encoding='utf-8'))
groups={
'Software & IT':[33,39,81,82,83,146,154,158,162,171,174,196,197,199,202,206,236],
'Data & AI':[7,18,19,80,159,182,183,203],
'Design & Creative':[2,4,14,20,35,42,68,87,99,106,114,129,138,178,179,194,195,204,207,208,221,246,254,262,263,275,285,286,292,293,299,303,304,307],
'HR':[15,16,26,34,40,61,112,117,119,134,135,143,163,166,172,173,177,180,185,191,222,240,253,258,270,271,278,282],
'Finance':[45,67,130,255,290,309],
'Engineering':[21,24,62,85,111,276],
'Research & Science':[11,13,144],
'Legal':[260,281],
'Education':[63,155,211,232,233,291,295],
'Operations':[0,8,43,69,74,77,84,92,97,115,122,160,168,186,187,190,200,231,249,265,283,305,308,30],
'Sales & Business':[1,12,17,22,25,27,29,36,37,48,51,56,57,58,65,70,75,79,89,90,91,93,94,95,96,98,100,102,107,109,120,121,127,132,136,140,142,147,149,150,152,153,156,157,165,167,175,188,209,210,213,214,218,219,223,224,225,226,227,230,235,238,239,241,243,245,247,248,251,252,256,261,264,269,272,273,280,294,296,300,306],
'Marketing':[3,5,6,9,10,23,28,31,32,38,41,44,46,47,49,50,52,53,54,55,59,60,64,66,71,72,73,76,78,86,88,101,103,104,105,108,110,113,116,118,123,124,125,126,128,131,133,137,139,141,145,148,151,161,164,169,170,176,181,184,189,192,193,198,201,205,212,215,216,217,220,228,229,234,237,242,244,250,257,259,266,267,268,274,277,279,284,287,288,289,297,298,301,302]}
assigned={}
for role,ids in groups.items():
 for i in ids:
  assert i not in assigned,(i,role,assigned.get(i));assigned[i]=role
assert len(assigned)==len(r),set(range(len(r)))-set(assigned)
aliases={'Bangalore':'Bengaluru','Bangalore Urban':'Bengaluru','Bangalore Rural':'Bengaluru','Gurgaon':'Gurugram','Cochin':'Kochi','Central Delhi':'Delhi','South Delhi':'Delhi','East Delhi':'Delhi','New Delhi':'Delhi','Mumbai Suburban':'Mumbai','Parel':'Mumbai','Borivali':'Mumbai','Maharashta':None}
for i,x in enumerate(r):
 cities=['Remote'] if x['mode']=='wfh' else list(dict.fromkeys(aliases.get(c.strip(),c.strip()) for c in re.sub(r'\s*\(Hybrid\)','',x['location']).split(',') if aliases.get(c.strip(),c.strip()) and c.strip()!='India — unspecified'))
 if not cities:cities=['Unspecified']
 x.update(role=assigned[i],cities=cities,taggedBy='Codex LLM',taggedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
# stable key merges equivalent company/title/city across sources, tolerating legal suffixes and internship punctuation
seen=set();out=[]
for x in r:
 norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
 company=re.sub(r'\b(private|pvt|limited|ltd)\b','',x['company'],flags=re.I)
 title=re.sub(r'\b(internship|intern)\b','',x['title'],flags=re.I)
 key=norm(company)+'|'+norm(title)+'|'+','.join(sorted(x['cities']))
 if key in seen:continue
 seen.add(key);out.append(x)
snapshot={'jobs':out,'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'tagger':'Codex LLM','sources':[{'name':'Unstop','url':'https://unstop.com/internships','status':'ok','collected':260},{'name':'Internshala','url':'https://internshala.com/internships/','status':'ok','collected':50}],'duplicatesRemoved':len(r)-len(out),'collected':len(r),'runId':'initial'}
open('data/seed.json','w',encoding='utf-8').write(json.dumps(snapshot,ensure_ascii=False));print(len(out),'tagged, duplicates removed',len(r)-len(out))
