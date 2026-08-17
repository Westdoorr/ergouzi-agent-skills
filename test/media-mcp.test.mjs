import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import {
  chmod,
  cp,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  apiJson,
  assertSafeDownloadUrl,
  callTool,
  cancelPrediction,
  credentialDiagnostics,
  createPrediction,
  downloadPrediction,
  fetchPinned,
  fetchOutput,
  getModelSchema,
  getPrediction,
  loadCredentials,
  mcpToolResult,
  resolveMediaInputs,
  toolDefinitions,
} from '../plugins/ergouzi-media-mcp/scripts/lib.mjs';

async function startServer(handler) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

async function readRequest(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  });
  response.end(body);
}

function credentials(baseUrl) {
  return { baseUrl, apiKey: 'test-media-key' };
}

test('media MCP exposes stable prediction and diagnostic tools', () => {
  assert.deepEqual(
    toolDefinitions().map((tool) => tool.name),
    [
      'list_models',
      'get_model_schema',
      'create_prediction',
      'get_prediction',
      'cancel_prediction',
      'download_prediction',
      'check_configuration',
    ],
  );
  for (const tool of toolDefinitions()) {
    assert.equal(tool.inputSchema.type, 'object');
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(tool.outputSchema.type, 'object');
  }
  const cancellation = toolDefinitions().find(
    (tool) => tool.name === 'cancel_prediction',
  );
  assert.match(cancellation.description, /explicit user confirmation/);
});

test('MCP tool results include structured content for successful objects', () => {
  const success = mcpToolResult({ task_id: 'task_result', status: 'starting' });
  assert.deepEqual(success.structuredContent, {
    task_id: 'task_result',
    status: 'starting',
  });
  assert.equal(success.isError, undefined);

  const failure = mcpToolResult('missing credentials', true);
  assert.equal(failure.structuredContent, undefined);
  assert.equal(failure.isError, true);
});

test('createPrediction converts documented local media and reuses an idempotency key', async () => {
  const seen = [];
  const api = await startServer(async (request, response) => {
    seen.push({
      authorization: request.headers.authorization,
      idempotencyKey: request.headers['idempotency-key'],
      path: request.url,
      body: await readRequest(request),
    });
    json(response, 201, { id: 'task_image', status: 'starting' });
  });
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'ergouzi-mcp-test-'));
  const imagePath = path.join(temporary, 'source.png');
  await writeFile(
    imagePath,
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );

  try {
    const prediction = await createPrediction(
      credentials(api.baseUrl),
      'ergouzi/e-image-edit',
      {
        prompt: 'Replace the background',
        images: [{ $local_file: imagePath }],
      },
      'logical-request-1',
    );

    assert.equal(prediction.id, 'task_image');
    assert.equal(seen.length, 1);
    assert.equal(seen[0].authorization, 'Bearer test-media-key');
    assert.equal(seen[0].idempotencyKey, 'logical-request-1');
    assert.equal(
      seen[0].path,
      '/customer/v1/models/ergouzi/e-image-edit/predictions',
    );
    assert.match(
      JSON.parse(seen[0].body).input.images[0],
      /^data:image\/png;base64,/,
    );
  } finally {
    await api.close();
  }
});

test('createPrediction converts a local e-video last frame image', async () => {
  let submitted;
  const api = await startServer(async (request, response) => {
    submitted = JSON.parse(await readRequest(request));
    json(response, 201, { id: 'task_video', status: 'starting' });
  });
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'ergouzi-mcp-test-'));
  const imagePath = path.join(temporary, 'last-frame.png');
  await writeFile(
    imagePath,
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );

  try {
    await createPrediction(
      credentials(api.baseUrl),
      'ergouzi/e-video',
      {
        prompt: 'Move from the first frame to the last frame',
        image: { $local_file: imagePath },
        last_frame_image: { $local_file: imagePath },
      },
      'video-last-frame',
    );

    assert.match(submitted.input.image, /^data:image\/png;base64,/);
    assert.match(submitted.input.last_frame_image, /^data:image\/png;base64,/);
  } finally {
    await api.close();
  }
});

