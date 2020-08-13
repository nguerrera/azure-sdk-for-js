// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Schema definition.
 */
export interface SchemaDefinition {
  /** String representation of schema. */
  content: string;
}

/**
 * Identifies a Schema by its unique ID, version, and location.
 */
export interface SchemaId {
  /** ID that uniquely identifies a schema in the registry namespace. */
  id: string;

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
export interface Schema extends SchemaDefinition, SchemaId {}

/**
 * Schema definition with its group, name, and serialization type.
 */
export interface SchemaDescription extends SchemaDefinition {
  /** Schema group under which schema is or should be registered. */
  group: string;

  /** Name of schema.*/
  name: string;

  /**
   * Serialization type of schema. Must match serialization type of group.
   * Currently only 'avro' is supported, but this is subject to change.
   */
  serializationType: string;
}
