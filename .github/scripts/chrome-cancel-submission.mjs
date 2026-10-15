import { assertion, client, configuration, PublishError } from './store-publish.mjs';
import { pathToFileURL } from 'node:url';

export async function cancelSubmission(config, expectedVersion, request, sleep = ms => new Promise(r => setTimeout(r, ms))) {
  if (!/^\d+(?:\.\d+){0,3}$/.test(expectedVersion || '')) throw new PublishError('Expected version required');
  const token = await request('Chrome authentication', 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: assertion(config.CHROME_SERVICE_ACCOUNT_JSON) }),
  });
  if (typeof token.access_token !== 'string' || !token.access_token || /[\r\n]/.test(token.access_token) || token.token_type?.toLowerCase() !== 'bearer') throw new PublishError('Chrome authentication: invalid token');
  const name = `publishers/${config.CHROME_PUBLISHER_ID}/items/${config.CHROME_EXTENSION_ID}`;
  const root = `https://chromewebstore.googleapis.com/v2/${name}`;
  const headers = { Authorization: `Bearer ${token.access_token}` };
  const read = async () => {
    const status = await request('Chrome review status', `${root}:fetchStatus`, { headers });
    if (status.name !== name || status.itemId !== config.CHROME_EXTENSION_ID) throw new PublishError('Chrome response item identity mismatch');
    return status.submittedItemRevisionStatus;
  };
  const pending = await read();
  const versions = (pending?.distributionChannels || []).map(c => c.crxVersion);
  console.log('Chrome review:', ['PENDING_REVIEW','CANCELLED','PUBLISHED','REJECTED'].includes(pending?.state) ? pending.state : 'no pending review', 'versions:', versions.filter(v=>/^\d+(?:\.\d+){0,3}$/.test(v)).join(',') || 'none');
  if (!pending || pending.state === 'CANCELLED') return 'No active submission to cancel';
  if (pending.state !== 'PENDING_REVIEW' || !versions.length || versions.some(v => v !== expectedVersion)) throw new PublishError('Review state/version differs from explicitly authorized cancellation; no change made');
  // Official cancelSubmission contract: POST with no request body; empty response.
  await request('Chrome cancel submission', `${root}:cancelSubmission`, { method:'POST', headers }, 200, false);
  for(let i=0;i<30;i++) {
    const after=await read();
    if(!after || after.state==='CANCELLED') return `Chrome ${expectedVersion}: cancellation verified`;
    if(after.state!=='PENDING_REVIEW') throw new PublishError('Unexpected post-cancellation state; inspect dashboard');
    await sleep(2000);
  }
  throw new PublishError('Cancellation accepted but still processing; inspect status before uploading');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { const config=configuration('chrome'); if(!config)throw new PublishError('Chrome publishing disabled'); console.log(await cancelSubmission(config,process.env.EXPECTED_VERSION,client())); }
  catch(e) { console.error(e instanceof PublishError ? e.message : 'Cancellation failed; details suppressed to protect credentials');process.exitCode=1; }
}