test('every supported model accepts only its documented local media fields', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'ergouzi-mcp-media-'));
  const imagePath = path.join(temporary, 'source.png');
  const videoPath = path.join(temporary, 'source.mp4');
  const audioPath = path.join(temporary, 'source.mp3');
  const video = Buffer.alloc(16);
  video.write('ftyp', 4);

  await Promise.all([
    writeFile(
      imagePath,
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    writeFile(videoPath, video),
    writeFile(audioPath, Buffer.from([0xff, 0xfb, 0x90, 0x64])),
  ]);

  const localImage = { $local_file: imagePath };
  const localVideo = { $local_file: videoPath };
  const localAudio = { $local_file: audioPath };
  const cases = [
    ['ergouzi/e-image', { prompt: 'generate' }, []],
    [
      'ergouzi/e-image-edit',
      { prompt: 'edit', images: [localImage] },
      ['image/png'],
    ],
    ['ergouzi/e-image-ideogram', { prompt: 'lettering' }, []],
    [
      'ergouzi/e-image-try-on',
      {
        person_image: localImage,
        garment_images: [localImage],
        reference_pose: localImage,
      },
      ['image/png', 'image/png', 'image/png'],
    ],
    ['ergouzi/e-image-upscale', { image: localImage }, ['image/png']],
    ['ergouzi/e-rmbg', { image: localImage }, ['image/png']],
    [
      'ergouzi/e-video',
      {
        prompt: 'animate',
        image: localImage,
        last_frame_image: localImage,
        audio: localAudio,
      },
      ['image/png', 'image/png', 'audio/mpeg'],
    ],
    [
      'ergouzi/e-video-animate',
      { video: localVideo, image: localImage },
      ['video/mp4', 'image/png'],
    ],
    [
      'ergouzi/e-video-avatar',
      { image: localImage, audio: localAudio },
      ['image/png', 'audio/mpeg'],
    ],
    [
      'ergouzi/e-video-replace',
      { video: localVideo, images: [localImage] },
      ['video/mp4', 'image/png'],
    ],
  ];

  for (const [model, input, expectedTypes] of cases) {
    const resolved = await resolveMediaInputs(model, input);
    const encoded = JSON.stringify(resolved);
    for (const mediaType of expectedTypes)
      assert.match(encoded, new RegExp(`data:${mediaType};base64,`));
  }
});

test('createPrediction rejects local file placeholders in unknown model fields', async () => {
  await assert.rejects(
    createPrediction(
      credentials('https://ergouzi.life'),
      'ergouzi/future-model',
      { source: { $local_file: '/tmp/example.png' } },
    ),
    /documented media fields/,
  );

  await assert.rejects(
    resolveMediaInputs('ergouzi/e-image', {
      metadata: { $local_file: '/tmp/example.png', note: 'not a media field' },
    }),
    /documented media fields/,
  );
});

test('getModelSchema returns and caches the API input schema', async () => {
  let requests = 0;
  const api = await startServer((request, response) => {
    assert.equal(request.url, '/customer/v1/models/ergouzi/e-video');
    requests += 1;
    json(response, 200, {
      name: 'e-video',
      owner: 'ergouzi',
      description: 'Video generation',
      default_example: { input: { prompt: 'A mountain valley' } },
      latest_version: {
        id: 'version-1',
        cog_version: '0.17.2',
        created_at: '2026-08-16T00:00:00Z',
        openapi_schema: {
          components: {
            schemas: {
              Input: {
                type: 'object',
                required: ['prompt'],
                properties: { prompt: { type: 'string' } },
              },
              Output: { type: 'string', format: 'uri' },
            },
          },
        },
      },
    });
  });

  try {
    const client = credentials(api.baseUrl);
    const first = await getModelSchema(client, 'ergouzi/e-video');
    const second = await getModelSchema(client, 'ergouzi/e-video');
    const refreshed = await getModelSchema(client, 'ergouzi/e-video', {
      refresh: true,
    });
    assert.equal(first.model, 'ergouzi/e-video');
    assert.equal(first.input_schema.required[0], 'prompt');
    assert.equal(first.output_schema.format, 'uri');
    assert.deepEqual(second, first);
    assert.deepEqual(refreshed, first);
    assert.equal(requests, 2);
  } finally {
    await api.close();
  }
});

