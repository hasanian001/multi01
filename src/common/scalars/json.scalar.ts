import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('JSON', () => Object)
export class GraphQLJSONScalar implements CustomScalar<any, any> {
  description = 'JSON custom scalar type';

  parseValue(value: any): any {
    return value;
  }

  serialize(value: any): any {
    return value;
  }

  parseLiteral(ast: ValueNode): any {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch (error) {
        return ast.value;
      }
    }
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null);
      ast.fields.forEach((field) => {
        value[field.name.value] = this.parseLiteral(field.value);
      });
      return value;
    }
    if (ast.kind === Kind.LIST) {
      return ast.values.map((n) => this.parseLiteral(n));
    }
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10);
    }
    if (ast.kind === Kind.FLOAT) {
      return parseFloat(ast.value);
    }
    if (ast.kind === Kind.BOOLEAN) {
      return ast.value;
    }
    return null;
  }
}