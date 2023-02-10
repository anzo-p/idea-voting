export interface Authorizer {
  name: string;
  type: string;
  arn: { "Fn::GetAtt": string[] };
}