test('getModelSchema isolates cache entries between credential contexts', async () => {
  const authorizations = [];
  const api = await startServer((request, response) => {
    authorizations.push(request.headers.authorization);
    json(response, 200, {
      name: 'e-video',
      owner: 'ergouzi',
      latest_version: {
        id: 'version-cache-partition',
        openapi_schema: { components: { schemas: {} } },
      },
    });
  });

  try {
    const firstCredentials = {
      baseUrl: api.baseUrl,
      apiKey: 'first-media-key',
    };
    await getModelSchema(firstCredentials, 'ergouzi/e-video');
    await getModelSchema(firstCredentials, 'ergouzi/e-video');
    await getModelSchema(
      { baseUrl: api.baseUrl, apiKey: 'second-media-key' },
      'ergouzi/e-video',
    );

    assert.deepEqual(authorizations, [
      'Bearer first-media-key',
      'Bearer second-media-key',
    ]);
  } finally {
    await api.close();
  }
});

test('createPrediction retries a transient response with the same idempotency key', async () => {
  const keys = [];
  let attempts = 0;
  const api = await startServer(async (request, response) => {
    attempts += 1;
    keys.push(request.headers['idempotency-key']);
    await readRequest(request);
    if (attempts === 1) {
      json(response, 503, { error: 'temporary' });
      return;
    }
    json(response, 201, { id: 'task_retry', status: 'starting' });
  });
  try {
    const prediction = await createPrediction(
      credentials(api.baseUrl),
      'ergouzi/e-image',
      { prompt: 'retry safely' },
      'retry-key',
    );
    assert.equal(prediction.id, 'task_retry');
    assert.deepEqual(keys, ['retry-key', 'retry-key']);
  } finally {
    await api.close();
  }
});

test('API errors preserve validation details and rate-limit retry guidance', async () => {
  const api = await startServer((request, response) => {
    const status = Number(request.url.slice(1));
    const payloads = {
      401: { error: 'invalid media key' },
      403: { message: 'model access denied' },
      422: {
        detail: 'Input validation failed',
        invalid_fields: [{ field: 'input.prompt', type: 'invalid_type' }],
      },
      429: { title: 'Rate limit exceeded' },
      500: { error: { message: 'temporary upstream failure' } },
    };
    const body = JSON.stringify(payloads[status]);
    response.writeHead(status, {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body),
      ...(status === 429 ? { 'retry-after': '12' } : {}),
    });
    response.end(body);
  });

  try {
    const client = credentials(api.baseUrl);
    await assert.rejects(apiJson(client, 'GET', '/401'), /invalid media key/);
    await assert.rejects(apiJson(client, 'GET', '/403'), /model access denied/);
    await assert.rejects(apiJson(client, 'GET', '/422'), /input.prompt/);
    await assert.rejects(apiJson(client, 'GET', '/429'), /retry after 12/);
    await assert.rejects(
      apiJson(client, 'GET', '/500'),
      /temporary upstream failure/,
    );
  } finally {
    await api.close();
  }
});

test(
  'configuration diagnostics warn about permissive credential files',
  { skip: process.platform === 'win32' },
  async () => {
    const temporary = await mkdtemp(
      path.join(os.tmpdir(), 'ergouzi-mcp-config-'),
    );
    const configFile = path.join(temporary, 'credentials.json');
    await writeFile(
      configFile,
      JSON.stringify({
        api_key: 'test-media-key',
        base_url: 'https://ergouzi.life',
      }),
    );
    await chmod(configFile, 0o644);

    const client = await loadCredentials({
      env: { ERGOUZI_CONFIG_FILE: configFile, HOME: temporary },
      platform: 'darwin',
    });
    const diagnostics = await credentialDiagnostics(client, {
      platform: 'darwin',
    });
    assert.equal(diagnostics.credential_source, 'credentials_file');
    assert.equal(diagnostics.config_file_permissions, '0644');
    assert.match(diagnostics.warnings[0], /0600/);
  },
);

