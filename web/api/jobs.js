const source = 'https://firststep-india-jobs.wigglyfern512.chatgpt.site/api/jobs';
export default async function handler(request, response) {
 response.setHeader('Cache-Control', 'no-store');
 if(request.method !== 'GET') {response.setHeader('Allow','GET');return response.status(405).json({error:'Method not allowed'});}
 try {
  const upstream=await fetch(source,{signal:AbortSignal.timeout(15000)});
  if(!upstream.ok)return response.status(502).json({error:'Job feed temporarily unavailable'});
  const data=await upstream.json();
  if(!Array.isArray(data.jobs)||typeof data.updatedAt!=='string')return response.status(502).json({error:'Invalid feed response'});
  return response.status(200).json(data);
 }catch{return response.status(502).json({error:'Could not reach the job feed. Please retry.'});}
}
