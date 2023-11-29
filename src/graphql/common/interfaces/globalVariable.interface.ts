export interface GlobalVariableProps {
  PK: string;
  environmentValues: EnvironmentValuesProps[];
}

export interface EnvironmentValuesProps {
  fieldName: string;
  fieldValue: string;
  default: boolean;
}