test('configuration diagnostics omit POSIX permissions on Windows', async () => {
  const diagnostics = await credentialDiagnostics(
    {
      baseUrl: 'https://ergouzi.life',
      configFile: 'C:\\Users\\example\\credentials.json',
      credentialSource: 'credentials_file',
    },
    { platform: 'win32' },
  );
  assert.equal(diagnostics.config_file_permissions, null);
  assert.deepEqual(diagnostics.warnings, []);
});

test('check_configuration verifies credentials without returning the API key', async () => {
  const api = await startServer((request, response) => {
    assert.equal(request.url, '/customer/v1/models');
    assert.equal(request.headers.authorization, 'Bearer test-media-key');
    json(response, 200, { results: [{ owner: 'ergouzi', name: 'e-image' }] });
  });
  try {
    const result = await callTool(
      'check_configuration',
      {},
      credentials(api.baseUrl),
    );
    assert.equal(result.api_access, 'verified');
    assert.equal(result.visible_model_count, 1);
    assert.equal(JSON.stringify(result).includes('test-media-key'), false);
  } finally {
    await api.close();
  }
});

test('prediction status, cancellation, and download preserve task lifecycle boundaries', async () => {
  const external = await startServer((request, response) => {
    assert.equal(request.headers.authorization, undefined);
    const body = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
    ]);
    response.writeHead(200, {
      'content-type': 'image/png',
      'content-length': body.length,
    });
    response.end(body);
  });
  let pollCount = 0;
  const api = await startServer((request, response) => {
    if (request.url === '/customer/v1/predictions/task_wait') {
      pollCount += 1;
      json(
        response,
        200,
        pollCount === 1
          ? { id: 'task_wait', status: 'processing' }
          : {
              id: 'task_wait',
              status: 'succeeded',
              output: '/customer/v1/assets/image',
            },
      );
      return;
    }
    if (request.url === '/customer/v1/predictions/task_download') {
      json(response, 200, {
        id: 'task_download',
        model: 'ergouzi/e-image',
        status: 'succeeded',
        output: '/customer/v1/assets/image',
      });
      return;
    }
    if (request.url === '/customer/v1/assets/image') {
      response.writeHead(302, { location: `${external.baseUrl}/image.png` });
      response.end();
      return;
    }
    if (request.url === '/customer/v1/predictions/task_cancel/cancel') {
      json(response, 200, { id: 'task_cancel', status: 'canceled' });
      return;
    }
    json(response, 404, { error: 'not found' });
  });
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'ergouzi-mcp-download-'),
  );
  const homeTemporary = await mkdtemp(
    path.join(os.homedir(), 'ergouzi-mcp-home-download-'),
  );

  try {
    const client = credentials(api.baseUrl);
    const waited = await getPrediction(client, 'task_wait', 1);
    assert.equal(waited.status, 'succeeded');
    assert.equal(pollCount, 2);
    assert.equal(
      (await cancelPrediction(client, 'task_cancel')).status,
      'canceled',
    );

    const downloaded = await downloadPrediction(
      client,
      'task_download',
      temporary,
    );
    assert.equal(downloaded.task_id, 'task_download');
    assert.equal(downloaded.files.length, 1);
    assert.equal(downloaded.downloads[0].bytes, 9);
    assert.equal(downloaded.downloads[0].media_type, 'image/png');
    assert.equal(
      await realpath(downloaded.files[0]),
      await realpath(path.join(temporary, 'result-1.png')),
    );
    assert.deepEqual(
      (await readFile(downloaded.files[0])).subarray(0, 8),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    assert.equal(
      JSON.parse(await readFile(downloaded.receipt, 'utf8')).task_id,
      'task_download',
    );

    const homeDownloaded = await downloadPrediction(
      client,
      'task_download',
      `~/${path.basename(homeTemporary)}`,
    );
    assert.equal(
      await realpath(homeDownloaded.files[0]),
      await realpath(path.join(homeTemporary, 'result-1.png')),
    );
  } finally {
    await api.close();
    await external.close();
    await rm(temporary, { recursive: true, force: true });
    await rm(homeTemporary, { recursive: true, force: true });
  }
});

