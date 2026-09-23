import { getOptions, loadContractors } from './dataset';
import { requestSchema } from './schema';
import { matchAndRank } from './matching';
import { explain } from './explain';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
class BodyError extends Error { constructor(public status: number, message: string) { super(message); } }
async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) throw new BodyError(415, 'Отправьте JSON');
  if (Number(request.headers.get('content-length')) > 4096) throw new BodyError(413, 'Запрос слишком большой');
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError(400, 'Пустой запрос');
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) { await reader.cancel(); throw new BodyError(413, 'Запрос слишком большой'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (e) { if (e instanceof BodyError) throw e; throw new BodyError(400, 'Некорректный JSON'); }
  finally { reader.releaseLock(); }
}
export async function handleRecommend(request: Request): Promise<Response> {
  try {
    const raw = await readBody(request);
    let profiles;
    try { profiles = loadContractors(); }
    catch { return json({ error: { code: 'dataset_unavailable', message: 'Исходный каталог отсутствует или повреждён. Проверьте DATASET_PATH и запустите npm run validate:data.' } }, 503); }
    const parsed = requestSchema(getOptions(profiles)).safeParse(raw);
    if (!parsed.success) return json({ error: { code: 'invalid_request', message: 'Проверьте поля запроса', fields: parsed.error.flatten().fieldErrors } }, 400);
    return json(await explain(matchAndRank(profiles, parsed.data), parsed.data));
  } catch (e) {
    if (e instanceof BodyError) return json({ error: { code: 'invalid_body', message: e.message } }, e.status);
    return json({ error: { code: 'internal_error', message: 'Не удалось выполнить подбор. Попробуйте ещё раз.' } }, 500);
  }
}
