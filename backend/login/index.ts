import { AdminInitiateAuthCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEventV2WithJWTAuthorizer, Context } from "aws-lambda";

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
export const handler = async (
  {
    rawPath,
    body,
    ...event
  }: APIGatewayProxyEventV2WithJWTAuthorizer,
  context: Context,
) => {
  const {
    username,
    password
  } = JSON.parse(body as string);
  const command = new AdminInitiateAuthCommand({
    UserPoolId: process.env.USER_POOL_ID,
    ClientId: process.env.CLIENT_ID,
    AuthFlow: "ADMIN_NO_SRP_AUTH",
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  });
  const authCommandResponse = await client.send(command);
  if(!authCommandResponse?.AuthenticationResult) throw new Error('Incorrect data provided');
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expiresIn: authCommandResponse.AuthenticationResult.ExpiresIn ?? 0,
      token: authCommandResponse.AuthenticationResult.AccessToken ?? "",
    }),
  };
}