test('prediction polling bounds each request by the remaining wait budget', async () => {
  let responseTimer;
  const api = await startServer((request, response) => {
    if (request.url === '/customer/v1/predictions/task_slow') {
      responseTimer = setTimeout(
        () => json(response, 200, { status: 'processing' }),
        1_500,
      );
      return;
    }
    json(response, 404, { error: 'not found' });
  });
  const started = Date.now();
  try {
    await assert.rejects(
      getPrediction(credentials(api.baseUrl), 'task_slow', 1),
      /timed out/,
    );
    assert.ok(Date.now() - started < 1_300);
  } finally {
    clearTimeout(responseTimer);
    await api.close();
  }
});

test('downloadPrediction accepts chunked media outputs without Content-Length', async () => {
  const body = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
  ]);
  const external = await startServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'image/png' });
    response.end(body);
  });
  const api = await startServer((request, response) => {
    if (request.url === '/customer/v1/predictions/task_chunked') {
      json(response, 200, {
        id: 'task_chunked',
        status: 'succeeded',
        output: `${external.baseUrl}/result.png`,
      });
      return;
    }
    json(response, 404, { error: 'not found' });
  });
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'ergouzi-mcp-chunked-output-'),
  );

  try {
    const downloaded = await downloadPrediction(
      credentials(api.baseUrl),
      'task_chunked',
      temporary,
    );
    assert.deepEqual(await readFile(downloaded.files[0]), body);
  } finally {
    await api.close();
    await external.close();
    await rm(temporary, { recursive: true, force: true });
  }
});

test('downloadPrediction rejects empty and invalid media outputs', async () => {
  const api = await startServer((request, response) => {
    if (request.url === '/customer/v1/predictions/task_no_outputs') {
      json(response, 200, {
        id: 'task_no_outputs',
        status: 'succeeded',
        output: [],
      });
      return;
    }
    if (request.url.startsWith('/customer/v1/predictions/')) {
      const taskId = request.url.split('/').at(-1);
      json(response, 200, {
        id: taskId,
        status: 'succeeded',
        output: `/customer/v1/assets/${taskId}`,
      });
      return;
    }
    if (request.url === '/customer/v1/assets/task_empty') {
      response.writeHead(200, {
        'content-type': 'image/png',
        'content-length': 0,
      });
      response.end();
      return;
    }
    if (request.url === '/customer/v1/assets/task_invalid') {
      const body = Buffer.from('not media');
      response.writeHead(200, {
        'content-type': 'image/png',
        'content-length': body.length,
      });
      response.end(body);
      return;
    }
    if (request.url === '/customer/v1/assets/task_html') {
      const body = Buffer.from('<html>not media</html>');
      response.writeHead(200, {
        'content-type': 'text/html',
        'content-length': body.length,
      });
      response.end(body);
      return;
    }
    json(response, 404, { error: 'not found' });
  });
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'ergouzi-mcp-invalid-output-'),
  );

  try {
    const client = credentials(api.baseUrl);
    await assert.rejects(
      downloadPrediction(client, 'task_no_outputs', temporary),
      /URL or an array of URLs/,
    );
    await assert.rejects(
      downloadPrediction(client, 'task_empty', temporary),
      /empty/,
    );
    await assert.rejects(
      downloadPrediction(client, 'task_invalid', temporary),
      /recognized media signature/,
    );
    await assert.rejects(
      downloadPrediction(client, 'task_html', temporary),
      /unsupported content type/,
    );
  } finally {
    await api.close();
  }
});

