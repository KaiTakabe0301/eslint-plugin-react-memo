import type { Node, Identifier } from 'estree';

export type NodeWithParent = Node & {
  parent?: Node & {
    type: string;
    id?: Identifier;
  };
};
