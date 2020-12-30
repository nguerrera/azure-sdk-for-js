// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Context } from "mocha";
import * as dotenv from "dotenv";
import * as url from "url";

import { env, Recorder, isRecordMode, isPlaybackMode } from "@azure/test-utils-recorder";
import { ClientSecretCredential } from "@azure/identity";
import { DefaultHttpClient, isNode, WebResource, WebResourceLike } from "@azure/core-http";

import { SchemaRegistryClient, SchemaRegistryClientOptions } from "../../src/index";

if (isNode) {
  dotenv.config();
}

export interface RecordedClient {
  client: SchemaRegistryClient;
  recorder: Recorder;
}

const replaceableVariables: { [k: string]: string } = {
  AZURE_CLIENT_ID: "azure_client_id",
  AZURE_CLIENT_SECRET: "azure_client_secret",
  AZURE_TENANT_ID: "azure_tenant_id",
  SCHEMA_REGISTRY_ENDPOINT: "https://endpoint",
  SCHEMA_REGISTRY_GROUP: "group"
};

export const testEnv = new Proxy(replaceableVariables, {
  get: (target, key: string) => {
    return env[key] || target[key];
  }
});

//!! TODO: Hacky port of C# code as proof-of-concept
class RecordingHttpClient extends DefaultHttpClient implements Recorder {
  private static s_recordingServerUri = "https://localhost:5001";
  private static s_startPlaybackUri = RecordingHttpClient.s_recordingServerUri + "/playback/start";
  private static s_stopPlaybackUri = RecordingHttpClient.s_recordingServerUri + "/playback/stop";
  private static s_startRecordUri = RecordingHttpClient.s_recordingServerUri + "/record/start";
  private static s_stopRecordUri = RecordingHttpClient.s_recordingServerUri + "/record/stop";
  
  private _httpClient: DefaultHttpClient;
  private _recordingId?: string;
  private _sessionFile: string;
  private _startUri: string;
  private _stopUri: string;
  private _mode: string;

  constructor(sessionFile: string, playback: boolean) {
    super();
    this._sessionFile = sessionFile;
    this._startUri = playback ? RecordingHttpClient.s_startPlaybackUri : RecordingHttpClient.s_startRecordUri;
    this._stopUri = playback ? RecordingHttpClient.s_stopPlaybackUri : RecordingHttpClient.s_stopRecordUri;
    this._mode = playback ? "playback" : "record";
    this._httpClient = new DefaultHttpClient();
  }

  //!!HACK
  skip(_runtime?: 'node' | 'browser', _reason?: string): void {
    throw new Error('Method not implemented.');
  }
  getUniqueName!: (prefix: string, label?: string | undefined) => string;
  newDate!: (label: string) => Date;

  async prepareRequest(request: WebResourceLike): Promise<Partial<RequestInit>> {
    await this.start();
    
    if (!request.headers.contains("x-recording-id")) {
      request.headers.set("x-recording-id", this._recordingId!);
      request.headers.set("x-recording-mode", this._mode);
      const upstreamUrl = url.parse(request.url);
      const redirectedUrl = { ...upstreamUrl, host: "localhost:5001" };
      upstreamUrl.path = undefined;
      request.headers.set("x-recording-upstream-base-uri", url.format(upstreamUrl));
      request.url = url.format(redirectedUrl);
    }

    return await super.prepareRequest(request);
  }

  async start(): Promise<void> {
    if (this._recordingId === undefined) {
      const req = this._createRecordingRequest(this._startUri);
      const rsp = await this._httpClient.sendRequest(req);
      if (rsp.status !== 200) {
        throw new Error("Start request failed.");
      }
      const id = rsp.headers.get("x-recording-id");
      if (!id) {
        throw new Error("No recording ID returned.");
      }
      this._recordingId = id;
    }
  }

  async stop(): Promise<void> {
    if (this._recordingId !== undefined) {
      const req = this._createRecordingRequest(this._stopUri);
      req.headers.set("x-recording-save", "true");
      await this._httpClient.sendRequest(req);
    }
  }

  private _createRecordingRequest(uri: string) {
    const req = new WebResource(uri, "POST");
    req.headers.set("x-recording-file", this._sessionFile);
    if (this._recordingId !== undefined) {
      req.headers.set("x-recording-id", this._recordingId);
    }
    return req;
  }
}

export function createRecordedClient(_context: Context): RecordedClient {
  const credential = new ClientSecretCredential(
    testEnv.AZURE_TENANT_ID,
    testEnv.AZURE_CLIENT_ID,
    testEnv.AZURE_CLIENT_SECRET);

  // !!HACK
  const file = `c:/temp/recording/${_context.currentTest?.fullTitle()}.json`;

  let recorder = { async stop() {} } as Recorder; 
  const options: SchemaRegistryClientOptions = {};
  if (isRecordMode() || isPlaybackMode()) {
    recorder = options.httpClient = new RecordingHttpClient(file, isPlaybackMode());
  }

  const client = new SchemaRegistryClient(testEnv.SCHEMA_REGISTRY_ENDPOINT, credential, options);
  return { client, recorder };
}