test('concurrent downloads publish unique outputs and receipts without overwriting', async () => {
  const body = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
  ]);
  const external = await startServer((_request, response) => {
    response.writeHead(200, {
      'content-type': 'image/png',
      'content-length': body.length,
    });
    response.flushHeaders();
    setTimeout(() => response.end(body), 25);
  });
  const api = await startServer((request, response) => {
    if (request.url === '/customer/v1/predictions/task_concurrent') {
      json(response, 200, {
        id: 'task_concurrent',
        status: 'succeeded',
        output: `${external.baseUrl}/result.png`,
      });
      return;
    }
    json(response, 404, { error: 'not found' });
  });
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'ergouzi-mcp-concurrent-download-'),
  );

  try {
    const client = credentials(api.baseUrl);
    const results = await Promise.all([
      downloadPrediction(client, 'task_concurrent', temporary),
      downloadPrediction(client, 'task_concurrent', temporary),
    ]);
    assert.equal(new Set(results.flatMap((result) => result.files)).size, 2);
    assert.equal(new Set(results.map((result) => result.receipt)).size, 2);
    for (const result of results) {
      assert.deepEqual(await readFile(result.files[0]), body);
      assert.equal(
        JSON.parse(await readFile(result.receipt, 'utf8')).task_id,
        'task_concurrent',
      );
    }
  } finally {
    await api.close();
    await external.close();
  }
});

test('download URL validation rejects public hostnames that resolve to private addresses', async () => {
  await assert.rejects(
    assertSafeDownloadUrl('https://media.example/result.png', {
      allowLocalHttp: false,
      lookup: async () => [{ address: '169.254.169.254', family: 4 }],
    }),
    /private or local address/,
  );
});

test('pinned downloads try each validated address', async () => {
  const body = Buffer.from('pinned output');
  const output = await startServer((_request, response) => {
    response.writeHead(200, { 'content-length': body.length });
    response.end(body);
  });
  try {
    const response = await fetchPinned(
      new URL(`${output.baseUrl}/result.png`),
      [
        { address: '::1', family: 6 },
        { address: '127.0.0.1', family: 4 },
      ],
    );
    assert.equal(response.status, 200);
    assert.deepEqual(
      Buffer.from(await new Response(response.body).arrayBuffer()),
      body,
    );
  } finally {
    await output.close();
  }
});

test('output downloads abort when the configured timeout expires', async () => {
  const neverResponds = (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener(
        'abort',
        () => reject(options.signal.reason),
        { once: true },
      );
    });

  await assert.rejects(
    fetchOutput(
      'https://media.example/result.png',
      credentials('https://ergouzi.life'),
      {
        fetchImpl: neverResponds,
        lookup: async () => [{ address: '93.184.216.34', family: 4 }],
        timeoutMs: 10,
      },
    ),
    /timed out/,
  );
});

test('bundled SDK server completes MCP initialization after the plugin is copied alone', async () => {
  const pluginPath = path.resolve('plugins/ergouzi-media-mcp');
  const manifest = JSON.parse(
    await readFile(
      path.join(pluginPath, '.codex-plugin', 'plugin.json'),
      'utf8',
    ),
  );
  const source = await readFile(
    path.resolve('scripts/media-mcp/server-entry.mjs'),
    'utf8',
  );
  assert.match(source, /@modelcontextprotocol\/sdk/);

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'ergouzi-plugin-'));
  const copiedPlugin = path.join(temporary, 'ergouzi-media-mcp');
  await cp(pluginPath, copiedPlugin, { recursive: true });
  const serverPath = path.join(copiedPlugin, 'scripts', 'server.mjs');
  const input = [
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    }),
    JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    }),
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
  ].join('\n');
  const result = spawnSync(process.execPath, [serverPath], {
    input: `${input}\n`,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const responses = result.stdout
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(responses[0].result.serverInfo.name, 'ergouzi-media-mcp');
  assert.equal(responses[0].result.serverInfo.version, manifest.version);
  assert.match(
    responses[0].result.instructions,
    /Before create_prediction or cancel_prediction, confirm/,
  );
  assert.equal(responses[1].id, 2);
  assert.deepEqual(
    responses[1].result.tools.map((tool) => tool.name),
    [
      'list_models',
      'get_model_schema',
      'create_prediction',
      'get_prediction',
      'cancel_prediction',
      'download_prediction',
      'check_configuration',
    ],
  );
  assert.ok(responses[1].result.tools.every((tool) => tool.outputSchema));
});
