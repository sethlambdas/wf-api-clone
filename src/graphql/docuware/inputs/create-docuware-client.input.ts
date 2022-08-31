import { InputType } from '@nestjs/graphql';

import { CreateClientInput } from '../../client/inputs/create-client.input';

@InputType()
export class CreateDocuwareClientInput extends CreateClientInput {}
