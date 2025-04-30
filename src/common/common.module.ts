import { Module } from '@nestjs/common';
import { GraphQLJSONScalar } from './scalars/json.scalar';

@Module({
  providers: [GraphQLJSONScalar],
  exports: [GraphQLJSONScalar],
})
export class CommonModule {}