// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { PipelineOptions, OperationOptions } from "@azure/core-http";

/**
 * Identifies a Schema by its unique ID, version, and location.
 */
export interface SchemaProperties {
  /** ID that uniquely identifies a schema in the registry namespace. */
  schemaId: string;

  /**
   * Serialization type of schema.
   * Currently only 'avro' is supported, but this is subject to change.
   */
  serializationType: string;

  /** Automatically incremented version number of the schema. */
  version: number;

  /** URL of schema by group and name. */
  location: string;

  /** URL of schema by ID. */
  locationById: string;
}

/**
 * Schema definition with its unique ID, version, and location.
 */
export interface Schema {
  /** String representation of schema. */
  schemaContent: string;
  /** Schema properties */
  schemaProperties: SchemaProperties;
}

/**
 * Options for SchemaRegistrationClient.
 */
export interface SchemaRegistryClientOptions extends PipelineOptions {}

/**
 * Options for SchemaRegistryClient.registerSchema.
 */
export interface RegisterSchemaOptions extends OperationOptions {}

/**
 * Options for SchemaRegistryClient.getSchemaId.
 */
export interface GetSchemaIdOptions extends OperationOptions {}

/**
 * Options to configure SchemaRegistryClient.getSchemaById.
 */
export interface GetSchemaByIdOptions extends OperationOptions {}

/**
 * Represents a store of registered schemas.
 *
 * Implemented by SchemaRegistryClient to store the schemas using the Azure
 * Schema Registry service.
 */
export interface SchemaRegistry {
  /**
   * Registers a new schema and returns its ID.
   *
   * If schema of specified name does not exist in the specified group, a schema
   * is created at version 1. If schema of specified name exists already in
   * specified group, schema is created at latest version + 1.
   *
   * @param schema Schema to register.
   * @return Registered schema's ID.
   *
   */
  registerSchema(
    schemaGroup: string,
    schemaName: string,
    serializationType: string,
    schemaContent: string,
    options?: RegisterSchemaOptions
  ): Promise<SchemaProperties>;

  /**
   * Gets the ID of an existing schema with matching name, group, type, and
   * content.
   *
   * @param schema Schema to match.
   * @return Matched schema's ID.
   */
  getSchemaId(
    schemaGroup: string,
    schemaName: string,
    serializationType: string,
    schemaContent: string,
    options?: GetSchemaIdOptions
  ): Promise<SchemaProperties>;

  /**
   * Gets an existing schema by ID.
   *
   * @param id Unique schema ID.
   * @return Schema with given ID.
   */
  getSchema(id: string, options?: GetSchemaByIdOptions): Promise<Schema>;
}
