// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { SchemaProperties, Schema } from "./models";

import {
  SchemaGetByIdResponse,
  SchemaRegisterResponse,
  SchemaQueryIdByContentResponse
} from "./generated/models";

/**
 * Union of generated client's responses that return schema content.
 */
type GeneratedSchemaResponse = SchemaGetByIdResponse;

/**
 * Union of generated client's responses that return schema ID.
 */
type GeneratedSchemaIdResponse = SchemaRegisterResponse | SchemaQueryIdByContentResponse;

/**
 * Union of all generated client's responses.
 */
type GeneratedResponse = GeneratedSchemaResponse | GeneratedSchemaIdResponse;

/**
 * Converts generated client's reponse to IdentifiedSchemaResponse.
 *
 * @internal
 */
export function convertSchemaResponse(response: GeneratedSchemaResponse): Schema {
  const converted = {
    schemaContent: response.body,
    schemaProperties: convertResponse(response)
  };

  Object.defineProperty(converted, "_response", { value: response._response, enumerable: false });
  return converted;
}

/**
 * Converts generated client's response to SchemaIdentityResponse.
 *
 * @internal
 */
export function convertSchemaIdResponse(response: GeneratedSchemaIdResponse): SchemaProperties {
  const converted = convertResponse(response);
  // `!` here because server is required to return this on success, but that
  // is not modeled by the generated client.
  converted.schemaId = response.id!;
  Object.defineProperty(converted, "_response", { value: response._response, enumerable: false });
  return converted;
}

function convertResponse(response: GeneratedResponse): SchemaProperties {
  return {
    // `!`s here because server is required to return these on success, but that
    // is not modeled by the generated client.
    location: response.location!,
    locationById: response.xSchemaIdLocation!,
    schemaId: response.xSchemaId!,
    version: response.xSchemaVersion!,
    serializationType: response.xSchemaType!
  };
}
