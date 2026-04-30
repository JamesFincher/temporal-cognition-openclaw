export type Id<TableName extends string> = string & {
  readonly __tableName: TableName;
};
export type Doc<TableName extends string> = Record<string, unknown> & {
  _id: Id<TableName>;
  _creationTime: number;
};
